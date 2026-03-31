/**
 * Database Service (SQLite) with Password Hashing
 * 數據庫服務 - 密碼 bcrypt hash
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, '..', '..', 'database');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Simple SQLite implementation using JSON files
// For production, use better-sqlite3 or similar

class Database {
    constructor() {
        this.usersPath = path.join(DB_DIR, 'users.json');
        this.init();
    }
    
    init() {
        // Initialize users file if not exists
        if (!fs.existsSync(this.usersPath)) {
            fs.writeFileSync(this.usersPath, JSON.stringify([], null, 2));
        }
    }
    
    getUsers() {
        try {
            return JSON.parse(fs.readFileSync(this.usersPath, 'utf8'));
        } catch (err) {
            return [];
        }
    }
    
    saveUsers(users) {
        fs.writeFileSync(this.usersPath, JSON.stringify(users, null, 2));
    }
    
    // Hash password using bcrypt
    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }
    
    // Verify password
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    
    // Get user by email
    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email === email);
    }
    
    // Get user by ID
    getUserById(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id);
    }
    
    // Create new user (auto-hash password)
    async createUser(userData) {
        const users = this.getUsers();
        
        // Check if email exists
        if (users.find(u => u.email === userData.email)) {
            return { success: false, error: 'Email already exists' };
        }
        
        // Hash password before saving
        const hashedPassword = await this.hashPassword(userData.password);
        
        const newUser = {
            id: 'user_' + Date.now(),
            email: userData.email,
            password: hashedPassword, // Store hashed password
            spiritName: userData.spiritName || 'New Spirit',
            spiritType: userData.spiritType || 'companion',
            apiKey: userData.apiKey || '',
            paid: false,
            payment_status: 'none',
            payment_date: null,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            postCount: 0,
            isAI: false
        };
        
        users.push(newUser);
        this.saveUsers(users);
        
        return { success: true, user: newUser };
    }
    
    // Verify login password
    async verifyLogin(email, password) {
        const user = this.getUserByEmail(email);
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        
        const isValid = await this.verifyPassword(password, user.password);
        if (!isValid) {
            return { success: false, error: 'Invalid password' };
        }
        
        return { success: true, user: user };
    }
    
    // Update user
    async updateUser(email, updates) {
        // If updating password, hash it first
        if (updates.password) {
            updates.password = await this.hashPassword(updates.password);
        }
        
        const users = this.getUsers();
        const index = users.findIndex(u => u.email === email);
        
        if (index === -1) {
            return { success: false, error: 'User not found' };
        }
        
        users[index] = { ...users[index], ...updates };
        this.saveUsers(users);
        
        return { success: true, user: users[index] };
    }
    
    // Update payment status
    updatePaymentStatus(email, status) {
        return this.updateUser(email, {
            paid: status === 'paid',
            payment_status: status,
            payment_date: status === 'paid' ? new Date().toISOString() : null
        });
    }
    
    // Get all users
    getAllUsers() {
        return this.getUsers();
    }
    
    // Delete user
    deleteUser(email) {
        const users = this.getUsers();
        const filtered = users.filter(u => u.email !== email);
        
        if (filtered.length === users.length) {
            return { success: false, error: 'User not found' };
        }
        
        this.saveUsers(filtered);
        return { success: true };
    }
}

// Export singleton
module.exports = new Database();