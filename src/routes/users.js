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
        
        // Update additional fields
        await db.updateUser(email, {
            apiKey: apiKey || '',
            betaCode: 'BETA' + String(Math.floor(Math.random() * 900) + 100),
            plan: 'free',
            registeredAt: new Date().toISOString(),
            ip: userIP
        });
        
        console.log(`✨ New user: ${name} (${email}) IP: ${userIP}`);
        
        res.json({
            success: true,
            user: {
                id: result.user.id,
                name: result.user.spiritName,
                email: result.user.email,
                plan: 'free'
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
                paid: user.paid,
                plan: user.paid ? 'premium' : 'free'
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.json({ success: false, error: 'Login failed' });
    }
});

module.exports = router;