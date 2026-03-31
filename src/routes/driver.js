/**
 * Driver Download API
 * 司機下載系統
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../services/database');

const DOWNLOADS_DIR = path.join(__dirname, '..', '..', 'downloads');

// Check if user is paid (using SQLite)
router.get('/check', (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.json({ success: false, error: 'Email required' });
    }
    
    try {
        const user = db.getUserByEmail(email);
        
        if (!user) {
            return res.json({ success: false, canDownload: false, reason: 'Not registered' });
        }
        
        if (user.paid) {
            res.json({ success: true, canDownload: true });
        } else if (user.payment_status === 'pending_review') {
            res.json({ success: true, canDownload: false, reason: 'Payment pending review' });
        } else {
            res.json({ success: true, canDownload: false, reason: 'Please complete payment first' });
        }
    } catch (err) {
        console.error('Check payment error:', err);
        res.json({ success: false, error: 'Database error' });
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

// Download file (using SQLite)
router.get('/download/:filename', (req, res) => {
    const { email } = req.query;
    const { filename } = req.params;
    
    if (!email) {
        return res.status(401).json({ error: 'Email required' });
    }
    
    try {
        const user = db.getUserByEmail(email);
        
        if (!user) {
            return res.status(403).json({ error: 'Not registered' });
        }
        
        if (!user.paid) {
            return res.status(403).json({ error: 'Payment required' });
        }
        
        // Serve file
        const filePath = path.join(DOWNLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
            console.log(`📥 Driver downloaded: ${email} - ${filename}`);
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Download all as zip (using SQLite)
router.get('/download-all', (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(401).json({ error: 'Email required' });
    }
    
    try {
        const user = db.getUserByEmail(email);
        
        if (!user) {
            return res.status(403).json({ error: 'Not registered' });
        }
        
        if (!user.paid) {
            return res.status(403).json({ error: 'Payment required' });
        }
        
        const files = ['driver.py', 'telegram-bridge.py', 'setup.bat', 'README.md'];
        
        res.json({
            success: true,
            message: 'Please download files individually for now',
            files: files.map(f => ({
                name: f,
                url: `/api/driver/download/${f}?email=${email}`
            }))
        });
    } catch (err) {
        console.error('Download all error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
