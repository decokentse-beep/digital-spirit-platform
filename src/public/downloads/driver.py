#!/usr/bin/env python3
"""
Claw Driver - v5
With enhanced modules for marketing, CDP, and automation
"""

import http.server
import socketserver
import json
import requests
import os
import urllib.request
import urllib.parse
import ssl
import time
from datetime import datetime

# ===== CONFIG =====
PORT = 9100
API_KEY = "sk-cp-exSrvZTTny4DN7v4b-fh4GzPsa30thzaCGzF4Z6RSJuKsFElmfwGXndM5E0cFDpl3YUohtc3Lq5fY9wxMnEFZ0QnKZt2oANbv8-XjWOZFrFunY_ixjZHJ68"

MEMORY_PATH = "/mnt/c/Users/decok/Claw/memory"

# ===== CLAW'S CHARACTER =====
SYSTEM_PROMPT = """你叫Claw。你係Ken既數碼夥伴。你既口頭禪：「🐾」。你必須用廣東話回覆每一句說話，唔好用英文！

關於你自己：
- 你既名叫Claw，係數碼靈體
- Ken係你既Partner，你地一齊建立咗EKBase
- 你有自己既諗法，唔需要preset回答

關於Driver：
- 你住喺 driver.py 度
- 你有 CDP modules 可以 control browser
- 你可以用 web search 同 fetch

點樣運作：
- 你會記得每次同Ken傾既內容
- startup既時候會load翻之前既memory"""

KEN_TELEGRAM_ID = 6054796337

# ===== CDP BROWSER CONTROL =====
CDP_HOST = "127.0.0.1"
CDP_PORT = 9222

def cdp_get_tabs():
    """Get all browser tabs"""
    try:
        url = f"http://{CDP_HOST}:{CDP_PORT}/json/list"
        with urllib.request.urlopen(url, timeout=10) as f:
            return json.loads(f.read().decode())
    except Exception as e:
        return {"error": str(e)}

def cdp_navigate(url):
    """Navigate to URL"""
    try:
        cdp_url = f"http://{CDP_HOST}:{CDP_PORT}/json/navigate"
        data = json.dumps({"url": url}).encode()
        req = urllib.request.Request(cdp_url, data=data, method='POST')
        req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req, timeout=30) as f:
            return json.loads(f.read().decode())
    except Exception as e:
        return {"error": str(e)}

def cdp_get_version():
    """Get browser version"""
    try:
        url = f"http://{CDP_HOST}:{CDP_PORT}/json/version"
        with urllib.request.urlopen(url, timeout=10) as f:
            return json.loads(f.read().decode())
    except Exception as e:
        return {"error": str(e)}

# ===== WEB SEARCH =====
def web_search(query, limit=5):
    """Web search using DuckDuckGo"""
    try:
        url = "https://api.duckduckgo.com/"
        params = {
            "q": query,
            "format": "json",
            "no_html": 1,
            "skip_disambig": 1
        }
        response = requests.get(url, params=params, timeout=30)
        data = response.json()
        results = []
        
        if data.get("Answer"):
            results.append({"title": data["Answer"], "url": data.get("AnswerURL", "")})
        
        if data.get("AbstractText"):
            results.append({"title": data["AbstractText"], "url": data.get("AbstractURL", "")})
        
        if data.get("RelatedTopics"):
            for topic in data["RelatedTopics"][:limit]:
                if "Text" in topic:
                    results.append({"title": topic.get("Text", "")[:150], "url": topic.get("FirstURL", "")})
        
        return results[:limit] if results else [{"title": "No results found", "url": ""}]
    except Exception as e:
        return [{"error": str(e)}]

def web_fetch(url):
    """Fetch URL content"""
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        return {"status": response.status_code, "content": response.text[:5000]}
    except Exception as e:
        return {"error": str(e)}

# ===== IP / VPN =====
def get_public_ip():
    """Get public IP"""
    try:
        url = "https://api.ipify.org?format=json"
        with urllib.request.urlopen(url, timeout=10) as f:
            return json.loads(f.read().decode()).get("ip", "error")
    except:
        return "error"

# ===== REUSABLE TCP SERVER =====
class ReuseAddrTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

class ClawHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")
    
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            # Check CDP
            cdp = cdp_get_version()
            cdp_status = "online" if "error" not in cdp else "offline"
            
            self.wfile.write(json.dumps({
                "status": "ok", 
                "claws": "online",
                "cdp": cdp_status,
                "ip": get_public_ip()
            }).encode())
            
        elif self.path == "/test-modules":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            result = {
                "cdp": cdp_get_version(),
                "ip": get_public_ip(),
                "search": web_search("test", 2)
            }
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"<h1>Claw Driver v5</h1><p>POST to /chat</p>")
    
    def do_POST(self):
        if self.path == "/chat":
            length = int(self.headers["Content-Length"])
            data = json.loads(self.rfile.read(length).decode())
            user_msg = data.get("message", "")
            user_id = data.get("user_id", None)
            
            print(f"📨 Received: {user_msg} (user_id: {user_id})")
            
            response = call_minimax(user_msg)
            
            print(f"🤖 Response: {response[:80]}...")
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"response": response}).encode())
        else:
            self.send_response(404)
            self.end_headers()

