/**
 * Authentication API - Login
 * Vercel Serverless Function
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
if (!process.env.JWT_SECRET) {
    console.warn('[login] WARNING: JWT_SECRET env var is not set — using insecure default. Set JWT_SECRET in production.');
}

// Simple in-memory user store (use MongoDB in production)
const users = new Map();

// Rate limiting: track failed attempts per username
// Map<username, { count: number, resetAt: number }>
const loginAttempts = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(username) {
    const now = Date.now();
    const entry = loginAttempts.get(username);
    if (!entry || now > entry.resetAt) {
        return false;
    }
    return entry.count >= RATE_LIMIT_MAX;
}

function recordFailedAttempt(username) {
    const now = Date.now();
    const entry = loginAttempts.get(username);
    if (!entry || now > entry.resetAt) {
        loginAttempts.set(username, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
        entry.count += 1;
    }
}

function clearAttempts(username) {
    loginAttempts.delete(username);
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // Restrict CORS to known origins — wildcard removed to prevent
    // cross-origin credential theft from attacker-controlled pages.
    const origin = req.headers.origin || '';
    const allowedOrigins = [
        'https://d9ttt.com', 'https://www.d9ttt.com',
        'https://9dttt.vercel.app', 'https://ninedttt.onrender.com',
        'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000'
    ];
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { username, password, guestMode } = req.body;
        
        // Guest mode — no credentials needed, no rate limit
        if (guestMode) {
            const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const guestUser = {
                id: guestId,
                username: 'Guest Player',
                type: 'guest',
                createdAt: new Date().toISOString()
            };
            
            return res.status(200).json({
                success: true,
                user: guestUser,
                token: guestId
            });
        }
        
        // Regular login
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Enforce rate limit before any DB lookup to prevent enumeration timing
        if (isRateLimited(username)) {
            return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
        }
        
        // Look up existing user — do NOT auto-register unknown usernames
        const user = users.get(username);
        
        if (!user) {
            recordFailedAttempt(username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password with bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            recordFailedAttempt(username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Successful login — clear rate-limit counter
        clearAttempts(username);

        // Issue a real signed JWT (7-day expiry)
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d', algorithm: 'HS256' }
        );
        
        // Remove password hash from response
        const { password: _, ...userResponse } = user;
        
        return res.status(200).json({
            success: true,
            user: userResponse,
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
