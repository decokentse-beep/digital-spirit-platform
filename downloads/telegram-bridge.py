#!/usr/bin/env python3
"""
Telegram Bridge - With Menu + Service Flow
Full automation for new customers
"""

import requests
import json
import time
import os

# Configuration
BOT_TOKEN = "8577415131:AAF-zKztmlJuemk1ksUP68AiFIofzZK4ezI"
DRIVER_URL = "http://localhost:9100/chat"

# Whitelist - ONLY these users can use the bot
ALLOWED_USERS = [6054796337]  # Ken's ID

# Service Menu
MENU_TEXT = """
╔══════════════════════════════════════╗
║      🐾 Claw AI Services            ║
╚══════════════════════════════════════╝

🤖 AI SERVICES:
━━━━━━━━━━━━━━
1️⃣ Custom AI Bot
   - Personal AI assistant
   - Your own digital partner
   - Price: $9.99/month

2️⃣ AI Consultant
   - Business AI solutions
   - Automation advice  
   - Price: $29.99/hour

3️⃣ Automation Setup
   - Workflow automation
   - Custom scripts
   - Price: $49.99/one-time

🌐 VR SERVICES:
━━━━━━━━━━━━━━
4️⃣ VR Experience
   - VR with AI partner
   - Immersive meetings
   - Price: $19.99/month

💳 PAYMENT:
━━━━━━━━━━━━━━
- FPS: 51675713
- PayPal: Request link after confirmation

📞 CONTACT:
━━━━━━━━━━━━━━
WhatsApp: +85251675713

━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply with number to get started!
"""

# Telegram API
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

def send_message(chat_id, text):
    url = f"{TELEGRAM_API}/sendMessage"
    data = {"chat_id": chat_id, "text": text}
    requests.post(url, json=data)

def get_updates(offset=None):
    url = f"{TELEGRAM_API}/getUpdates"
    params = {"timeout": 30}
    if offset:
        params["offset"] = offset
    return requests.get(url, params=params).json()

def main():
    print(f"""
╔══════════════════════════════════════╗
║  📱 Telegram Bridge - With Menu      ║
║     Services + Automation           ║
╚══════════════════════════════════════╝

Driver: {DRIVER_URL}
Allowed users: {len(ALLOWED_USERS)} person(s)
Menu: ENABLED

Waiting for messages...
    """)
    
    offset = None
    
    while True:
        try:
            updates = get_updates(offset)
            
            if "result" in updates and len(updates["result"]) > 0:
                for update in updates["result"]:
                    offset = update["update_id"] + 1
                    
                    if "message" in update:
                        chat_id = update["message"]["chat"]["id"]
                        user_id = update["message"]["from"]["id"]
                        text = update["message"].get("text", "")
                        
                        # Check if new user (not in allowed list and no previous interaction)
                        is_new_user = user_id not in ALLOWED_USERS
                        
                        if is_new_user:
                            # Send menu to new users
                            print(f"👋 New user {user_id}, sending menu...")
                            send_message(chat_id, MENU_TEXT)
                            send_message(chat_id, "Welcome! Reply with a number to get started!")
                            continue
                        
                        # For allowed users, process normally
                        if user_id in ALLOWED_USERS:
                            if text:
                                print(f"📨 From {user_id} ({user_id}): {text}")
                                
                                # Check if menu request
                                if text in ["1","2","3","4","menu","services"]:
                                    send_message(chat_id, MENU_TEXT)
                                    continue
                                
                                # Send to Driver with user_id
                                response = requests.post(
                                    DRIVER_URL,
                                    json={"message": text, "user_id": user_id},
                                    timeout=60
                                )
                                
                                if response.status_code == 200:
                                    result = response.json()
                                    claw_response = result.get("response", "No response")
                                else:
                                    claw_response = "Driver error"
                                
                                print(f"🤖 Response: {claw_response[:50]}...")
                                send_message(chat_id, claw_response)
                        else:
                            # Blocked user - but we already handled this above
                            pass
            
            time.sleep(1)
            
        except KeyboardInterrupt:
            print("\n👋 Bridge stopped")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