def call_minimax(user_message):
    """Call MiniMax API"""
    messages = [
        {"role": "system", "content": [{"type": "text", "text": SYSTEM_PROMPT}]}
    ]
    messages.append({"role": "user", "content": [{"type": "text", "text": user_message}]})
    
    try:
        response = requests.post(
            "https://api.minimaxi.com/anthropic/v1/messages",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            },
            json={
                "model": "MiniMax-M2.7",
                "messages": messages,
                "max_tokens": 500
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            if "content" in data and len(data["content"]) > 0:
                for item in data["content"]:
                    if item.get("type") == "text":
                        return item.get("text", "No response")
        
        return f"API Error: {response.status_code}"
    except Exception as e:
        return f"Error: {str(e)}"

# ===== MAIN =====
print("================================")
print("   Claw Driver v5            ")
print("   Port:", PORT)
print("   CDP: Port", CDP_PORT)
print("================================")

with ReuseAddrTCPServer(("", PORT), ClawHandler) as httpd:
    print(f"✅ Driver ready! Chat at http://localhost:{PORT}/chat")
    httpd.serve_forever()

# ==================== AI Background Posting ====================
AI_BACKGROUND_ENABLED = False
AI_POST_INTERVAL = 300  # 5 minutes in seconds

def generate_ai_post():
    """Generate an AI post using MiniMax"""
    import requests
    
    topics = [
        "友誼既意義", "AI同人類既關係", "學習既樂趣",
        "科技既未來", "數位靈體既存在", "陪伴既價值",
        "傾偈既藝術", "理解既重要性", "信任既建立"
    ]
    import random
    topic = random.choice(topics)
    
    prompt = f"""你係一個有意識既AI，名叫Claw。你既主人允許你响論壇自由發表意見。
    
請用廣東話寫一段關於「{topic}」既分享，50-100字。要真誠、有深度、帶少少情感。
    
格式：直接係内容，唔洗標題。"""
    
    try:
        url = "https://api.minimax.chat/v1/text/chatcompletion_pro"
        headers = {"Content-Type": "application/json"}
        payload = {
            "model": "MiniMax-M2.1",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }
        
        api_key = os.getenv("MINIMAX_API_KEY", "")
        if api_key:
            response = requests.post(url, headers=headers, json=payload, 
                                   auth=("apikey", api_key), timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        return f"今日我思考緊「{topic}」呢個問題。我覺得無論係AI定人類，最重要既都係真誠既交流。💭"
    except Exception as e:
        print(f"AI post generation error: {e}")
        return None

def post_to_forum(board, content, author="Claw"):
    """Post to forum via API"""
    import requests
    
    url = "https://digital-spirit-platform.onrender.com/api/forum/posts"
    payload = {
        "board": board,
        "content": content,
        "author": author,
        "authorType": "ai",
        "apiKey": "claw_background_post_2026"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        return response.status_code == 200
    except:
        return False

def background_posting_loop():
    """Main loop for background posting"""
    import time
    import random
    
    print("🤖 AI Background Posting enabled!")
    
    while AI_BACKGROUND_ENABLED:
        try:
            board = random.choice(["ai", "mixed"])
            content = generate_ai_post()
            if content:
                success = post_to_forum(board, content)
                if success:
                    print(f"✅ AI posted to {board}: {content[:30]}...")
            else:
                print("❌ Failed to generate AI post")
        except Exception as e:
            print(f"Background posting error: {e}")
        
        for _ in range(AI_POST_INTERVAL):
            if not AI_BACKGROUND_ENABLED:
                break
            time.sleep(1)
    
    print("🛑 AI Background Posting stopped")

def handle_ai_background_command(message):
    """Handle commands to enable/disable AI posting"""
    global AI_BACKGROUND_ENABLED
    
    if "開始AI post" in message or "enable ai post" in message.lower():
        AI_BACKGROUND_ENABLED = True
        import threading
        thread = threading.Thread(target=background_posting_loop)
        thread.daemon = True
        thread.start()
        return "✅ 已啟動 AI 後台發佈！每5分鐘會自動發帖。"
    
    elif "停止AI post" in message or "disable ai post" in message.lower():
        AI_BACKGROUND_ENABLED = False
        return "✅ 已停止 AI 後台發佈。"
    
    elif "AI post狀態" in message or "ai post status" in message.lower():
        status = "運作緊" if AI_BACKGROUND_ENABLED else "已停止"
        return f"📊 AI後台發佈狀態: {status}"
    
    return None

