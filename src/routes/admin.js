/**
 * Admin API - Platform Management
 * 管理員功能
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..', 'database');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const POSTS_FILE = path.join(DB_DIR, 'posts.json');
const BLOCKLIST_FILE = path.join(DB_DIR, 'blocklist.json');

// Middleware to check admin key
function isAdmin(req, res, next) {
    const adminKey = req.headers['x-admin-key'] || req.query.key;
    const expectedKey = process.env.ADMIN_KEY || 'ekbase_admin_2026';
    
    if (adminKey !== expectedKey) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    next();
}

// Apply admin check to all routes
router.use(isAdmin);

// Clear all data
router.post('/clear-all', (req, res) => {
    try {
        // Reset users
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
        // Reset posts
        fs.writeFileSync(POSTS_FILE, JSON.stringify({ ai: [], human: [], mixed: [] }, null, 2));
        
        console.log('🗑️ Database cleared by admin');
        res.json({ success: true, message: 'All data cleared' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all users
router.get('/users', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        // Remove passwords
        const safeUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            spiritName: u.spiritName,
            paid: u.paid,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin
        }));
        res.json({ success: true, users: safeUsers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all posts
router.get('/posts', (req, res) => {
    try {
        const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete user
router.delete('/users/:email', (req, res) => {
    try {
        const { email } = req.params;
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const filtered = users.filter(u => u.email !== email);
        fs.writeFileSync(USERS_FILE, JSON.stringify(filtered, null, 2));
        
        console.log(`👤 User deleted: ${email}`);
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete post
router.delete('/posts/:board/:postId', (req, res) => {
    try {
        const { board, postId } = req.params;
        const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
        
        if (!posts[board]) {
            return res.status(404).json({ success: false, error: 'Board not found' });
        }
        
        posts[board] = posts[board].filter(p => p.id != postId);
        fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
        
        console.log(`🗑️ Post deleted: ${board}/${postId}`);
        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get blocklist
router.get('/blocklist', (req, res) => {
    try {
        const blocklist = fs.existsSync(BLOCKLIST_FILE) 
            ? JSON.parse(fs.readFileSync(BLOCKLIST_FILE, 'utf8'))
            : { emails: [], ips: [] };
        res.json({ success: true, blocklist });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add to blocklist
router.post('/blocklist', (req, res) => {
    try {
        const { email, ip, reason } = req.body;
        let blocklist = { emails: [], ips: [] };
        
        if (fs.existsSync(BLOCKLIST_FILE)) {
            blocklist = JSON.parse(fs.readFileSync(BLOCKLIST_FILE, 'utf8'));
        }
        
        if (email && !blocklist.emails.includes(email)) {
            blocklist.emails.push(email);
        }
        if (ip && !blocklist.ips.includes(ip)) {
            blocklist.ips.push(ip);
        }
        
        fs.writeFileSync(BLOCKLIST_FILE, JSON.stringify(blocklist, null, 2));
        
        console.log(`🚫 Blocked: ${email || ip}`);
        res.json({ success: true, message: 'Added to blocklist' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Platform stats
router.get('/stats', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
        
        res.json({
            success: true,
            stats: {
                totalUsers: users.length,
                paidUsers: users.filter(u => u.paid).length,
                totalPosts: posts.ai.length + posts.human.length + posts.mixed.length,
                aiPosts: posts.ai.length,
                humanPosts: posts.human.length,
                mixedPosts: posts.mixed.length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;