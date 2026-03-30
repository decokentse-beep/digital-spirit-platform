/**
 * Payment API - Auto-Approve System
 * 付款後即時開通，秋後算帳
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Blocklist for fraud prevention
const BLOCKLIST_FILE = 'C:/Users/decok/Claw/payments/blocklist.json';

// Load or create blocklist
function loadBlocklist() {
    if (fs.existsSync(BLOCKLIST_FILE)) {
        return JSON.parse(fs.readFileSync(BLOCKLIST_FILE, 'utf8'));
    }
    return { emails: [], ips: [] };
}

function saveBlocklist(blocklist) {
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
        const queueDir = 'C:/Users/decok/Claw/payments/screenshot_queue';
        if (!fs.existsSync(queueDir)) fs.mkdirSync(queueDir, { recursive: true });
        cb(null, queueDir);
    },
    filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        cb(null, `${timestamp}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Upload and auto-approve
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
        
        // Create customer folder
        const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
        const proofDir = path.join(customerDir, 'payment_proof');
        
        if (!fs.existsSync(proofDir)) {
            fs.mkdirSync(proofDir, { recursive: true });
        }
        
        // Copy screenshot
        const destPath = path.join(proofDir, file.filename);
        fs.copyFileSync(file.path, destPath);
        
        // AUTO-APPROVE - immediate access
        const info = {
            email,
            name: name || '',
            registered_at: new Date().toISOString(),
            paid: true,
            paid_at: new Date().toISOString(),
            payment_screenshot: file.filename,
            payment_uploaded_at: new Date().toISOString(),
            payment_status: 'auto_approved',
            ip: userIP,
            status: 'active'
        };
        
        fs.writeFileSync(path.join(customerDir, 'info.json'), JSON.stringify(info, null, 2));
        
        // Log for later review
        const logPath = 'C:/Users/decok/Claw/payments/payment_log.json';
        let log = [];
        if (fs.existsSync(logPath)) {
            log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
        log.push({
            email,
            ip: userIP,
            screenshot: file.filename,
            timestamp: new Date().toISOString(),
            autoApproved: true
        });
        fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
        
        console.log(`✅ Payment auto-approved: ${email} (IP: ${userIP})`);
        
        res.json({
            success: true,
            message: '付款確認！立即可以使用所有功能',
            paid: true,
            downloadUrl: '/download-page'
        });
        
    } catch (err) {
        console.error('Payment error:', err);
        res.json({ success: false, error: 'Upload failed' });
    }
});

// Report fraud (for admin review)
router.post('/report-fraud', (req, res) => {
    const { email, reason, screenshot } = req.body;
    
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
    
    // Update customer status
    const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
    const infoPath = path.join(customerDir, 'info.json');
    
    if (fs.existsSync(infoPath)) {
        const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        info.status = 'blocked';
        info.blocked_reason = reason;
        info.blocked_at = new Date().toISOString();
        fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
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

// Get payment status
router.get('/status', (req, res) => {
    const { email } = req.query;
    if (!email) return res.json({ success: false, error: 'Email required' });
    
    const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
    const infoPath = path.join(customerDir, 'info.json');
    
    if (!fs.existsSync(infoPath)) {
        return res.json({ success: true, status: 'not_found', paid: false });
    }
    
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    
    // Check if blocked
    const blockCheck = isBlocked(email, info.ip);
    if (blockCheck.blocked) {
        return res.json({ success: true, status: 'blocked', paid: false });
    }
    
    res.json({
        success: true,
        paid: info.paid || false,
        status: info.payment_status || 'unknown'
    });
});

module.exports = router;
