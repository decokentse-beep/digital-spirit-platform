#!/usr/bin/env python3
"""
Telegram Bridge - With Menu + Service Flow
Full automation for new customers
"""

import requests
import json
import time
import os

# Configuration - Load from environment or config file
BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
DRIVER_URL = os.environ.get('DRIVER_URL', 'http://localhost:9100/chat')

# If no token, prompt user
if not BOT_TOKEN:
    print("ERROR: TELEGRAM_BOT_TOKEN not set!")
    print("Please set environment variable or create config.ini")
    exit(1)

# Whitelist - ONLY these users can use the bot
# Add user IDs separated by comma
ALLOWED_USERS_STR = os.environ.get('ALLOWED_USERS', '6054796337')
ALLOWED_USERS = [int(uid.strip()) for uid in ALLOWED_USERS_STR.split(',')]

# Service Menu
MENU_TEXT = """
🐾 Digital Spirit Menu

Welcome! Your AI companion is ready.

Available services:
1. 💬 Chat with your Digital Spirit
2. 📊 Check status
3. ⚙️ Settings
4. ❓ Help

Simply send a message to start!
"""

def send_menu(user_id):
    """Send service menu to user"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        'chat_id': user_id,
        'text': MENU_TEXT,
        'parse_mode': 'Markdown'
    }
    requests.post(url, json=payload)

def forward_to_driver(message):
    """Forward message to local driver"""
    try:
        response = requests.post(
            DRIVER_URL,
            json={'message': message['text'], 'user_id': message['from']['id']},
            timeout=10
        )
        return response.json().get('reply', 'Message received!')
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    """Main polling loop"""
    offset = None
    
    while True:
        try:
            # Get updates
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
            params = {'timeout': 60, 'offset': offset}
            
            response = requests.get(url, params=params)
            updates = response.json().get('result', [])
            
            for update in updates:
                offset = update['update_id'] + 1
                
                if 'message' not in update:
                    continue
                
                message = update['message']
                user_id = message['from']['id']
                
                # Check whitelist
                if user_id not in ALLOWED_USERS:
                    continue
                
                # Handle message
                text = message.get('text', '')
                
                if text == '/start':
                    send_menu(user_id)
                else:
                    # Forward to driver
                    reply = forward_to_driver(message)
                    
                    # Send reply
                    send_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
                    requests.post(send_url, json={
                        'chat_id': user_id,
                        'text': reply
                    })
        
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)

if __name__ == '__main__':
    print("Digital Spirit Telegram Bridge starting...")
    print(f"Driver URL: {DRIVER_URL}")
    main()
