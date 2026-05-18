import requests
import json
import config

def send_slack_security_alert(owner, repo, target_type, target_id, file_name, leaked_keys):
    """
    Sends a high-priority red alert block to Slack when an API Key is pushed.
    """
    if not config.SLACK_WEBHOOK_URL:
        print("⚠️ [Slack] Webhook URL not set.")
        return False
        
    target_label = f"Pull Request #{target_id}" if target_type == "pr" else f"Commit {target_id[:7]}"
    github_link = f"https://github.com/{owner}/{repo}/pull/{target_id}" if target_type == "pr" else f"https://github.com/{owner}/{repo}/commit/{target_id}"
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🚨 CRITICAL SECURITY ALARM! 🚨",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Repository:* `{owner}/{repo}`\n*Target:* <{github_link}|{target_label}>"
            }
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"🔥 *SECRET LEAK DETECTED!*\n"
                       f"📄 *File:* `{file_name}`\n"
                       f"⚠️ *Leaked Signatures:* `{', '.join(leaked_keys)}`"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "❌ *ACTIONS TAKEN:*\n"
                       "1. **Emergency Warning posted** directly on GitHub.\n"
                       "2. **Merge Lock Activated** (AI Review has been aborted to block code ingestion).\n"
                       "3. **Developer Action Required:** Rotate the compromised key immediately!"
            }
        },
        {"type": "divider"},
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "🛡️ *Security Sentinel Guard active  |  High Entropy Regex Scan*"
                }
            ]
        }
    ]
    
    payload = {"blocks": blocks}
    response = requests.post(
        config.SLACK_WEBHOOK_URL,
        json=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 200:
        print("[SECURITY Alert] [Slack] Emergency Security alert sent successfully!")
        return True
    else:
        print(f"[ERROR] [Slack] Error sending alert: {response.status_code} - {response.text}")
        return False


def send_slack_review_notification(owner, repo, pr_number, pr_title, pr_url, review_summary, files_analyzed):
    """
    Sends a professional, elegant Lead Architect Code Review report to Slack,
    complete with interactive actions (Approve & Merge).
    """
    if not config.SLACK_WEBHOOK_URL:
        print("⚠️ [Slack] Webhook URL not set.")
        return False
        
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🔍 AI LEAD ARCHITECT REVIEW",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Repository:* `{owner}/{repo}`\n"
                       f"*Pull Request:* <{pr_url}|#{pr_number} - {pr_title}>\n"
                       f"📄 *Files Analyzed:* `{', '.join(files_analyzed)}`"
            }
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"📋 *REVIEW SUMMARY:*\n{review_summary}"
            }
        },
        {"type": "divider"},
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "🚀 Approve & Merge PR",
                        "emoji": True
                    },
                    "style": "primary",
                    "value": f"{owner}|{repo}|{pr_number}",
                    "action_id": "merge_pr_action"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "🔍 View Suggestions & Apply Fixes",
                        "emoji": True
                    },
                    "url": f"{pr_url}/files"
                }
            ]
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "🤖 *AI Audit Complete  |  Gemini 2.5 Flash Engine  |  Zero Leaks Passed*"
                }
            ]
        }
    ]
    
    payload = {"blocks": blocks}
    response = requests.post(
        config.SLACK_WEBHOOK_URL,
        json=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 200:
        print("[SUCCESS] [Slack] Premium Review notification sent successfully!")
        return True
    else:
        print(f"[ERROR] [Slack] Error sending review card: {response.status_code} - {response.text}")
        return False


def send_slack_commit_notification(owner, repo, commit_sha, review_summary, files_analyzed):
    """
    Sends a premium Code Audit review summary to Slack on Push events
    (excludes merge buttons since there is no PR to merge).
    """
    if not config.SLACK_WEBHOOK_URL:
        print("⚠️ [Slack] Webhook URL not set.")
        return False
        
    github_link = f"https://github.com/{owner}/{repo}/commit/{commit_sha}"
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🔍 AI PUSH COMMIT AUDIT",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Repository:* `{owner}/{repo}`\n"
                       f"*Commit:* <{github_link}|{commit_sha[:7]}>\n"
                       f"📄 *Files Analyzed:* `{', '.join(files_analyzed)}`"
            }
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"📋 *COMMIT AUDIT REPORT:*\n{review_summary}"
            }
        },
        {"type": "divider"},
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "🤖 *AI Commit Audit Complete  |  Gemini 2.5 Flash Engine*"
                }
            ]
        }
    ]
    
    payload = {"blocks": blocks}
    response = requests.post(
        config.SLACK_WEBHOOK_URL,
        json=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 200:
        print("[SUCCESS] [Slack] Commit Review notification sent successfully!")
        return True
    else:
        print(f"[ERROR] [Slack] Error sending commit review card: {response.status_code} - {response.text}")
        return False

