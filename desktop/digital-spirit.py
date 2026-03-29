#!/usr/bin/env python3
"""
EKBase Digital Spirit - Desktop Application
A simple, easy-to-use Digital Spirit client

Features:
- Login/Register
- Chat with your Digital Spirit
- Forum access
- Telegram integration (upgrade)

Version: 1.0.0 (Basic)
"""

import tkinter as tk
from tkinter import messagebox, scrolledtext
import requests
import json
import threading

# ===== CONFIG =====
API_BASE = "http://localhost:3000/api"
SPIRIT_ICON = "🐾"

class DigitalSpiritApp:
    def __init__(self, root):
        self.root = root
        self.root.title("EKBase Digital Spirit")
        self.root.geometry("600x500")
        self.root.configure(bg="#1a1a2e")
        
        self.current_user = None
        self.current_spirit = None
        
        self.show_login_screen()
    
    def show_login_screen(self):
        """Show login/register screen"""
        self.clear_screen()
        
        # Title
        title = tk.Label(self.root, text="🐾 EKBase Digital Spirit", 
                       font=("Arial", 24, "bold"), bg="#1a1a2e", fg="#00d4ff")
        title.pack(pady=30)
        
        # Subtitle
        subtitle = tk.Label(self.root, text="Login to your account", 
                         font=("Arial", 12), bg="#1a1a2e", fg="#94a3b8")
        subtitle.pack(pady=10)
        
        # Email
        tk.Label(self.root, text="Email:", bg="#1a1a2e", fg="white").pack()
        self.email_entry = tk.Entry(self.root, width=30)
        self.email_entry.pack(pady=5)
        
        # Name
        tk.Label(self.root, text="Name:", bg="#1a1a2e", fg="white").pack()
        self.name_entry = tk.Entry(self.root, width=30)
        self.name_entry.pack(pady=5)
        
        # Login Button
        login_btn = tk.Button(self.root, text="Login / Register", 
                             command=self.login,
                             bg="#00d4ff", fg="white", font=("Arial", 12, "bold"))
        login_btn.pack(pady=20)
        
        # Info
        info = tk.Label(self.root, text="First 100 users - FREE!\nAfter: $25 USD",
                       bg="#1a1a2e", fg="#94a3b8", font=("Arial", 10))
        info.pack(pady=10)
    
    def login(self):
        """Login or register user"""
        email = self.email_entry.get()
        name = self.name_entry.get()
        
        if not email or not name:
            messagebox.showerror("Error", "Please fill in all fields")
            return
        
        try:
            # Try to register
            response = requests.post(f"{API_BASE}/users/register", 
                                    json={"name": name, "email": email},
                                    timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.current_user = data.get("user")
                    messagebox.showinfo("Welcome!", data.get("message", "Login successful!"))
                    self.show_main_screen()
                else:
                    # Maybe already registered, try login
                    self.current_user = {"name": name, "email": email}
                    self.show_main_screen()
            else:
                messagebox.showerror("Error", "Connection failed. Please try again.")
        except Exception as e:
            # If API not available, use local mode
            self.current_user = {"name": name, "email": email, "id": "local-user"}
            self.show_main_screen()
    
    def show_main_screen(self):
        """Show main dashboard"""
        self.clear_screen()
        
        # Welcome
        welcome = tk.Label(self.root, 
                         text=f"Welcome, {self.current_user.get('name', 'User')}! 🐾",
                         font=("Arial", 18, "bold"), bg="#1a1a2e", fg="#00d4ff")
        welcome.pack(pady=20)
        
        # Status
        status = tk.Label(self.root, text="Plan: Basic (Free)", 
                         bg="#1a1a2e", fg="#10b981", font=("Arial", 12))
        status.pack(pady=10)
        
        # Buttons
        btn_frame = tk.Frame(self.root, bg="#1a1a2e")
        btn_frame.pack(pady=30)
        
        # Chat with Spirit
        chat_btn = tk.Button(btn_frame, text="💬 Chat with Your Spirit", 
                           command=self.show_chat,
                           bg="#7c3aed", fg="white", font=("Arial", 14), width=25, height=2)
        chat_btn.pack(pady=10)
        
        # Forum
        forum_btn = tk.Button(btn_frame, text="📝 Forum", 
                             command=self.open_forum,
                             bg="#00d4ff", fg="white", font=("Arial", 14), width=25, height=2)
        forum_btn.pack(pady=10)
        
        # Upgrade (disabled for basic)
        upgrade_btn = tk.Button(btn_frame, text="🔼 Upgrade ($10 - Telegram)", 
                              command=self.show_upgrade_info,
                              bg="#64748b", fg="white", font=("Arial", 12), width=25)
        upgrade_btn.pack(pady=20)
        
        # Logout
        logout_btn = tk.Button(btn_frame, text="Logout", 
                             command=self.logout,
                             bg="#ef4444", fg="white", font=("Arial", 10))
        logout_btn.pack(pady=10)
    
    def show_chat(self):
        """Chat with your Digital Spirit"""
        chat_window = tk.Toplevel(self.root)
        chat_window.title("💬 Your Digital Spirit")
        chat_window.geometry("500x400")
        chat_window.configure(bg="#1a1a2e")
        
        # Chat area
        chat_area = scrolledtext.ScrolledText(chat_window, width=50, height=18, 
                                              bg="#16213e", fg="white", font=("Arial", 11))
        chat_area.pack(pady=10, padx=10)
        
        # Input
        input_frame = tk.Frame(chat_window, bg="#1a1a2e")
        input_frame.pack(pady=10, padx=10, fill=tk.X)
        
        msg_entry = tk.Entry(input_frame, width=40, font=("Arial", 11))
        msg_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        def send_message():
            msg = msg_entry.get()
            if msg:
                chat_area.insert(tk.END, f"You: {msg}\n")
                # Simple response (will connect to API later)
                chat_area.insert(tk.END, f"🐾 Your Spirit: I'm here! More features coming soon.\n\n")
                chat_area.see(tk.END)
                msg_entry.delete(0, tk.END)
        
        send_btn = tk.Button(input_frame, text="Send", command=send_message,
                           bg="#00d4ff", fg="white")
        send_btn.pack(side=tk.RIGHT, padx=(10, 0))
        
        # Initial message
        chat_area.insert(tk.END, "🐾 Your Digital Spirit is ready to chat!\n")
        chat_area.insert(tk.END, "Note: AI features coming in next update.\n\n")
    
    def open_forum(self):
        """Open forum in browser"""
        import webbrowser
        webbrowser.open(f"{API_BASE.replace('/api', '')}/forum")
    
    def show_upgrade_info(self):
        """Show upgrade information"""
        messagebox.showinfo("Upgrade to Pro", 
                          "🔼 Telegram Integration - $10 USD\n\n"
                          "Features:\n"
                          "• Connect your spirit to Telegram\n"
                          "• Chat anywhere, anytime\n"
                          "• Get notifications\n\n"
                          "Coming soon!")
    
    def logout(self):
        """Logout"""
        self.current_user = None
        self.current_spirit = None
        self.show_login_screen()
    
    def clear_screen(self):
        """Clear all widgets"""
        for widget in self.root.winfo_children():
            widget.destroy()

def main():
    root = tk.Tk()
    app = DigitalSpiritApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
