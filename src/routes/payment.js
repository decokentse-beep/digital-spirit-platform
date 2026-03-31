/**
 * Payment API - Auto-Approve System
 * 付款後即時開通，秋後算帳
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../services/database');

const DB_DIR = path.join(__dirname, '..', '..', 'database');
const BLOCKLIST_FILE = path.join(DB_DIR, 'blocklist.json');
const PAYMENT_LOG_FILE = path.join(DB_DIR, 'payment_log.json');

// Load or create blocklist
function loadBlocklist() {
    if (fs.existsSync(BLOCKLIST_FILE)) {
        return JSON.parse(fs.readFileSync(BLOCKLIST_FILE, 'utf8'));
    }
    return { emails: [], ips: [] };
}

function saveBlocklist(blocklist) {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(BLOCKLIST_FILE, JSON.stringify(blocklist, null, 2));
}

function isBlocked(email, ip) {
    const blocklist = loadBlocklist();
    if (blocklist.emails.includes(email)) return { blocked: true, reason: 'email' };
    if (ip && blocklist.ips.includes(ip)) return { blocked: true, reason: 'ip' };
    return { blocked: false };
}

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const queueDir = path.join(DB_DIR, 'screenshots');
        if (!fs.existsSync(queueDir)) fs.mkdirSync(queueDir, { recursive: true });
        cb(null, queueDir);
    },
    filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        cb(null, `${timestamp}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Upload and auto-approve (using database)
router.post('/upload', upload.single('screenshot'), async (req, res) => {
    try {
        const { email, name } = req.body;
        const userIP = req.ip || req.connection.remoteAddress || 'unknown';
        const file = req.file;
        
        if (!file) {
            return res.json({ success: false, error: 'No file uploaded' });
        }
        
        // Check blocklist
        const blockCheck = isBlocked(email, userIP);
        if (blockCheck.blocked) {
            return res.json({ 
                success: false, 
                error: 'Account suspended. Please contact support.',
                blocked: true
            });
        }
        
        // Check if user exists, if not create
        let user = db.getUserByEmail(email);
        
        if (!user) {
            // Create new user
            const result = db.createUser({ email, password: 'temp', spiritName: name || 'New Spirit' });
            if (!result.success) {
                return res.json({ success: false, error: result.error });
            }
            user = result.user;
        }
        
        // Copy screenshot to database folder
        const screenshotPath = path.join(DB_DIR, 'screenshots', `${email.replace('@', '_at_')}_${Date.now()}${path.extname(file.originalname)}`);
        fs.copyFileSync(file.path, screenshotPath);
        
        // Check user count - First 100 are free!
        const allUsers = db.getAllUsers();
        const userCount = allUsers.length;
        const isFreeSlot = userCount < 100;
        
        if (isFreeSlot) {
            // Auto-approve free users (first 100) - mark as paid!
            db.updatePaymentStatus(email, 'paid');
            console.log(`🎉 User #${userCount + 1} - FREE (auto-paid)`);
            console.log(`✅ Free user #${userCount + 1}: ${email} (First 100 - FREE!)`);
        } else {
            // After 100, need payment
            db.updatePaymentStatus(email, 'pending_payment');
        }
        
        // Log for later review
        let log = [];
        if (fs.existsSync(PAYMENT_LOG_FILE)) {
            log = JSON.parse(fs.readFileSync(PAYMENT_LOG_FILE, 'utf8'));
        }
        log.push({
            email,
            ip: userIP,
            screenshot: path.basename(screenshotPath),
            timestamp: new Date().toISOString(),
            autoApproved: true
        });
        fs.writeFileSync(PAYMENT_LOG_FILE, JSON.stringify(log, null, 2));
        
        console.log(`✅ ${isFreeSlot ? `Free user #${userCount + 1}` : 'Payment required'}: ${email}`);
        
        res.json({
            success: true,
            message: isFreeSlot 
                ? '🎉 恭喜！你係第 ' + (userCount + 1) + ' 個用戶，首100名免費！立即可以使用所有功能'
                : '💰 前100名已滿，你需要先付款先可以下載Driver',
            paid: isFreeSlot,
            downloadUrl: isFreeSlot ? '/download-page' : '/payment',
            freeSlot: isFreeSlot,
            userNumber: userCount + 1
        });
        
    } catch (err) {
        console.error('Payment error:', err);
        res.json({ success: false, error: 'Upload failed' });
    }
});

// Report fraud (for admin review) - using database
router.post('/report-fraud', (req, res) => {
    const { email, reason } = req.body;
    
    const blocklist = loadBlocklist();
    
    // Add email to blocklist
    if (email && !blocklist.emails.includes(email)) {
        blocklist.emails.push(email);
    }
    
    // Also block IP if provided
    if (req.body.ip && !blocklist.ips.includes(req.body.ip)) {
        blocklist.ips.push(req.body.ip);
    }
    
    saveBlocklist(blocklist);
    
    // Update user status in database
    if (email) {
        db.updateUser(email, { 
            status: 'blocked',
            blocked_reason: reason,
            blocked_at: new Date().toISOString()
        });
    }
    
    console.log(`🚫 Fraud reported: ${email} - ${reason}`);
    
    res.json({ success: true, message: 'User blocked' });
});

// Check blocklist
router.get('/blocked', (req, res) => {
    const { email } = req.query;
    const userIP = req.ip || req.connection.remoteAddress;
    
    const blocklist = loadBlocklist();
    res.json({
        blocked: blocklist.emails.includes(email) || blocklist.ips.includes(userIP),
        emails: blocklist.emails,
        ips: blocklist.ips
    });
});

// Get payment status (using database)
router.get('/status', (req, res) => {
    const { email } = req.query;
    if (!email) return res.json({ success: false, error: 'Email required' });
    
    const user = db.getUserByEmail(email);
    
    if (!user) {
        return res.json({ success: true, status: 'not_found', paid: false });
    }
    
    // Check if blocked
    const blockCheck = isBlocked(email, user.ip);
    if (blockCheck.blocked) {
        return res.json({ success: true, status: 'blocked', paid: false });
    }
    
    res.json({
        success: true,
        paid: user.paid || false,
        status: user.payment_status || 'unknown'
    });
});

module.exports = router;