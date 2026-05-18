import json
import threading
from flask import Flask, request, jsonify
import config

# test CI trigger
app = Flask(__name__)


def handle_github_event_async(event_type, payload):
    """Orchestrates the AI review in a background thread to prevent GitHub timeouts."""
    try:
        from agent_core import run_agent_review
        run_agent_review(event_type, payload)
    except Exception as e:
        print(f"[ERROR] Error executing agent review: {e}")

def handle_slack_interaction_async(payload):
    """Orchestrates Slack interactive clicks in a background thread to prevent Slack timeouts."""
    try:
        from agent_core import handle_slack_merge
        handle_slack_merge(payload)
    except Exception as e:
        print(f"[ERROR] Error executing Slack merge: {e}")

@app.route("/", methods=["GET"])
def index():
    """Sanity status check endpoint."""
    return jsonify({
        "status": "online",
        "agent": "Autonomous 'PRO' Code Reviewer",
        "engine": "Gemini 2.5 Flash",
        "repository": f"{config.REPO_OWNER}/{config.REPO_NAME}"
    })

@app.route("/github-webhook", methods=["POST"])
@app.route("/webhook", methods=["POST"])
def github_webhook():
    """Receives Push and Pull Request triggers from GitHub."""
    event = request.headers.get("X-GitHub-Event")
    payload = request.json
    
    if not payload:
        return jsonify({"status": "error", "message": "Missing JSON payload"}), 400
        
    print(f"[INFO] Received GitHub Webhook Event: '{event}'")
    
    # Process push and pull request events
    if event in ["push", "pull_request"]:
        threading.Thread(
            target=handle_github_event_async, 
            args=(event, payload)
        ).start()
        return jsonify({"status": "triggered", "event": event}), 202
        
    return jsonify({"status": "ignored", "event": event}), 200

@app.route("/slack-interactive", methods=["POST"])
@app.route("/slack/interactive", methods=["POST"])
def slack_interactive():
    """Receives interactive button payloads (like Approve & Merge) from Slack."""
    raw_payload = request.form.get("payload")
    if not raw_payload:
        return jsonify({"status": "error", "message": "Missing payload"}), 400
        
    payload = json.loads(raw_payload)
    print("[INFO] Received Slack Interactive Action Event")
    
    # Process actions in the background
    threading.Thread(
        target=handle_slack_interaction_async,
        args=(payload,)
    ).start()
    
    # Acknowledge the Slack request immediately
    return "", 200

if __name__ == "__main__":
    print(f"[BOOT] AI Lead Architect Server active on port {config.PORT}...")
    app.run(host="0.0.0.0", port=config.PORT, debug=False)
