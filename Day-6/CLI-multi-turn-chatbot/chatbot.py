#!/usr/bin/env python3
"""
CLI Multi-Turn Chatbot with Anthropic API
Maintains conversation history for context-aware responses
"""

import anthropic
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    # Get API key from environment variable
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY not found in .env file")
        return

    client = anthropic.Anthropic(api_key=api_key)
    
    # Conversation history - maintains context across turns
    conversation_history = []
    
    print("=" * 60)
    print("🤖 CLI Multi-Turn Chatbot (Anthropic Claude)")
    print("=" * 60)
    print("Type 'exit' or 'quit' to end the conversation\n")
    
    while True:
        try:
            # Get user input
            user_input = input("You: ").strip()
            
            # Exit conditions
            if user_input.lower() in ["exit", "quit", "bye"]:
                print("\nBot: Goodbye! Thanks for chatting with me. 👋")
                break
            
            # Skip empty input
            if not user_input:
                continue
            
            # Add user message to history
            conversation_history.append({
                "role": "user",
                "content": user_input
            })
            
            # Send request to Claude with full conversation history
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=conversation_history
            )
            
            # Extract assistant response
            assistant_message = response.content[0].text
            
            # Add assistant response to history
            conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })
            
            # Display response
            print(f"\nBot: {assistant_message}\n")
            
        except KeyboardInterrupt:
            print("\n\nBot: Chat interrupted. Goodbye! 👋")
            sys.exit(0)
        except anthropic.APIError as e:
            print(f"\n❌ API Error: {e}")
            break

if __name__ == "__main__":
    main()
