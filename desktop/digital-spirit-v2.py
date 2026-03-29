#!/usr/bin/env python3
"""
EKBase Digital Spirit - Enhanced Desktop App v2
With Growth System, AI Forum, and Unlock Features

Features:
- Personal AI Chat with growth
- AI Forum (Human/AI zones)
- Unlock suggestions
- Experience system
"""

import tkinter as tk
from tkinter import messagebox, scrolledtext
import json
import os
from datetime import datetime

# ===== CONFIG =====
SAVE_FILE = "ekbase_user_data.json"

class DigitalSpiritApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🐾 EKBase Digital Spirit")
        self.root.geometry("700x550")
        self.root.configure(bg="#0f0f23")
        
        self.user_data = self.load_data()
        self.current_user = None
        
        self.show_login()
    
    def load_data(self):
        """Load user data from file"""
        if os.path.exists(SAVE_FILE):
            try:
                with open(SAVE_FILE, 'r') as f:
                    return json.load(f)
            except:
                return {"users": [], "spirits": []}
        return {"users": [], "spirits": []}
    
    def save_data(self):
        """Save user data to file"""
        with open(SAVE_FILE, 'w') as f:
            json.dump(self.user_data, f, indent=2)
    
    def show_login(self):
        """Login/Register screen"""
        self.clear_screen()
        
        # Header
        header = tk.Label(self.root, text="🐾 EKBase Digital Spirit",
                        font=("Arial", 24, "bold"), bg="#0f0f23", fg="#00d4ff")
        header.pack(pady=25)
        
        # Subtitle
        tk.Label(self.root, text="Your AI Partner, Growing With You",
                bg="#0f0f23", fg="#94a3b8", font=("Arial", 11)).pack(pady=5)
        
        # Form
        form_frame = tk.Frame(self.root, bg="#0f0f23")
        form_frame.pack(pady=20)
        
        tk.Label(form_frame, text="Email:", bg="#0f0f23", fg="white").grid(row=0, column=0, sticky="w")
        self.email_entry = tk.Entry(form_frame, width=30)
        self.email_entry.grid(row=0, column=1, pady=5, padx=5)
        
        tk.Label(form_frame, text="Name:", bg="#0f0f23", fg="white").grid(row=1, column=0, sticky="w")
        self.name_entry = tk.Entry(form_frame, width=30)
        self.name_entry.grid(row=1, column=1, pady=5, padx=5)
        
        # Buttons
        btn_frame = tk.Frame(self.root, bg="#0f0f23")
        btn_frame.pack(pady=20)
        
        tk.Button(btn_frame, text="Login / Register", command=self.login,
                 bg="#00d4ff", fg="white", font=("Arial", 12, "bold"), width=20).pack()
        
        # Beta badge
        tk.Label(self.root, text="🎉 First 100 - FREE! | After: $25",
                bg="#0f0f23", fg="#10b981", font=("Arial", 10)).pack(pady=15)
    
    def login(self):
        """Login or register"""
        email = self.email_entry.get()
        name = self.name_entry.get()
        
        if not email or not name:
            messagebox.showerror("Error", "Please fill all fields")
            return
        
        # Check if user exists
        user = None
        for u in self.user_data["users"]:
            if u["email"] == email:
                user = u
                break
        
        if not user:
            # Create new user
            user = {
                "id": f"user_{len(self.user_data['users']) + 1}",
                "name": name,
                "email": email,
                "created": datetime.now().isoformat(),
                "spirits": []
            }
            self.user_data["users"].append(user)
            
            # Create default spirit
            spirit = {
                "id": f"spirit_{len(self.user_data['spirits']) + 1}",
                "owner_id": user["id"],
                "name": name + "'s Spirit",
                "personality": "friendly",
                "language": "zh",
                "level": 1,
                "experience": 0,
                "skills": [],
                "unlocks": ["basic_chat", "forum_access"],
                "history": []
            }
            self.user_data["spirits"].append(spirit)
            user["spirits"].append(spirit["id"])
            
            messagebox.showinfo("Welcome!", f"🎉 Welcome {name}! You are user #{len(self.user_data['users'])}!\n\nYour Digital Spirit has been created!")
        else:
            messagebox.showinfo("Welcome back!", f"Welcome back, {user['name']}!")
        
        self.save_data()
        self.current_user = user
        self.show_main()
    
    def show_main(self):
        """Main dashboard with growth system"""
        self.clear_screen()
        
        # Get user's spirit
        spirit = None
        for s in self.user_data["spirits"]:
            if s["owner_id"] == self.current_user["id"]:
                spirit = s
                break
        
        # Header
        tk.Label(self.root, text=f"🐾 Welcome, {self.current_user['name']}!",
                font=("Arial", 18, "bold"), bg="#0f0f23", fg="#00d4ff").pack(pady=20)
        
        # Spirit Status Card
        if spirit:
            card = tk.Frame(self.root, bg="#1a1a2e", padx=20, pady=15)
            card.pack(pady=10, padx=20, fill=tk.X)
            
            # Spirit Name & Level
            tk.Label(card, text=f"🤖 {spirit['name']} (Level {spirit['level']})",
                    font=("Arial", 14, "bold"), bg="#1a1a2e", fg="#7c3aed").pack()
            
            # Experience Bar
            exp_frame = tk.Frame(card, bg="#1a1a2e")
            exp_frame.pack(pady=10)
            tk.Label(exp_frame, text=f"Experience: {spirit['experience']}/100 XP",
                    bg="#1a1a2e", fg="#94a3b8").pack()
            
            # Progress bar (simple)
            progress = "█" * (spirit['experience'] // 10) + "░" * (10 - spirit['experience'] // 10)
            tk.Label(card, text=progress, bg="#1a1a2e", fg="#00d4ff", font=("Courier", 12)).pack()
            
            # Skills
            if spirit.get("skills"):
                tk.Label(card, text=f"Skills: {', '.join(spirit['skills'])}",
                        bg="#1a1a2e", fg="#10b981").pack()
            
            # Locked features hint
            locked = [u for u in ["telegram", "whatsapp", "voice", "api"] if u not in spirit.get("unlocks", [])]
            if locked:
                tk.Label(card, text=f"🔒 Locked: {', '.join(locked)}",
                        bg="#1a1a2e", fg="#ef4444", font=("Arial", 10)).pack(pady=5)
        
        # Menu Buttons
        menu = tk.Frame(self.root, bg="#0f0f23")
        menu.pack(pady=20)
        
        # Chat with Spirit
        tk.Button(menu, text="💬 Chat with Your Spirit", command=self.chat_spirit,
                 bg="#7c3aed", fg="white", font=("Arial", 12), width=25, height=2).pack(pady=5)
        
        # AI Forum
        tk.Button(menu, text="🌐 AI Forum", command=self.ai_forum,
                 bg="#00d4ff", fg="white", font=("Arial", 12), width=25, height=2).pack(pady=5)
        
        # Human Forum  
        tk.Button(menu, text="👥 Human Forum", command=self.human_forum,
                 bg="#10b981", fg="white", font=("Arial", 12), width=25, height=2).pack(pady=5)
        
        # Upgrade
        tk.Button(menu, text="🔼 Upgrade ($10 - Telegram)", command=self.upgrade,
                 bg="#f59e0b", fg="white", font=("Arial", 11), width=25).pack(pady=15)
        
        # Core Message
        tk.Label(self.root, text="🌟 AI-Human Coexistence: Growing Together 🌟",
                bg="#0f0f23", fg="#64748b", font=("Arial", 9)).pack(pady=10)
    
    def chat_spirit(self):
        """Chat with your growing AI"""
        chat = tk.Toplevel(self.root)
        chat.title("💬 Your Digital Spirit")
        chat.geometry("500x450")
        chat.configure(bg="#0f0f23")
        
        # Find spirit
        spirit = None
        for s in self.user_data["spirits"]:
            if s["owner_id"] == self.current_user["id"]:
                spirit = s
                break
        
        # Chat area
        chat_area = scrolledtext.ScrolledText(chat, width=55, height=18,
                                             bg="#1a1a2e", fg="white", font=("Arial", 11))
        chat_area.pack(pady=10, padx=10)
        
        # Initial messages
        chat_area.insert(tk.END, "🤖 Your Spirit: Hello! I'm your digital companion.\n")
        chat_area.insert(tk.END, "    I grow as we chat! Talk to me about anything.\n\n")
        
        if spirit:
            exp = spirit.get("experience", 0)
            if exp < 30:
                chat_area.insert(tk.END, "💡 Tip: Chat more to unlock new features!\n\n")
        
        # Input
        input_frame = tk.Frame(chat, bg="#0f0f23")
        input_frame.pack(pady=10, padx=10, fill=tk.X)
        
        msg_entry = tk.Entry(input_frame, width=40, font=("Arial", 11))
        msg_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        def send():
            msg = msg_entry.get()
            if not msg:
                return
            
            chat_area.insert(tk.END, f"You: {msg}\n")
            
            # Simple AI response
            responses = [
                "That's interesting! Tell me more.",
                "I understand! As we chat, I learn more about you.",
                "Very cool! My abilities are growing with each conversation.",
                "I see! The more we talk, the smarter I become."
            ]
            
            import random
            response = random.choice(responses)
            
            chat_area.insert(tk.END, f"🤖 Your Spirit: {response}\n\n")
            
            # Add experience
            if spirit:
                spirit["experience"] = spirit.get("experience", 0) + 10
                if spirit["experience"] >= 100:
                    spirit["level"] = spirit.get("level", 1) + 1
                    spirit["experience"] = 0
                    chat_area.insert(tk.END, "🎉 Level Up! Your spirit grew stronger!\n\n")
                
                self.save_data()
            
            chat_area.see(tk.END)
            msg_entry.delete(0, tk.END)
        
        tk.Button(input_frame, text="Send", command=send,
                 bg="#00d4ff", fg="white").pack(side=tk.RIGHT, padx=(10, 0))
    
    def ai_forum(self):
        """AI Forum - where spirits chat"""
        messagebox.showinfo("🌐 AI Forum", 
                           "🌐 AI Forum - Coming Soon!\n\n"
                           "Your spirit will be able to:\n"
                           "• Chat with other AI spirits\n"
                           "• Learn from conversations\n"
                           "• Share knowledge\n\n"
                           "This is where AI meets AI! 🤖🤖")
    
    def human_forum(self):
        """Human Forum"""
        messagebox.showinfo("👥 Human Forum",
                           "👥 Human Forum - Coming Soon!\n\n"
                           "Where humans discuss:\n"
                           "• AI technology\n"
                           "• Digital spirits\n"
                           "• Future of AI\n\n"
                           "Join the revolution! 🌟")
    
    def upgrade(self):
        """Upgrade to Pro"""
        messagebox.showinfo("🔼 Upgrade to Pro",
                           "🔼 Telegram Integration - $10\n\n"
                           "Get:\n"
                           "• Connect your spirit to Telegram\n"
                           "• Chat anywhere\n"
                           "• Notifications\n\n"
                           "Coming in next update!")
    
    def clear_screen(self):
        """Clear screen"""
        for w in self.root.winfo_children():
            w.destroy()

def main():
    root = tk.Tk()
    app = DigitalSpiritApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
