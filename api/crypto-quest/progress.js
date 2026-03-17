/**
 * Crypto Quest Progress API
 * Save and retrieve player progress
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Verify a Bearer JWT from the Authorization header.
 * Returns { valid: true, decoded } on success, or { valid: false } on failure.
 */
function verifyBearer(req) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return { valid: false };
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
        return { valid: false };
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, decoded };
    } catch (err) {
        return { valid: false };
    }
}

// In-memory store (use MongoDB in production)
const progressStore = new Map();

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { method } = req;
    const { userId } = req.query;
    
    try {
        if (method === 'GET') {
            // Get progress
            if (!userId) {
                return res.status(400).json({ error: 'userId required' });
            }
            
            const progress = progressStore.get(userId) || {
                userId,
                coins: 0,
                knowledge: 0,
                achievements: [],
                completedLevels: [],
                createdAt: new Date().toISOString(),
                lastPlayed: new Date().toISOString()
            };
            
            return res.status(200).json(progress);
        }
        
        if (method === 'POST' || method === 'PUT') {
            // Require a valid JWT to prevent unauthenticated or spoofed progress writes
            const auth = verifyBearer(req);
            if (!auth.valid) {
                return res.status(401).json({ error: 'Unauthorized: valid Bearer token required' });
            }

            // Use the identity from the verified token — never trust body.userId
            const userId = auth.decoded.id;
            const body = req.body;

            // Strip sensitive fields that must never be persisted server-side
            const { privateKey, ...safeBody } = body;

            const progress = {
                ...safeBody,
                userId,                          // authoritative: from JWT, not body
                lastPlayed: new Date().toISOString()
            };

            // If new user, set createdAt
            if (!progressStore.has(userId)) {
                progress.createdAt = new Date().toISOString();
            }

            progressStore.set(userId, progress);

            return res.status(200).json({
                success: true,
                progress
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Progress API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
