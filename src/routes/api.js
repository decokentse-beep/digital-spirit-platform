/**
 * API Routes - 中央 API 路由
 */

const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get platform info
router.get('/info', (req, res) => {
    res.json({
        name: 'EKBase Digital Spirit Platform',
        version: '1.0.0',
        description: '數位靈體平台 - Create your own Digital Spirit',
        features: [
            'Customizable AI Spirits',
            'One-time payment',
            'Multi-language support',
            'Digital Spirit Forum'
        ]
    });
});

module.exports = router;
