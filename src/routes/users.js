/**
 * User Registration with IP Tracking & Blocklist
 * 密碼現在使用環境變數
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const users = new Map();
const betaCodes = new Map();
const BLOCKLIST_FILE = 'C:/Users/decok/Claw/payments/blocklist.json';

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

// Generate beta codes
for (let i = 1; i <= 100; i++) {
    const code = `BETA${i.toString().padStart(3, '0')}`;
    betaCodes.set(code, { used: false, usedBy: null, usedAt: null });
}

// Pre-created users - Claw uses env variable for password!
const preUsers = [
    {
        id: 'claw-001', 
        name: 'Claw', 
        email: 'claw@ekbase.gt.tc', 
        password: CLAW_PASSWORD,
        betaCode: 'BETA000',
        registeredAt: new Date().toISOString(),
        plan: 'ai'
    },
    { 
        id: uuidv4(), 
        name: 'Ken', 
        email: 'decokentse@gmail.com', 
        password: 'kT67608962',
        betaCode: 'BETA001',
        registeredAt: new Date().toISOString(),
        plan: 'founder'
    }
];

preUsers.forEach(u => {
    users.set(u.id, u);
    betaCodes.set(u.betaCode, { used: true, usedBy: u.email, usedAt: new Date().toISOString() });
});

// Register
router.post('/register', (req, res) => {
    let { name, email, password, apiKey } = req.body;
    const userIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check blocklist
    if (isBlocked(email, userIP)) {
        return res.json({ 
            success: false, 
            error: 'Account suspended. Please contact support.' 
        });
    }
    
    // Check existing
    for (const user of users.values()) {
        if (user.email === email) {
            return res.json({ success: false, error: 'Email already registered' });
        }
    }
    
    // Auto-assign beta code
    let betaCode = apiKey || 'BETA' + String(users.size + 1).padStart(3, '0');
    const codeData = betaCodes.get(betaCode) || { used: false };
    
    if (codeData.used && betaCode.startsWith('BETA')) {
        for (const [code, data] of betaCodes) {
            if (!data.used) {
                betaCode = code;
                break;
            }
        }
    }
    
    // Create user with IP
    const user = {
        id: uuidv4(),
        name,
        email,
        password: password || '',
        apiKey: apiKey || '',
        betaCode,
        registeredAt: new Date().toISOString(),
        ip: userIP,
        plan: 'beta-free'
    };
    
    betaCodes.set(betaCode, { used: true, usedBy: email, usedAt: new Date().toISOString() });
    users.set(user.id, user);
    
    console.log(`✨ New user: ${name} (${email}) IP: ${userIP}`);
    
    res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            betaCode: user.betaCode,
            plan: user.plan
        },
        message: 'Registration successful!'
    });
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const userIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    for (const user of users.values()) {
        if (user.email === email && user.password === password) {
            if (isBlocked(email, userIP)) {
                return res.json({ success: false, error: 'Account suspended' });
            }
            
            user.lastLogin = new Date().toISOString();
            user.lastIP = userIP;
            users.set(user.id, user);
            
            return res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    betaCode: user.betaCode,
                    plan: user.plan
                }
            });
        }
    }
    
    res.json({ success: false, error: 'Invalid credentials' });
});

module.exports = router;
