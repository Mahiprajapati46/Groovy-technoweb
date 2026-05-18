import re
import math
import config
from github_tools import fetch_code_context, write_github_action
from slack_notifier import send_slack_security_alert, send_slack_review_notification

# ==========================================
# HYBRID SECURITY SCANNER LOGIC
# ==========================================

def calculate_shannon_entropy(s: str) -> float:
    """Calculates the Shannon Entropy of a string to measure its randomness."""
    if not s:
        return 0.0
    probabilities = [float(s.count(c)) / len(s) for c in set(s)]
    entropy = -sum(p * math.log(p, 2) for p in probabilities)
    return entropy

def scan_for_secrets_in_content(content: str) -> list:
    """
    Scans code content for credentials using a hybrid Regex + Shannon Entropy approach.
    Only triggers on high-entropy random values to eliminate false positives.
    """
    patterns = [
        # GitHub Tokens
        r"(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,255}",
        # Gemini Key
        r"AIzaSy[0-9A-Za-z-_]{33}",
        # Slack Webhook Webhooks
        r"https://hooks.slack.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[a-zA-Z0-9_]+",
        # Groq GSK key
        r"gsk_[a-zA-Z0-9]{30,}",
        # Generic API keys or passwords in configs
        r"(?:api_key|apikey|secret|password|token)[\s]*[:=][\s]*[\"']([a-zA-Z0-9_\-]{16,})[\"']"
    ]
    
    leaks = []
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            candidate = match[1] if isinstance(match, tuple) else match
            
            # Entropy Filter: Real secrets represent high-randomness characters
            # Standard passwords/keys have an entropy threshold > 3.4
            entropy = calculate_shannon_entropy(candidate)
            if len(candidate) >= 12 and entropy >= 3.4:
                # Obfuscate for security reporting
                obfuscated = f"{candidate[:6]}...{candidate[-4:]}"
                if obfuscated not in leaks:
                    leaks.append(obfuscated)
                    
    return leaks

# ==========================================
# CORE ENTRY POINTS & WEBHOOK ROUTING
# ==========================================

def run_agent_review(event_type: str, payload: dict):
    """
    Main webhook entry point.
    Dispatched asynchronously from main.py on incoming GitHub Push/PR events.
    """
    owner = config.REPO_OWNER
    repo = config.REPO_NAME
    
    print(f"[INFO] Running AI Review Agent on event: '{event_type}'")
    
    # 1. Parse Event Details & Targets
    target_type = None
    target_id = None
    pr_title = ""
    pr_url = ""
    
    if event_type == "pull_request":
        # We only review on opened, reopened, or synchronized (new code push) actions
        action = payload.get("action")
        if action not in ["opened", "reopened", "synchronize"]:
            print(f"[INFO] PR Action '{action}' ignored. Standing by...")
            return
            
        pr_data = payload.get("pull_request", {})
        target_type = "pr"
        target_id = pr_data.get("number")
        pr_title = pr_data.get("title", "")
        pr_url = pr_data.get("html_url", "")
        print(f"[PR Event] PR #{target_id}: '{pr_title}'")
        
    elif event_type == "push":
        # Use latest commit SHA on push
        target_type = "commit"
        target_id = payload.get("after")
        if not target_id or target_id.startswith("000000"):
            print("[INFO] Blank commit push event ignored.")
            return
        print(f"[PUSH Event] Latest Commit SHA: {target_id[:7]}")
        
    else:
        print(f"[WARNING] Event '{event_type}' not supported.")
        return

    # 2. Tool 1: Fetch Code Context (Diff patch + Full semantic file contents)
    code_context = fetch_code_context(owner, repo, target_type, target_id)
    files = code_context.get("files", [])
    
    if not files:
        print("[INFO] No reviewable file changes found.")
        return

    # 3. Security Scan FIRST (Outside the LLM)
    secrets_found = False
    for file in files:
        leaks = scan_for_secrets_in_content(file["content"])
        if leaks:
            secrets_found = True
            print(f"[SECURITY Alert] SECRET LEAK DETECTED in file: '{file['filename']}'!")
            
            # Post Warning on GitHub
            warning_msg = (
                f"🚨 **CRITICAL SECURITY ALERT!** 🚨\n\n"
                f"An active credential or API Key has been pushed to `{file['filename']}`.\n"
                f"• Leaks Identified: `{', '.join(leaks)}` (obfuscated for protection)\n\n"
                f"⚠️ *Please rotate your credentials immediately!* Merges have been locked."
            )
            
            write_github_action(owner, repo, "post_emergency_comment", {
                "target_id": target_id,
                "target_type": target_type,
                "message": warning_msg
            })
            
            # Send Slack Sirens
            send_slack_security_alert(owner, repo, target_type, target_id, file["filename"], leaks)
            
    # Halts execution to block unsafe merges and prevent expensive LLM calls
    if secrets_found:
        print("[SECURITY Alert] Review aborted due to security vulnerabilities.")
        return

    # 4. Gemini "PRO" AI Code Review (Will be completed in Step 4)
    print("[INFO] Security checks passed. Dispatched to Gemini Code Audit engine...")
    try:
        from agent_core import run_gemini_audit
        run_gemini_audit(owner, repo, target_type, target_id, pr_title, pr_url, files)
    except ImportError:
        # Temporary fallback for testing Step 3 before Step 4 is implemented
        print("🏗️ Gemini Code Audit engine is under construction.")


