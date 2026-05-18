import sys
from agent_core import run_agent_review

# Simulate pull_request payload
payload = {
    "action": "opened",
    "number": 8,
    "pull_request": {
        "number": 8,
        "title": "AI Architect Test Audit #8",
        "html_url": "https://github.com/Mahiprajapati46/Groovy-technoweb/pull/8",
        "state": "open"
    }
}

print("Starting Synchronous PR Event Review...")
run_agent_review("pull_request", payload)
print("Finished Synchronous PR Event Review!")
