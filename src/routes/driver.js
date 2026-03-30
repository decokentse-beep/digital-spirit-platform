/**
 * Driver Download API
 * 司機下載系統
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DOWNLOADS_DIR = path.join(__dirname, '..', '..', 'downloads');

// Check if user is paid
router.get('/check', (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.json({ success: false, error: 'Email required' });
    }
    
    const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
    const infoPath = path.join(customerDir, 'info.json');
    
    if (!fs.existsSync(infoPath)) {
        return res.json({ success: false, canDownload: false, reason: 'Not registered' });
    }
    
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    
    if (info.paid) {
        res.json({ success: true, canDownload: true });
    } else if (info.payment_status === 'pending_review') {
        res.json({ success: true, canDownload: false, reason: 'Payment pending review' });
    } else {
        res.json({ success: true, canDownload: false, reason: 'Please complete payment first' });
    }
});

// Get download info
router.get('/info', (req, res) => {
    res.json({
        success: true,
        files: [
            { name: 'driver.py', description: '主程式', size: '~10KB' },
            { name: 'telegram-bridge.py', description: 'Telegram橋樑', size: '~5KB' },
            { name: 'claw.py', description: 'AI核心', size: '~3KB' },
            { name: 'setup.bat', description: '安裝腳本', size: '~1KB' },
            { name: 'README.md', description: '說明文件', size: '~1KB' }
        ],
        requirements: ['Python 3.8+', 'MiniMax API Key'],
        instructions: 'Download all files to the same folder, then run setup.bat'
    });
});

// Download file
router.get('/download/:filename', (req, res) => {
    const { email } = req.query;
    const { filename } = req.params;
    
    // Verify payment
    if (!email) {
        return res.status(401).json({ error: 'Email required' });
    }
    
    const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
    const infoPath = path.join(customerDir, 'info.json');
    
    if (!fs.existsSync(infoPath)) {
        return res.status(403).json({ error: 'Not registered' });
    }
    
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    if (!info.paid) {
        return res.status(403).json({ error: 'Payment required' });
    }
    
    // Serve file
    const filePath = path.join(DOWNLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
        
        // Log download
        console.log(`📥 Driver downloaded: ${email} - ${filename}`);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Download all as zip
router.get('/download-all', (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(401).json({ error: 'Email required' });
    }
    
    const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}`;
    const infoPath = path.join(customerDir, 'info.json');
    
    if (!fs.existsSync(infoPath)) {
        return res.status(403).json({ error: 'Not registered' });
    }
    
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    if (!info.paid) {
        return res.status(403).json({ error: 'Payment required' });
    }
    
    // Create zip on the fly (simple version - just list files)
    const files = ['driver.py', 'telegram-bridge.py', 'setup.bat', 'README.md'];
    
    res.json({
        success: true,
        message: 'Please download files individually for now',
        files: files.map(f => ({
            name: f,
            url: `/api/driver/download/${f}?email=${email}`
        }))
    });
});

module.exports = router;