def run_gemini_audit(owner, repo, target_type, target_id, pr_title, pr_url, files):
    """
    Performs AI code audit on modified files using Gemini 2.5 Flash.
    Generates deterministic line-level suggestions and posts comments on GitHub.
    Sends interactive Slack summary.
    """
    import google.generativeai as genai
    import json
    from slack_notifier import send_slack_commit_notification
    
    genai.configure(api_key=config.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    review_findings = []
    files_analyzed = []
    
    for file in files:
        filename = file["filename"]
        content = file["content"]
        modified_lines = file["modified_lines"]
        patch = file["patch"]
        
        files_analyzed.append(filename)
        
        system_instruction = (
            "You are the elite AI Lead Architect and Principal Security Auditor.\n"
            "Your goal is to perform a straightforward, highly professional, elite code review.\n\n"
            "CRITICAL REVIEW GUIDELINES:\n"
            "1. ARCHITECT CRITIQUE: Provide a blunt, straightforward review summary of the file design, highlighting: (a) Overall architectural quality, (b) Structural changes made, (c) Key observations or potential risks. Keep it concise, professional, and straight to the point.\n"
            "2. LINE-LEVEL SUGGESTIONS: You MUST inspect only the modified lines. If you identify any style issues, security vulnerabilities, logical bugs, or performance bottlenecks, describe them exactly using this template:\n"
            "   - WHAT IS THE BUG: [Explain straightforwardly what the issue is]\n"
            "   - HOW TO FIX IT: [Explain concisely how this suggested replacement code fixes it]\n"
            "   List them with the exact replacement code in 'suggested_change'. If no issues exist, leave 'line_suggestions' empty.\n\n"
            "You MUST respond ONLY with a valid JSON object matching this schema exactly:\n"
            "{\n"
            "  \"architect_critique\": \"Overall review summary and file feedback...\",\n"
            "  \"line_suggestions\": [\n"
            "    {\n"
            "      \"start_line\": 12,\n"
            "      \"end_line\": 15,\n"
            "      \"issue_type\": \"bug | security | optimization | style\",\n"
            "      \"explanation\": \"WHAT IS THE BUG: ... \\nHOW TO FIX IT: ...\",\n"
            "      \"suggested_change\": \"exact replacement code lines\"\n"
            "    }\n"
            "  ]\n"
            "}"
        )
        
        user_prompt = (
            f"FILE NAME: {filename}\n"
            f"MODIFIED LINE NUMBERS: {list(modified_lines)}\n\n"
            f"--- CURRENT FILE CONTENT (FULL SEMANTIC CONTEXT) ---\n"
            f"{content}\n\n"
            f"--- RECENT PATCH DIFF ---\n"
            f"{patch}\n\n"
            f"Generate the comprehensive architectural review and line suggestions matching the schema."
        )
        
        print(f"[AI] Querying Gemini 2.5 Flash for file: '{filename}'...")
        try:
            response = model.generate_content(
                contents=[
                    {"role": "user", "parts": [system_instruction + "\n\n" + user_prompt]}
                ],
                generation_config={"response_mime_type": "application/json"}
            )
            
            resp_text = response.text.strip()
            if resp_text.startswith("```"):
                resp_text = re.sub(r"^```(?:json)?\n", "", resp_text)
                resp_text = re.sub(r"\n```$", "", resp_text)
                
            audit_result = json.loads(resp_text)
            critique = audit_result.get("architect_critique", "No critique generated.")
            suggestions = audit_result.get("line_suggestions", [])
            
            print(f"[SUCCESS] Gemini completed audit of '{filename}'. Suggestions found: {len(suggestions)}")
            
            # Format high-level elite Slack feedback
            finding_block = f"📄 *File:* `{filename}`\n" \
                            f"💬 *Architectural Critique:*\n{critique}\n"
            
            if suggestions:
                finding_block += "\n💡 *Suggested Inline Fixes:*\n"
                for sug in suggestions:
                    try:
                        start_l = int(sug.get("start_line", 0))
                        end_l = int(sug.get("end_line", 0))
                        issue_t = sug.get("issue_type", "optimization")
                        explain = sug.get("explanation", "AI Optimization suggested.")
                        sug_change = sug.get("suggested_change", "")
                        
                        if end_l <= 0:
                            continue

                        # Only post GitHub suggestion if there is replacement code
                        if target_type == "pr" and sug_change:
                            write_github_action(owner, repo, "post_suggestion", {
                                "pr_number": target_id,
                                "file_path": filename,
                                "start_line": start_l,
                                "end_line": end_l,
                                "explanation": f"💡 **AI Architect Review [{issue_t.upper()}]:** {explain}",
                                "suggested_change": sug_change
                            })

                        # Always render in Slack — deletion or replacement
                        line_label = f"Lines {start_l}-{end_l}" if start_l != end_l else f"Line {start_l}"
                        if not sug_change:
                            finding_block += f"• `{line_label}` *[{issue_t}]* — 🗑️ *Delete this line.* {explain}\n"
                        else:
                            finding_block += f"• `{line_label}` *[{issue_t}]*: {explain}\n```\n{sug_change[:300]}\n```\n"
                    except Exception as ex:
                        print(f"[WARNING] Error processing individual suggestion: {ex}")
                        
            review_findings.append(finding_block)
            
        except Exception as e:
            print(f"[ERROR] Error auditing file '{filename}' with Gemini: {e}")
            review_findings.append(f"📄 `{filename}`:\n• ⚠️ *Audit Failed:* Gemini was unable to review this file due to an error.")

    # 5. Send Unified Review Notification to Slack
    if review_findings:
        summary_text = "\n\n".join(review_findings)
    else:
        summary_text = "✅ **Pristine Review!** No files analyzed."
        
    if target_type == "pr":
        send_slack_review_notification(owner, repo, target_id, pr_title, pr_url, summary_text, files_analyzed)
    else:
        send_slack_commit_notification(owner, repo, target_id, summary_text, files_analyzed)


def handle_slack_merge(payload):
    """
    Asynchronously processes the interactive Slack payload.
    Triggers Tool 2's secure PR merge after verifying CI, conflicts, and draft status.
    Replies directly to Slack to update the message dynamically.
    """
    import requests
    
    actions = payload.get("actions", [])
    response_url = payload.get("response_url")
    
    if not actions or not response_url:
        print("⚠️ [Slack Merge] Missing actions or response_url in payload.")
        return
        
    action = actions[0]
    action_id = action.get("action_id")
    
    if action_id == "merge_pr_action":
        value = action.get("value")
        owner, repo, pr_number = value.split("|")
        
        print(f"[Slack Merge] Received authorization trigger for PR #{pr_number}")
        
        # Trigger Tool 2 to run pre-merge audits and merge the PR
        merge_res = write_github_action(owner, repo, "merge_pr", {"pr_number": int(pr_number)})
        status = merge_res.get("status")
        message = merge_res.get("message", "")
        
        # Build interactive Slack response to replace the buttons
        if status == "success":
            text = f"✅ *Pull Request #{pr_number} successfully merged!* 🚀\nPre-merge audits (CI checks, conflicts, draft status) passed. Code successfully integrated."
            color = "#2eb886" # Green
        elif status == "blocked":
            text = f"❌ *Pull Request #{pr_number} Merge Blocked!*\n⚠️ *Reason:* {message}"
            color = "#a30200" # Red
        else:
            text = f"❌ *Pull Request #{pr_number} Merge Failed!*\n⚠️ *Error:* {message}"
            color = "#a30200" # Red
            
        update_payload = {
            "replace_original": "true",
            "attachments": [
                {
                    "color": color,
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": text
                            }
                        }
                    ]
                }
            ]
        }
        
        requests.post(response_url, json=update_payload)
        print(f"[SUCCESS] [Slack Merge] Replied to Slack status update url. Merge result: '{status}'")
