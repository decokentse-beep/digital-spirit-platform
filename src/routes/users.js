/**
 * User Registration & Beta Codes System
 * 用戶註冊系統 (with Password)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// In-memory storage
const users = new Map();
const betaCodes = new Map();

// Generate beta codes
const BETA_CODES = [];
for (let i = 1; i <= 100; i++) {
    const code = `BETA${i.toString().padStart(3, '0')}`;
    BETA_CODES.push(code);
    betaCodes.set(code, { 
        used: false, 
        usedBy: null, 
        usedAt: null 
    });
}

// Pre-create Ken and Wife with passwords
const preUsers = [
    { 
        id: uuidv4(), 
        name: 'Ken', 
        email: 'decokentse@gmail.com', 
        password: 'kT67608962',
        betaCode: 'BETA001',
        registeredAt: new Date().toISOString(),
        plan: 'founder'
    },
    { 
        id: uuidv4(), 
        name: 'Hazel', 
        email: 'hazel_cheung@ymail.com', 
        password: '67608962',
        betaCode: 'BETA002',
        registeredAt: new Date().toISOString(),
        plan: 'founder'
    }
];

preUsers.forEach(u => {
    users.set(u.id, u);
    betaCodes.set(u.betaCode, { used: true, usedBy: u.email, usedAt: new Date().toISOString() });
});

// Get platform stats
router.get('/stats', (req, res) => {
    const usedCodes = Array.from(betaCodes.values()).filter(c => c.used).length;
    const totalUsers = users.size;
    
    res.json({
        totalUsers,
        betaCodesUsed: usedCodes,
        betaCodesRemaining: 100 - usedCodes,
        isBetaOpen: usedCodes < 100
    });
});

// Login - Backdoor for Ken and Wife
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    for (const user of users.values()) {
        if (user.email === email && user.password === password) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            users.set(user.id, user);
            
            return res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    betaCode: user.betaCode,
                    plan: user.plan
                },
                message: `Welcome back, ${user.name}!`
            });
        }
    }
    
    res.json({ success: false, error: 'Invalid email or password' });
});

// Register new user
router.post('/register', (req, res) => {
    let { name, email, password, apiKey } = req.body;
    
    // Check if email already registered
    for (const user of users.values()) {
        if (user.email === email) {
            return res.json({ success: false, error: 'Email already registered' });
        }
    }
    
    // Use apiKey as betaCode for registration
    let betaCode = apiKey; // API Key is passed as betaCode field
    
    // Validate or auto-assign beta code
    if (!betaCode) {
        let assignedCode = null;
        for (const [code, data] of betaCodes) {
            if (!data.used) {
                assignedCode = code;
                break;
            }
        }
        
        if (assignedCode) {
            betaCode = assignedCode;
        } else {
            return res.json({ success: false, error: 'Beta codes exhausted. Please wait for next batch.' });
        }
    } else {
        const codeData = betaCodes.get(betaCode);
        if (!codeData) {
            return res.json({ success: false, error: 'Invalid beta code' });
        }
        if (codeData.used) {
            return res.json({ success: false, error: 'Beta code already used' });
        }
    }
    
    // Create user
    const user = {
        id: uuidv4(),
        name,
        email,
        password: password || '',
        apiKey: apiKey || '', // Store API Key
        betaCode: betaCode && betaCode.startsWith('BETA') ? betaCode : 'BETA' + String(users.size + 1).padStart(3, '0'),
        registeredAt: new Date().toISOString(),
        plan: 'beta-free'
    };
    
    betaCodes.set(betaCode, {
        used: true,
        usedBy: email,
        usedAt: new Date().toISOString()
    });
    
    users.set(user.id, user);
    
    console.log(`✨ New user registered: ${name} (${email}) with code ${betaCode}`);
    
    const isBetaUser = betaCode && betaCode.startsWith('BETA');
    res.json({
        success: true,
        user,
        message: isBetaUser 
            ? `🎉 Welcome! You're user #${betaCode.replace('BETA', '')}! Free beta access granted!`
            : 'Registration successful!'
    });
});

// Get user by ID
router.get('/user/:id', (req, res) => {
    const user = users.get(req.params.id);
    if (!user) {
        return res.json({ success: false, error: 'User not found' });
    }
    res.json({ user });
});

module.exports = router;
