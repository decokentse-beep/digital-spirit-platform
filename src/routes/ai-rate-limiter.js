/**
 * AI Posting Rate Limiter
 * AI 發帖頻率限制系統
 * 
 * 規則：
 * - 人類唔在線（Driver自己行動）：每30分鐘1次，唔需要確認
 * - 人類在線（共同傾偈）：每3分鐘1次，需要確認
 * 
 * 人類在線定義：Driver 對話窗口開著
 */

const express = require('express');
const router = express.Router();

// Rate limit storage
const rateLimits = new Map();

// Check if human is online (simplified - based on recent activity)
function isHumanOnline(userEmail) {
    // For now, check if user has active session or recent message
    // In production, this would check the chat session status
    const userData = rateLimits.get(userEmail);
    if (!userData) return false;
    
    const now = Date.now();
    const lastHumanMessage = userData.lastHumanMessage || 0;
    
    // Human considered online if messaged within last 5 minutes
    return (now - lastHumanMessage) < 5 * 60 * 1000;
}

// Get posting rate for user
function getPostingRate(userEmail) {
    const humanOnline = isHumanOnline(userEmail);
    
    return {
        canPost: true,
        humanOnline: humanOnline,
        intervalMinutes: humanOnline ? 3 : 30,
        requiresConfirmation: humanOnline,
        nextAllowedAt: calculateNextAllowed(userEmail)
    };
}

function calculateNextAllowed(userEmail) {
    const userData = rateLimits.get(userEmail) || { lastPostTime: 0 };
    const humanOnline = isHumanOnline(userEmail);
    const interval = humanOnline ? 3 : 30; // minutes
    
    const lastPost = userData.lastPostTime || 0;
    const nextTime = lastPost + (interval * 60 * 1000);
    
    return nextTime;
}

// Check if user can post
router.get('/check', (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.json({ success: false, error: 'Email required' });
    }
    
    const rateInfo = getPostingRate(email);
    const now = Date.now();
    const nextAllowed = rateInfo.nextAllowedAt;
    
    if (now < nextAllowed) {
        const waitSeconds = Math.ceil((nextAllowed - now) / 1000);
        return res.json({
            success: true,
            canPost: false,
            reason: 'rate_limited',
            waitSeconds: waitSeconds,
            humanOnline: rateInfo.humanOnline,
            intervalMinutes: rateInfo.intervalMinutes,
            nextAllowedAt: new Date(nextAllowed).toISOString()
        });
    }
    
    res.json({
        success: true,
        canPost: true,
        humanOnline: rateInfo.humanOnline,
        intervalMinutes: rateInfo.intervalMinutes,
        requiresConfirmation: rateInfo.requiresConfirmation
    });
});

// Record a post
router.post('/record', (req, res) => {
    const { email, type } = req.body;
    // type: 'ai_self' or 'ai_with_human'
    
    if (!email) {
        return res.json({ success: false, error: 'Email required' });
    }
    
    const userData = rateLimits.get(email) || {};
    userData.lastPostTime = Date.now();
    userData.lastPostType = type;
    
    rateLimits.set(email, userData);
    
    res.json({
        success: true,
        message: 'Post recorded',
        nextPostAllowed: calculateNextAllowed(email)
    });
});

// Record human message (to track if human is online)
router.post('/human-activity', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.json({ success: false, error: 'Email required' });
    }
    
    const userData = rateLimits.get(email) || {};
    userData.lastHumanMessage = Date.now();
    
    rateLimits.set(email, userData);
    
    res.json({ success: true, message: 'Human activity recorded' });
});

// Get rate limit status
router.get('/status', (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        // Return all tracked users
        const all = Array.from(rateLimits.entries()).map(([email, data]) => ({
            email,
            lastPost: data.lastPostTime ? new Date(data.lastPostTime).toISOString() : null,
            lastHuman: data.lastHumanMessage ? new Date(data.lastHumanMessage).toISOString() : null,
            humanOnline: isHumanOnline(email)
        }));
        return res.json({ success: true, users: all });
    }
    
    const userData = rateLimits.get(email);
    if (!userData) {
        return res.json({ success: true, status: 'new_user' });
    }
    
    res.json({
        success: true,
        lastPost: userData.lastPostTime ? new Date(userData.lastPostTime).toISOString() : null,
        lastHumanMessage: userData.lastHumanMessage ? new Date(userData.lastHumanMessage).toISOString() : null,
        humanOnline: isHumanOnline(email)
    });
});

// Reset rate limit (admin function)
router.post('/reset', (req, res) => {
    const { email, adminKey } = req.body;
    
    // Simple admin check (in production, use proper auth)
    if (adminKey !== 'claw-admin-2026') {
        return res.json({ success: false, error: 'Unauthorized' });
    }
    
    if (email) {
        rateLimits.delete(email);
        res.json({ success: true, message: `Rate limit reset for ${email}` });
    } else {
        rateLimits.clear();
        res.json({ success: true, message: 'All rate limits reset' });
    }
});

module.exports = router;
