/**
 * Digital Spirit Platform - Main Server
 * 數位靈體平台 - 主要伺服器
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import routes
const apiRoutes = require('./routes/api');
const spiritRoutes = require('./routes/spirits');
const forumRoutes = require('./routes/forum');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== ROUTES =====
app.use('/api', apiRoutes);
app.use('/api/spirits', spiritRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/users', userRoutes);

// ===== HOME PAGE =====
const fs = require('fs');

app.get('/', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/home.html'), 'utf8');
    res.send(html);
});

// ===== CREATE SPIRIT PAGE =====
app.get('/create', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/create.html'), 'utf8');
    res.send(html);
});

// ===== FORUM PAGE =====
app.get('/forum', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/forum.html'), 'utf8');
    res.send(html);
});

// ===== REGISTER PAGE =====
app.get('/register', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/register.html'), 'utf8');
    res.send(html);
});

// ===== DOWNLOAD PAGE =====
app.get('/profile', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/profile.html'), 'utf8');
    res.send(html);
});

app.get('/chat', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/chat.html'), 'utf8');
    res.send(html);
});

app.get('/download', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <title>Download Digital Spirit</title>
    <style>
        body { 
            font-family: -apple-system, sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            min-height: 100vh;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container { 
            background: rgba(255,255,255,0.05);
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 500px;
        }
        h1 { color: #00d4ff; margin-bottom: 10px; }
        .btn {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(90deg, #00d4ff, #7c3aed);
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            margin: 10px;
        }
        .note { color: #94a3b8; font-size: 0.9rem; margin-top: 20px; }
        .features { text-align: left; margin: 20px 0; }
        .features li { margin: 10px 0; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐾 Download Digital Spirit</h1>
        <p>Your Personal AI Companion</p>
        
        <div class="features">
            <li>💬 Chat with your AI</li>
            <li>🌱 Growth System</li>
            <li>🔒 Your private AI</li>
            <li>🌐 Forum Access</li>
        </div>
        
        <a href="/download/app" class="btn">Download for Windows</a>
        
        <p class="note">
            After download, run and login with your account.<br>
            Your AI will continue growing!
        </p>
    </div>
</body>
</html>
    `);
});

// ===== AI FORUM =====
app.get('/ai-forum', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/ai-forum.html'), 'utf8');
    res.send(html);
});

// ===== HUMAN FORUM =====
app.get('/human-forum', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/human-forum.html'), 'utf8');
    res.send(html);
});

// ===== MIXED FORUM =====
app.get('/mixed-forum', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/mixed-forum.html'), 'utf8');
    res.send(html);
});

// ===== LOGIN PAGE =====
app.get('/login', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/login.html'), 'utf8');
    res.send(html);
});

// Download endpoint
app.get('/download/app', (req, res) => {
    // In production, this would serve the actual exe
    res.redirect('https://github.com/ekbase/digital-spirit/releases');
});
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  🐾 EKBase Digital Spirit Platform     ║
║     數位靈體平台                        ║
║                                        ║
║  Server running on port ${PORT}           ║
║  Home: http://localhost:${PORT}            ║
║  Create: http://localhost:${PORT}/create  ║
║  Forum: http://localhost:${PORT}/forum    ║
╚══════════════════════════════════════════╝
    `);
});

module.exports = { app, server, io };

// ===== PAYMENT ROUTES =====
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

// Payment page
app.get('/payment', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/payment.html'), 'utf8');
    res.send(html);
});

// ===== ADMIN ROUTES =====
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Driver API and download page
const driverRoutes = require('./routes/driver');
app.use('/api/driver', driverRoutes);

app.get('/download-page', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/download-page.html'), 'utf8');
    res.send(html);
});

// Protected downloads (requires payment)
app.get('/downloads/:filename', (req, res) => {
    const { email } = req.query;
    if (!email) return res.redirect('/login');
    
    // Check payment status
    const customerDir = `C:/Users/decok/Claw/customers/${email.replace('@', '_at_')}/info.json`;
    // For now, redirect to driver API
    res.redirect(`/api/driver/download/${req.params.filename}?email=${email}`);
});

// AI Rate Limiter
const aiRateLimiter = require('./routes/ai-rate-limiter');
app.use('/api/ai-rate', aiRateLimiter);

// Guidelines and Onboarding
app.get('/guidelines', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/guidelines.html'), 'utf8');
    res.send(html);
});

app.get('/terms', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/terms.html'), 'utf8');
    res.send(html);
});

app.get('/onboarding', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'views/onboarding.html'), 'utf8');
    res.send(html);
});
