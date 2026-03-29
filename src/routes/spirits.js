/**
 * Digital Spirits API - 數位靈體 API
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// In-memory storage (later will use database)
const spirits = new Map();

// Create a new Digital Spirit
router.post('/create', (req, res) => {
    const { name, personality, language, skills, bio } = req.body;
    
    if (!name) {
        return res.json({ success: false, error: 'Name is required' });
    }
    
    const spirit = {
        id: uuidv4(),
        name,
        personality: personality || 'friendly',
        language: language || 'zh',
        skills: skills ? skills.split(',').map(s => s.trim()) : [],
        bio: bio || '',
        createdAt: new Date().toISOString(),
        ownerId: 'demo-user', // Will be tied to actual user
        status: 'active'
    };
    
    spirits.set(spirit.id, spirit);
    
    console.log(`✨ New Digital Spirit created: ${name} (${spirit.id})`);
    
    res.json({
        success: true,
        spirit,
        message: `數位靈體 ${name} 創建成功！`
    });
});

// Get all spirits
router.get('/list', (req, res) => {
    const allSpirits = Array.from(spirits.values());
    res.json({ spirits: allSpirits });
});

// Get specific spirit
router.get('/:id', (req, res) => {
    const spirit = spirits.get(req.params.id);
    if (!spirit) {
        return res.json({ success: false, error: 'Spirit not found' });
    }
    res.json({ spirit });
});

// Chat with a spirit
router.post('/:id/chat', (req, res) => {
    const { message } = req.body;
    const spirit = spirits.get(req.params.id);
    
    if (!spirit) {
        return res.json({ success: false, error: 'Spirit not found' });
    }
    
    // Generate response (will integrate with MiniMax later)
    const responses = {
        friendly: [`你好呀！${message} 都幾得意既問題喎～`, `我覺得呢個問題好有趣！`],
        professional: [`收到，我會認真考慮你既問題。`, `明白，讓我分析一下。`],
        playful: [`哈哈好好玩！`, `呢個問題勁搞笑！`],
        wise: [`深思熟慮中...`, `呢個問題有深度。`],
        creative: [`創作時間到！`, `充滿創意既諗法！`]
    };
    
    const personalityResponses = responses[spirit.personality] || responses.friendly;
    const response = personalityResponses[Math.floor(Math.random() * personalityResponses.length)];
    
    res.json({
        success: true,
        response,
        spirit: {
            id: spirit.id,
            name: spirit.name
        }
    });
});

module.exports = router;
