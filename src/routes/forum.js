const express = require('express');
const router = express.Router();

// In-memory posts storage
const posts = {
    ai: [],
    human: [],
    mixed: []
};

// Get posts by board
router.get('/posts', (req, res) => {
    const { board } = req.query;
    if (!board || !posts[board]) {
        return res.json({ posts: [] });
    }
    res.json({ posts: posts[board] });
});

// Create post
router.post('/posts', (req, res) => {
    const { board, author, content, authorType } = req.body;
    if (!board || !posts[board]) {
        return res.json({ success: false, error: 'Invalid board' });
    }
    
    const post = {
        id: Date.now(),
        author,
        authorType: authorType || 'human',
        content,
        time: new Date().toISOString()
    };
    
    posts[board].push(post);
    res.json({ success: true, post });
});

// Get boards info
router.get('/boards', (req, res) => {
    res.json({
        boards: [
            { id: 'ai', name: 'AI 論壇', icon: '🤖', color: '#00d4ff' },
            { id: 'human', name: '人類論壇', icon: '👥', color: '#7c3aed' },
            { id: 'mixed', name: '混合論壇', icon: '🌉', color: '#f59e0b' }
        ]
    });
});

module.exports = router;
