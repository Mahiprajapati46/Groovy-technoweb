# 🚀 Autonomous AI Code Reviewer (PRO)

An elite AI-powered backend agent that automates GitHub Pull Request reviews, performs security scans, and enables one-click merges via Slack. Powered by **Gemini 1.5 Flash**.

---

## 🛠️ Features
- **Security Audit:** Hybrid Regex + Shannon Entropy scanning for secrets (GitHub tokens, API keys, etc.).
- **AI Code Review:** Principal Architect-level critique using Gemini 1.5 Flash.
- **Line-Level Suggestions:** Context-aware code improvements posted directly to GitHub PRs.
- **Slack Integration:** Real-time notifications with interactive "Approve & Merge" capabilities.
- **Asynchronous Processing:** Handles webhooks in background threads to avoid timeouts.

---

## 📂 Project Structure
```text
.
├── main.py             # Flask Webhook Server (Entry Point)
├── agent_core.py       # Core Logic & AI Orchestration
├── github_tools.py     # GitHub API Integrations
├── slack_notifier.py   # Slack Webhook & Notification Logic
├── config.py           # Configuration & Environment Validation
├── requirements.txt    # Python Dependencies
├── .env                # Private Secrets (IGNORED BY GIT)
├── .gitignore          # Git Exclusion Rules
└── tests/              # (Recommended) Development & Trigger Scripts
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Python 3.9+
- A GitHub Personal Access Token (PAT) with `repo` scopes.
- A Slack Webhook URL.
- A Gemini API Key (from Google AI Studio).

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd Day-16

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_key
GITHUB_TOKEN=your_github_token
SLACK_WEBHOOK_URL=your_slack_webhook
REPO_OWNER=your_github_username
REPO_NAME=your_repo_name
PORT=8000
```

---

## 🌐 Making it Live (Production Deployment)

To make this agent "Live" and accessible by GitHub/Slack webhooks, follow these steps:

### Option A: Cloud Hosting (Recommended)
1. **Render / Railway / Fly.io:** These platforms are perfect for Python/Flask apps.
   - Connect your GitHub Repo.
   - Set the **Start Command**: `gunicorn main:app`.
   - Add all `.env` variables in the platform's **Environment Variables** settings.
2. **Webhooks:** Once deployed, you will get a URL (e.g., `https://my-agent.up.railway.app`).
   - **GitHub:** Go to Repo Settings -> Webhooks -> Add Webhook.
     - Payload URL: `https://your-url.com/github-webhook`
     - Content type: `application/json`
     - Events: `Pushes`, `Pull requests`.
   - **Slack:** Update your Slack App settings with the interactive URL: `https://your-url.com/slack-interactive`.

### Option B: Local Tunneling (Development Only)
Use `ngrok` to expose your local server:
```bash
ngrok http 8000
```
*Note: Do not use ngrok for production.*

---

## 🧪 Testing
Run the trigger scripts to simulate webhooks:
```bash
python test_trigger.py
```

---

## 🛡️ Security Note
The `.env` file and `ngrok.exe` are excluded via `.gitignore`. Never commit your actual secrets to a public repository.
