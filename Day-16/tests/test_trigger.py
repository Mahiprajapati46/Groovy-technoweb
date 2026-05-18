import requests
import sys
import config

BASE_URL = f"http://127.0.0.1:{config.PORT}"

def simulate_pr_event(pr_number):
    """Simulates a GitHub Pull Request opened event webhook."""
    url = f"{BASE_URL}/github-webhook"
    headers = {"X-GitHub-Event": "pull_request", "Content-Type": "application/json"}
    
    payload = {
        "action": "opened",
        "number": int(pr_number),
        "pull_request": {
            "number": int(pr_number),
            "title": f"Feature Branch: AI Test Audit #{pr_number}",
            "html_url": f"https://github.com/Mahiprajapati46/Groovy-technoweb/pull/{pr_number}",
            "state": "open"
        }
    }
    
    print(f"[INFO] Simulating Pull Request Opened Event for PR #{pr_number}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Response: {response.status_code} - {response.json()}\n")
    except Exception as e:
        print(f"[ERROR] Connection error: {e}. Is your main.py server running on port {config.PORT}?\n")


def simulate_push_event(commit_sha):
    """Simulates a GitHub Commit Push event webhook."""
    url = f"{BASE_URL}/github-webhook"
    headers = {"X-GitHub-Event": "push", "Content-Type": "application/json"}
    
    payload = {
        "after": commit_sha,
        "ref": "refs/heads/main"
    }
    
    print(f"[INFO] Simulating Push Event for Commit SHA {commit_sha[:7]}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Response: {response.status_code} - {response.json()}\n")
    except Exception as e:
        print(f"[ERROR] Connection error: {e}. Is your main.py server running on port {config.PORT}?\n")


def simulate_security_leak_event():
    """
    Directly tests the local agent's security scanner by passing a simulated file
    containing a real leaked key format to verify the Regex + Shannon Entropy sirens.
    """
    print("[SCAN] Simulating a mock security leak evaluation locally...")
    from agent_core import scan_for_secrets_in_content
    
    leak_file_content = """
    # Mock application config
    DB_HOST = "localhost"
    GEMINI_API_KEY = "AIzaSy" + "DUMMY_KEY_FOR_TESTING_PURPOSES"
    SLACK_URL = "https://hooks.slack.com/services/" + "T_DUMMY/B_DUMMY/X_DUMMY"
    """
    
    leaks = scan_for_secrets_in_content(leak_file_content)
    print(f"[RESULT] Leaks Found by Sentinel: {leaks}")
    if len(leaks) >= 2:
        print("[SUCCESS] Both Gemini Key and Slack Webhook were correctly caught by the Entropy Filter!\n")
    else:
        print("[FAILURE] Verification failed. Entropy threshold might be too restrictive.\n")


def simulate_slack_merge_event(pr_number):
    """Simulates a Slack interactive button click for Approve & Merge on localhost."""
    import json
    url = f"{BASE_URL}/slack-interactive"
    
    payload_data = {
        "type": "block_actions",
        "response_url": "https://hooks.slack.com/actions/mock/response",
        "actions": [
            {
                "action_id": "merge_pr_action",
                "block_id": "merge_block",
                "value": f"Mahiprajapati46|Groovy-technoweb|{pr_number}",
                "type": "button"
            }
        ]
    }
    
    print(f"[INFO] Simulating Slack 'Approve & Merge' click for PR #{pr_number}...")
    try:
        response = requests.post(url, data={"payload": json.dumps(payload_data)})
        print(f"Response: {response.status_code}. Interactive merge event dispatched successfully!")
        print("[INFO] Check your main.py terminal to watch the pre-merge security audits and merge execution trace!")
    except Exception as e:
        print(f"[ERROR] Connection error: {e}. Is your main.py server running on port {config.PORT}?\n")


def fetch_latest_open_pr():
    """Queries GitHub for the latest open Pull Request number in the repository."""
    import config
    url = f"https://api.github.com/repos/{config.REPO_OWNER}/{config.REPO_NAME}/pulls"
    headers = {"Authorization": f"token {config.GITHUB_TOKEN}"}
    params = {"state": "open", "sort": "updated", "direction": "desc"}
    
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            prs = response.json()
            if prs:
                latest_pr = prs[0]
                print(f"[INFO] Automatically identified latest open PR #{latest_pr['number']}: '{latest_pr['title']}'")
                return latest_pr["number"]
            else:
                print("[INFO] No active open Pull Requests found in repository.")
        else:
            print(f"[WARNING] GitHub list API returned status {response.status_code}. Defaulting to PR #1.")
    except Exception as e:
        print(f"[WARNING] Failed to fetch open PR list: {e}. Defaulting to PR #1.")
    return 1


if __name__ == "__main__":
    print("=== AI Reviewer Webhook Simulator CLI ===")
    print("---------------------------------------")
    print("Commands:")
    print("  pr               - Trigger review on the latest open PR automatically")
    print("  pr <number>      - Trigger review on specific PR number")
    print("  merge            - Simulate Slack 'Approve & Merge' button click on latest PR")
    print("  merge <number>   - Simulate Slack 'Approve & Merge' button click on specific PR")
    print("  push <sha>       - Trigger audit on specific Commit SHA")
    print("  security         - Run local Shannon Entropy scanner test")
    print("---------------------------------------")
    
    if len(sys.argv) < 2:
        print("Usage example: python test_trigger.py pr")
        sys.exit(0)
        
    cmd = sys.argv[1].lower()
    
    if cmd == "pr":
        if len(sys.argv) > 2:
            pr_num = int(sys.argv[2])
        else:
            pr_num = fetch_latest_open_pr()
        simulate_pr_event(pr_num)
    elif cmd == "merge":
        if len(sys.argv) > 2:
            pr_num = int(sys.argv[2])
        else:
            pr_num = fetch_latest_open_pr()
        simulate_slack_merge_event(pr_num)
    elif cmd == "push":
        sha = sys.argv[2] if len(sys.argv) > 2 else "baacfb7d81ba4269935c185c7c5d7647"
        simulate_push_event(sha)
    elif cmd == "security":
        simulate_security_leak_event()
    else:
        print(f"[ERROR] Unknown command '{cmd}'. Available: 'pr', 'merge', 'push', 'security'")
