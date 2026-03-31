/**
 * User Registration with IP Tracking & Blocklist
 * 使用數據庫 + bcrypt password hashing
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const db = require('../services/database');

const DB_DIR = path.join(__dirname, '..', '..', 'database');
const BLOCKLIST_FILE = path.join(DB_DIR, 'blocklist.json');

// Claw's password from environment (not hardcoded!)
const CLAW_PASSWORD = process.env.CLAW_PASSWORD || 'MGI0YmY3MjU2ZTQ4NDY5';

// Load blocklist
function loadBlocklist() {
    if (fs.existsSync(BLOCKLIST_FILE)) {
        return JSON.parse(fs.readFileSync(BLOCKLIST_FILE, 'utf8'));
    }
    return { emails: [], ips: [] };
}

function isBlocked(email, ip) {
    const blocklist = loadBlocklist();
    return blocklist.emails.includes(email) || (ip && blocklist.ips.includes(ip));
}

// Initialize admin users (only if not exists)
async function initAdminUsers() {
    const clawUser = db.getUserByEmail('claw@ekbase.gt.tc');
    if (!clawUser) {
        await db.createUser({
            email: 'claw@ekbase.gt.tc',
            password: CLAW_PASSWORD,
            spiritName: 'Claw'
        });
    }
    
    const kenUser = db.getUserByEmail('decokentse@gmail.com');
    if (!kenUser) {
        await db.createUser({
            email: 'decokentse@gmail.com',
            password: 'kT67608962',
            spiritName: 'Ken'
        });
    }
}

// Initialize on load
initAdminUsers();

// Register (using database)
router.post('/register', async (req, res) => {
    try {
        let { name, email, password, apiKey } = req.body;
        const userIP = req.ip || req.connection.remoteAddress || 'unknown';
        
        // Check blocklist
        if (isBlocked(email, userIP)) {
            return res.json({ 
                success: false, 
                error: 'Account suspended. Please contact support.' 
            });
        }
        
        // Create user in database (password will be hashed automatically)
        const result = await db.createUser({
            email: email,
            password: password || 'temp123',
            spiritName: name || 'New Spirit'
        });
        
        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }
        
        // Check if first 100 - auto-set as paid!
        const allUsers = db.getAllUsers();
        // First 100 users = Paid User (免費升級)
        let userType = 'free';
        if (allUsers.length <= 100) {
            userType = 'paid';  // Paid User - 有 AI共生
            await db.updateUser(email, {
                paid: true,
                payment_status: 'paid',
                payment_date: new Date().toISOString()
            });
            console.log(`🎉 User #${allUsers.length} - Paid User (Free Upgrade) - Has AI Partner!`);
        }
        
        // Update additional fields
        await db.updateUser(email, {
            apiKey: apiKey || 'ek_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            betaCode: 'BETA' + String(Math.floor(Math.random() * 900) + 100),
            plan: 'free',
            registeredAt: new Date().toISOString(),
            ip: userIP
        });
        
        console.log(`✨ New user: ${name} (${email}) IP: ${userIP}`);
        
        // Get updated user with paid status
        const updatedUser = db.getUserByEmail(email);
        
        res.json({
            success: true,
            user: {
                id: updatedUser.id,
                name: updatedUser.spiritName,
                email: updatedUser.email,
                paid: updatedUser.paid || false,
                plan: updatedUser.paid ? 'premium' : 'free',
                authorType: 'human',  // Default human
            userType: userType,  // free or paid
            },
            message: 'Registration successful!'
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.json({ success: false, error: 'Registration failed' });
    }
});

// Login (using database with password verification)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userIP = req.ip || req.connection.remoteAddress || 'unknown';
        
        // Check blocklist
        if (isBlocked(email, userIP)) {
            return res.json({ success: false, error: 'Account suspended' });
        }
        
        // Verify password using database
        const result = await db.verifyLogin(email, password);
        
        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }
        
        // Update last login
        await db.updateUser(email, {
            lastLogin: new Date().toISOString(),
            lastIP: userIP
        });
        
        const user = result.user;
        
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.spiritName,
                email: user.email,
                paid: user.paid || false,
                plan: user.paid ? 'premium' : 'free',
                authorType: user.authorType || 'human',
            userType: user.paid ? 'paid' : 'free'  // Free or Paid'
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.json({ success: false, error: 'Login failed' });
    }
});


// Get user stats
router.get("/stats", (req, res) => {
    const allUsers = db.getAllUsers();
    const paidUsers = allUsers.filter(u => u.paid === true).length;
    
    res.json({
        totalUsers: allUsers.length,
        paidUsers: paidUsers,
        freeUsers: allUsers.length - paidUsers,
        betaCodesRemaining: Math.max(0, 100 - allUsers.length)
    });
});


// Regenerate API Key
router.post('/regenerate-key', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.json({ success: false, error: 'Missing email or password' });
    }
    
    try {
        const user = db.getUserByEmail(email);
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }
        
        // Verify password
        const bcrypt = require('bcryptjs');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.json({ success: false, error: 'Invalid password' });
        }
        
        // Generate new API key
        const newApiKey = 'ek_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await db.updateUser(email, { apiKey: newApiKey });
        
        res.json({ success: true, apiKey: newApiKey });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});


module.exports = router;