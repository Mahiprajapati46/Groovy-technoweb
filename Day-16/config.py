import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

REQUIRED_VARS = [
    "GEMINI_API_KEY",
    "GITHUB_TOKEN",
    "SLACK_WEBHOOK_URL",
    "REPO_OWNER",
    "REPO_NAME"
]

missing_vars = [var for var in REQUIRED_VARS if not os.getenv(var)]

if missing_vars:
    print(f"[CRITICAL CONFIG ERROR] Missing required environment variables: {', '.join(missing_vars)}")
    print("Please check your Day-16/.env file configuration.")
    sys.exit(1)

# Exported configuration properties
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")
REPO_OWNER = os.getenv("REPO_OWNER")
REPO_NAME = os.getenv("REPO_NAME")
PORT = int(os.getenv("PORT", 8000))

print("[SUCCESS] Day-16 Configuration Successfully Loaded & Validated.")
