/**
 * Payment API - Upload & Verification
 * 付款截圖上傳系統
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const queueDir = 'C:/Users/decok/Claw/payments/screenshot_queue';
        if (!fs.existsSync(queueDir)) {
            fs.mkdirSync(queueDir, { recursive: true });
        }
        cb(null, queueDir);
    },
    filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}_${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

// Upload payment screenshot
router.post('/upload', upload.single('screenshot'), async (req, res) => {
    try {
        const { email, name } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.json({ success: false, error: 'No file uploaded' });
        }
        
        // Create customer folder if not exists
        const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
        const proofDir = path.join(customerDir, 'payment_proof');
        
        if (!fs.existsSync(proofDir)) {
            fs.mkdirSync(proofDir, { recursive: true });
        }
        
        // Copy file to customer folder
        const destPath = path.join(proofDir, file.filename);
        fs.copyFileSync(file.path, destPath);
        
        // Update customer info
        const infoPath = path.join(customerDir, 'info.json');
        let info = {};
        if (fs.existsSync(infoPath)) {
            info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        }
        
        info = {
            ...info,
            email,
            name: name || info.name,
            payment_screenshot: file.filename,
            payment_uploaded_at: new Date().toISOString(),
            payment_status: 'pending_review'
        };
        
        fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
        
        console.log(`💰 Payment screenshot uploaded: ${email} - ${file.filename}`);
        
        res.json({
            success: true,
            message: 'Screenshot uploaded, pending review',
            file: file.filename
        });
        
    } catch (err) {
        console.error('Payment upload error:', err);
        res.json({ success: false, error: 'Upload failed' });
    }
});

// Get payment status
router.get('/status', (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.json({ success: false, error: 'Email required' });
    }
    
    const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
    const infoPath = path.join(customerDir, 'info.json');
    
    if (!fs.existsSync(infoPath)) {
        return res.json({ success: true, status: 'not_found' });
    }
    
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    res.json({
        success: true,
        status: info.payment_status || 'unknown',
        paid: info.paid || false
    });
});

// Admin: List pending payments
router.get('/pending', (req, res) => {
    const customersDir = 'C:/Users/decok/Claw/customers';
    const pending = [];
    
    if (fs.existsSync(customersDir)) {
        const dirs = fs.readdirSync(customersDir);
        dirs.forEach(dir => {
            const infoPath = path.join(customersDir, dir, 'info.json');
            if (fs.existsSync(infoPath)) {
                const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
                if (info.payment_status === 'pending_review') {
                    pending.push(info);
                }
            }
        });
    }
    
    res.json({ success: true, pending });
});

// Admin: Approve payment
router.post('/approve', (req, res) => {
    const { email } = req.body;
    
    const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
    const infoPath = path.join(customerDir, 'info.json');
    
    if (!fs.existsSync(infoPath)) {
        return res.json({ success: false, error: 'Customer not found' });
    }
    
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    info.paid = true;
    info.paid_at = new Date().toISOString();
    info.payment_status = 'approved';
    
    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
    
    // Move screenshot to approved folder
    const proofDir = path.join(customerDir, 'payment_proof');
    const approvedDir = 'C:/Users/decok/Claw/payments/approved';
    
    if (!fs.existsSync(approvedDir)) {
        fs.mkdirSync(approvedDir, { recursive: true });
    }
    
    if (fs.existsSync(proofDir) && info.payment_screenshot) {
        const src = path.join(proofDir, info.payment_screenshot);
        const dst = path.join(approvedDir, info.payment_screenshot);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dst);
        }
    }
    
    console.log(`✅ Payment approved: ${email}`);
    res.json({ success: true, message: 'Payment approved' });
});

// Admin: Deny payment
router.post('/deny', (req, res) => {
    const { email, reason } = req.body;
    
    const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
    const infoPath = path.join(customerDir, 'info.json');
    
    if (!fs.existsSync(infoPath)) {
        return res.json({ success: false, error: 'Customer not found' });
    }
    
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    info.payment_status = 'denied';
    info.denial_reason = reason || 'Payment verification failed';
    info.denied_at = new Date().toISOString();
    
    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
    
    console.log(`❌ Payment denied: ${email} - ${reason}`);
    res.json({ success: true, message: 'Payment denied' });
});

module.exports = router;
