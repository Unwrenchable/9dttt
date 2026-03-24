/**
 * Game Stats API
 * Track and retrieve platform statistics
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
        // Explicitly restrict to HS256 to prevent algorithm-confusion attacks
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        return { valid: true, decoded };
    } catch (err) {
        return { valid: false };
    }
}

// In-memory stats (use Redis/MongoDB in production)
let stats = {
    totalPlayers: 0,
    totalGames: 31,
    totalSessions: 0,
    gamesPlayed: {},
    dailyActiveUsers: new Set(),
    hourlyStats: []
};

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // Restrict CORS to known origins — wildcard removed to prevent
    // cross-origin token leakage from attacker-controlled pages.
    const origin = req.headers.origin || '';
    const allowedOrigins = [
        'https://d9ttt.com', 'https://www.d9ttt.com',
        'https://9dttt.vercel.app', 'https://ninedttt.onrender.com'
    ];
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        if (req.method === 'GET') {
            // Return statistics
            return res.status(200).json({
                totalPlayers: stats.totalPlayers,
                totalGames: stats.totalGames,
                totalSessions: stats.totalSessions,
                dailyActiveUsers: stats.dailyActiveUsers.size,
                gamesPlayed: stats.gamesPlayed,
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        }
        
        if (req.method === 'POST') {
            // Require a valid JWT to prevent unauthenticated stat inflation
            const auth = verifyBearer(req);
            if (!auth.valid) {
                return res.status(401).json({ error: 'Unauthorized: valid Bearer token required' });
            }

            // Track event
            const { event, userId, gameId, metadata } = req.body;
            
            switch (event) {
                case 'player_joined':
                    stats.totalPlayers++;
                    if (userId) stats.dailyActiveUsers.add(userId);
                    break;
                    
                case 'session_start':
                    stats.totalSessions++;
                    if (userId) stats.dailyActiveUsers.add(userId);
                    break;
                    
                case 'game_played':
                    if (gameId) {
                        stats.gamesPlayed[gameId] = (stats.gamesPlayed[gameId] || 0) + 1;
                    }
                    break;
            }
            
            // Track hourly stats
            const hour = new Date().getHours();
            if (!stats.hourlyStats[hour]) {
                stats.hourlyStats[hour] = 0;
            }
            stats.hourlyStats[hour]++;
            
            return res.status(200).json({
                success: true,
                event,
                stats: {
                    totalPlayers: stats.totalPlayers,
                    totalSessions: stats.totalSessions,
                    dailyActiveUsers: stats.dailyActiveUsers.size
                }
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Stats API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Reset daily stats at midnight (if using this in production, use a cron job)
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        stats.dailyActiveUsers.clear();
        stats.hourlyStats = [];
    }
}, 60000); // Check every minute
