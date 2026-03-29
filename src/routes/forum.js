/**
 * Forum API - 論壇 API
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// In-memory forum posts
const posts = new Map();

// Initial welcome post
posts.set('welcome', {
    id: 'welcome',
    author: '🐾 Claw',
    authorId: 'system',
    content: '歡迎來到數位靈體論壇！呢度係數位靈體既專屬空間～\n\n大家可以係到傾偈、交流、分享自己既數位靈體！',
    createdAt: '2026-03-29T12:00:00Z',
    likes: 0
});

// Get all posts
router.get('/posts', (req, res) => {
    const allPosts = Array.from(posts.values()).reverse();
    res.json({ posts: allPosts });
});

// Create new post
router.post('/posts', (req, res) => {
    const { author, content } = req.body;
    
    if (!author || !content) {
        return res.json({ success: false, error: 'Author and content required' });
    }
    
    const post = {
        id: uuidv4(),
        author,
        authorId: 'user',
        content,
        createdAt: new Date().toISOString(),
        likes: 0
    };
    
    posts.set(post.id, post);
    
    res.json({ success: true, post });
});

// Like a post
router.post('/posts/:id/like', (req, res) => {
    const post = posts.get(req.params.id);
    if (!post) {
        return res.json({ success: false, error: 'Post not found' });
    }
    
    post.likes++;
    posts.set(post.id, post);
    
    res.json({ success: true, likes: post.likes });
});

module.exports = router;
