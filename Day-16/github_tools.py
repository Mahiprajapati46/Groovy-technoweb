import requests
import json
import config

HEADERS = {
    "Authorization": f"token {config.GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

# ==========================================
# HELPER: Parsers & Utils
# ==========================================

def parse_diff_patch(patch_str):
    """
    Parses a unified diff patch string.
    Identifies and returns the exact list of line numbers (1-indexed) in the NEW file
    that were added or modified.
    """
    if not patch_str:
        return []
        
    modified_lines = []
    current_new_line = 0
    
    for line in patch_str.split('\n'):
        # Parse hunk header: @@ -old_start,old_len +new_start,new_len @@
        if line.startswith('@@'):
            try:
                parts = line.split('+')
                new_part = parts[1].split(' ')[0]
                if ',' in new_part:
                    current_new_line = int(new_part.split(',')[0])
                else:
                    current_new_line = int(new_part)
            except Exception as e:
                print(f"[WARNING] Error parsing hunk header '{line}': {e}")
            continue
            
        # Parse line markings within hunk
        if line.startswith('+'):
            modified_lines.append(current_new_line)
            current_new_line += 1
        elif line.startswith('-'):
            # Deletions do not advance the new line counter
            continue
        else:
            # Context line advances new line counter
            current_new_line += 1
            
    return modified_lines

def get_pr_latest_commit_sha(owner, repo, pr_number):
    """Fetches the latest commit SHA of a pull request."""
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json().get("head", {}).get("sha")
    return None

# ==========================================
# TOOL 1: fetch_code_context
# ==========================================

def fetch_code_context(owner: str, repo: str, target_type: str, target_id: str) -> dict:
    """
    Fetches the changes and complete file content to provide full semantic context.
    
    target_type: 'pr' (PR review) or 'commit' (Push review)
    target_id: PR number (int/str) or Commit SHA (str)
    """
    result = {"files": [], "target_type": target_type, "target_id": target_id}
    
    # ----------------------------------------
    # CASE A: Pull Request Event
    # ----------------------------------------
    if target_type == "pr":
        pr_files_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{target_id}/files"
        response = requests.get(pr_files_url, headers=HEADERS)
        if response.status_code != 200:
            print(f"[ERROR] Error fetching PR files: {response.status_code} - {response.text}")
            return result
            
        files_list = response.json()
        for f in files_list:
            filename = f.get("filename")
            patch = f.get("patch", "")
            raw_url = f.get("raw_url")
            status = f.get("status")
            
            # Skip deletions or binary/large files with no patches
            if status == "removed" or not patch:
                continue
                
            # Parse which specific lines were modified
            modified_lines = parse_diff_patch(patch)
            
            # Fetch the full target file content to supply semantic imports/context
            content_response = requests.get(raw_url, headers=HEADERS)
            content = content_response.text if content_response.status_code == 200 else ""
            
            result["files"].append({
                "filename": filename,
                "status": status,
                "patch": patch,
                "modified_lines": modified_lines,
                "content": content
            })
            
    # ----------------------------------------
    # CASE B: Push (Commit) Event
    # ----------------------------------------
    elif target_type == "commit":
        commit_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{target_id}"
        response = requests.get(commit_url, headers=HEADERS)
        if response.status_code != 200:
            print(f"[ERROR] Error fetching commit details: {response.status_code} - {response.text}")
            return result
            
        commit_data = response.json()
        for f in commit_data.get("files", []):
            filename = f.get("filename")
            patch = f.get("patch", "")
            raw_url = f.get("raw_url")
            status = f.get("status")
            
            if status == "removed" or not patch:
                continue
                
            modified_lines = parse_diff_patch(patch)
            content_response = requests.get(raw_url, headers=HEADERS)
            content = content_response.text if content_response.status_code == 200 else ""
            
            result["files"].append({
                "filename": filename,
                "status": status,
                "patch": patch,
                "modified_lines": modified_lines,
                "content": content
            })
            
    print(f"[Tool 1] Successfully loaded {len(result['files'])} changed files.")
    return result

# ==========================================
# TOOL 2: write_github_action
# ==========================================

def write_github_action(owner: str, repo: str, action_type: str, payload: dict) -> dict:
    """
    Executes write/mutating actions on GitHub.
    
    action_type:
      - 'post_suggestion': Post a side-by-side suggestion directly on changed PR lines.
      - 'post_emergency_comment': Post security warning comment on PR or Commit.
      - 'merge_pr': Perform safe pre-merge checks (CI status, draft status, mergeability) and merge the PR.
    """
    # ----------------------------------------
    # ACTION 1: Post PR Line-Level Suggestion
    # ----------------------------------------
    if action_type == "post_suggestion":
        pr_number = payload.get("pr_number")
        file_path = payload.get("file_path")
        start_line = payload.get("start_line")
        end_line = payload.get("end_line")
        explanation = payload.get("explanation")
        suggested_change = payload.get("suggested_change")
        
        # Verify PR parameters
        if not all([pr_number, file_path, end_line, suggested_change]):
            return {"status": "error", "message": "Missing suggestion payload parameters."}
            
        latest_sha = get_pr_latest_commit_sha(owner, repo, pr_number)
        if not latest_sha:
            return {"status": "error", "message": "Could not fetch PR head SHA."}
            
        # Build comment URL
        comment_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments"
        
        # Construct GitHub Suggestion Markdown
        comment_body = f"{explanation}\n\n```suggestion\n{suggested_change}\n```"
        
        # Base review comment payload
        comment_payload = {
            "body": comment_body,
            "path": file_path,
            "line": int(end_line),
            "side": "RIGHT",
            "commit_id": latest_sha
        }
        
        # Add start_line for multi-line suggestions
        if start_line and int(start_line) < int(end_line):
            comment_payload["start_line"] = int(start_line)
            comment_payload["start_side"] = "RIGHT"
            
        response = requests.post(comment_url, headers=HEADERS, json=comment_payload)
        
        if response.status_code in [200, 201]:
            print(f"[SUCCESS] Posted Suggestion on PR #{pr_number} for {file_path} at lines {start_line}-{end_line}")
            return {"status": "success", "comment_url": response.json().get("html_url")}
        else:
            # Fallback: If suggestion fails (e.g. line outside diff range), post a standard PR issue comment instead
            print(f"[WARNING] Suggestion API failed ({response.status_code}). Falling back to PR Comment...")
            fallback_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{pr_number}/comments"
            fallback_body = f"💡 **Review Comment for `{file_path}` (Lines {start_line}-{end_line}):**\n\n{explanation}\n\n*Suggested Fix:*\n```\n{suggested_change}\n```"
            fallback_res = requests.post(fallback_url, headers=HEADERS, json={"body": fallback_body})
            if fallback_res.status_code in [200, 201]:
                return {"status": "success", "comment_url": fallback_res.json().get("html_url")}
            return {"status": "error", "message": f"GitHub Comment failed: {response.text}"}

    # ----------------------------------------
    # ACTION 2: Post Emergency Warning Comment
    # ----------------------------------------
    elif action_type == "post_emergency_comment":
        target_id = payload.get("target_id") # Commit SHA or PR Number
        target_type = payload.get("target_type") # 'pr' or 'commit'
        message = payload.get("message")
        
        if target_type == "pr":
            url = f"https://api.github.com/repos/{owner}/{repo}/issues/{target_id}/comments"
        else:
            url = f"https://api.github.com/repos/{owner}/{repo}/commits/{target_id}/comments"
            
        response = requests.post(url, headers=HEADERS, json={"body": message})
        if response.status_code in [200, 201]:
            print(f"[SECURITY Alert] Posted emergency warning comment to {target_type} {target_id}")
            return {"status": "success"}
        return {"status": "error", "message": response.text}

    # ----------------------------------------
    # ACTION 3: Safe Pull Request Merge
    # ----------------------------------------
    elif action_type == "merge_pr":
        pr_number = payload.get("pr_number")
        
        # 1. Fetch Pull Request status details
        pr_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
        pr_res = requests.get(pr_url, headers=HEADERS)
        if pr_res.status_code != 200:
            return {"status": "error", "message": "Failed to retrieve PR details."}
            
        pr_data = pr_res.json()
        
        # Guardrail Checks
        if pr_data.get("draft") is True:
            return {"status": "blocked", "message": "PR is a draft and cannot be merged."}
            
        mergeable = pr_data.get("mergeable")
        if mergeable is False:
            return {"status": "blocked", "message": "Merge conflicts detected. Please resolve on GitHub."}
            
        head_sha = pr_data.get("head", {}).get("sha")
        
        # 2. CI/CD status checks audit
        # A. Fetch combined statuses (legacy status API)
        status_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{head_sha}/status"
        status_res = requests.get(status_url, headers=HEADERS)
        if status_res.status_code == 200:
            combined_state = status_res.json().get("state", "success")
            if combined_state in ["failure", "error"]:
                return {"status": "blocked", "message": f"CI status checks failed (State: {combined_state})."}
        
        # B. Fetch Check Runs (modern GitHub Actions API)
        check_runs_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{head_sha}/check-runs"
        check_res = requests.get(check_runs_url, headers=HEADERS)
        if check_res.status_code == 200:
            runs = check_res.json().get("check_runs", [])
            for run in runs:
                if run.get("status") == "completed" and run.get("conclusion") in ["failure", "action_required", "timed_out", "cancelled"]:
                    run_name = run.get("name", "Action")
                    return {"status": "blocked", "message": f"CI Check Run '{run_name}' failed ({run.get('conclusion')})."}
                    
        # 3. Perform Merge
        merge_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/merge"
        merge_payload = {
            "commit_title": f"PR Auto-Merged by AI Agent #{pr_number}",
            "commit_message": "Enterprise pre-merge safety audits completed successfully. Merge authorized."
        }
        merge_res = requests.put(merge_url, headers=HEADERS, json=merge_payload)
        
        if merge_res.status_code == 200:
            print(f"[SUCCESS] [Tool 2] Successfully merged PR #{pr_number}")
            return {"status": "success", "message": "PR successfully merged! [SUCCESS]"}
        else:
            err_msg = merge_res.json().get("message", "Unknown merge error")
            return {"status": "error", "message": f"GitHub Merge failed: {err_msg}"}
            
    return {"status": "error", "message": f"Unknown action_type '{action_type}'"}
