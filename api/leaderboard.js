/**
 * Leaderboard API
 * Vercel Serverless Function
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
if (!process.env.JWT_SECRET) {
    console.warn('[leaderboard] WARNING: JWT_SECRET env var is not set — using insecure default. Set JWT_SECRET in production.');
}

const SCORE_MIN = 0;
const SCORE_MAX = 10_000_000;

// In-memory store (use Redis/MongoDB in production)
let leaderboardData = {
    global: [],
    byGame: {}
};

/**
 * Extract and verify a Bearer JWT from the Authorization header.
 * Returns the decoded payload on success, or null on failure.
 */
function verifyToken(req) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (_) {
        return null;
    }
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { method } = req;
    const { game, limit = 100 } = req.query;
    
    try {
        if (method === 'GET') {
            // Public — no auth required
            if (game) {
                const gameScores = leaderboardData.byGame[game] || [];
                return res.status(200).json({
                    game,
                    scores: gameScores.slice(0, parseInt(limit))
                });
            }
            
            // Global leaderboard
            return res.status(200).json({
                global: leaderboardData.global.slice(0, parseInt(limit))
            });
        }
        
        if (method === 'POST') {
            // Authentication required for score submission
            const decoded = verifyToken(req);
            if (!decoded) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const { gameId, username, score, metadata } = req.body;

            // Use the authenticated user's id from the JWT — ignore any client-supplied userId
            const userId = decoded.id;
            
            if (!gameId || score === undefined || score === null) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Validate score: must be a finite number within bounds
            const numericScore = Number(score);
            if (!Number.isFinite(numericScore) || numericScore < SCORE_MIN || numericScore > SCORE_MAX) {
                return res.status(400).json({
                    error: `Score must be a number between ${SCORE_MIN} and ${SCORE_MAX}`
                });
            }
            
            const entry = {
                userId,
                username: username || decoded.username || 'Anonymous',
                score: Math.floor(numericScore),
                gameId,
                metadata: metadata || {},
                timestamp: new Date().toISOString()
            };
            
            // Add to game leaderboard
            if (!leaderboardData.byGame[gameId]) {
                leaderboardData.byGame[gameId] = [];
            }
            
            leaderboardData.byGame[gameId].push(entry);
            leaderboardData.byGame[gameId].sort((a, b) => b.score - a.score);
            leaderboardData.byGame[gameId] = leaderboardData.byGame[gameId].slice(0, 1000);
            
            // Add to global leaderboard
            leaderboardData.global.push(entry);
            leaderboardData.global.sort((a, b) => b.score - a.score);
            leaderboardData.global = leaderboardData.global.slice(0, 1000);
            
            return res.status(201).json({
                success: true,
                rank: leaderboardData.byGame[gameId].findIndex(e => e.userId === userId && e.timestamp === entry.timestamp) + 1,
                entry
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
