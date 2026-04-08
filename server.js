/**
 * 9DTTT Game Platform - Main Server
 * Real-time multiplayer gaming platform with Socket.io
 * Features: Multiplayer, Chat, Leaderboards, Social, Moderation, Security
 */

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const crypto = require('crypto');
const { Server } = require('socket.io');
const path = require('path');
const config = require('./server/config');
const storage = require('./server/storage');
const auth = require('./server/auth');
const gameManager = require('./server/gameManager');
const moderation = require('./server/moderation');
const security = require('./server/security');
const keepAlive = require('./server/keepAlive');
const boot = require('./server/boot');
const browserAuth = require('./server/browser-auth');
const monetization = require('./server/monetization');
const { REPORT_CATEGORIES, DISCIPLINE_LEVELS } = require('./server/moderation');
const { AD_REWARDS, COSMETICS } = require('./server/monetization');

const app = express();
const server = http.createServer(app);
// CORS configuration for split deployment
const allowedOrigins = [
    'https://d9ttt.com',
    'https://www.d9ttt.com',
    'https://9dttt.vercel.app',
    'https://ninedttt.onrender.com', // allow self-origin (Socket.io direct connect from Vercel frontend)
    process.env.VERCEL_URL,
    process.env.FRONTEND_URL
].filter(Boolean);

// Add localhost for development
if (config.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500');
}

const io = new Server(server, {
    cors: {
        origin: config.NODE_ENV === 'development' ? '*' : allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
    // Connection rate limiting
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
    }
});

// Trust proxy (for Render and other hosting)
app.set('trust proxy', 1);

// CORS middleware for split deployment
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || config.NODE_ENV === 'development') {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// HTTPS redirect in production
app.use(security.httpsRedirectMiddleware());

// Security headers
app.use(security.securityHeadersMiddleware());

// Middleware
app.use(express.json({ limit: '10kb' })); // Limit body size

// When this server is deployed as an API-only backend (Render), redirect direct browser
// navigation to the canonical frontend URL so users always land on the Vercel-served
// version of the site. API, Socket.io, and keep-alive routes are still handled here.
const FRONTEND_CANONICAL = process.env.FRONTEND_URL || 'https://www.d9ttt.com';
const isApiOnlyMode = !!process.env.RENDER_EXTERNAL_URL;

if (isApiOnlyMode) {
    app.use((req, res, next) => {
        // Pass through API calls, Socket.io, ping/health, and static assets
        if (req.path.startsWith('/api/') ||
            req.path.startsWith('/socket.io/') ||
            req.path === '/ping' ||
            req.path.startsWith('/css/') ||
            req.path.startsWith('/js/') ||
            req.path.startsWith('/images/') ||
            req.path === '/favicon.ico' ||
            req.path === '/icon.jpg') {
            return next();
        }

        // Redirect HTML document requests to the canonical frontend (Vercel)
        const accept = req.headers.accept || '';
        if (accept.includes('text/html')) {
            const qs = req.url.slice(req.path.length); // preserves ?query&string
            const destination = FRONTEND_CANONICAL + req.path + qs;
            return res.redirect(301, destination);
        }

        next();
    });
}

// Maintenance mode middleware (before static files)
app.use((req, res, next) => {
    // Always allow these paths
    if (req.path === '/maintenance.html' || 
        req.path.startsWith('/css/') || 
        req.path.startsWith('/js/') ||
        req.path.startsWith('/api/') ||
        req.path === '/ping') {
        return next();
    }
    
    // Redirect to maintenance page when maintenance mode is enabled
    if (config.MAINTENANCE_MODE) {
        return res.redirect('/maintenance.html');
    }
    
    next();
});

app.use(express.static(path.join(__dirname, 'Public')));

// Health check routes (before other middleware)
keepAlive.routes(app);

// General API rate limiting
app.use('/api/', security.rateLimitMiddleware('api_general'));

// ============================================
// REST API Routes
// ============================================

// Auth routes with stricter rate limiting
app.post('/api/auth/register', security.rateLimitMiddleware('api_register'), async (req, res) => {
    try {
        // Bot protection - honeypot check
        if (security.checkHoneypot(req)) {
            // Silently reject bots
            return res.json({ success: true, message: 'Registration successful' });
        }

        const { username, email, password } = req.body;
        
        // Sanitize inputs
        const cleanUsername = security.sanitizeUsername(username);
        const cleanEmail = security.sanitizeEmail(email);
        
        const result = await auth.register(cleanUsername, cleanEmail, password);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/api/auth/login', security.rateLimitMiddleware('api_auth'), async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;
        const clientId = security.getClientIdentifier(req);
        
        // Check if locked out from too many failed attempts
        const lockStatus = security.isLoginLocked(clientId);
        if (lockStatus.locked) {
            return res.json({ 
                success: false, 
                error: `Too many failed attempts. Try again in ${lockStatus.remainingTime} seconds.`
            });
        }
        
        // Check if user is banned before login
        const user = await storage.getUser(usernameOrEmail) || 
                     await storage.getUserByEmail(usernameOrEmail);
        if (user) {
            const restrictions = await moderation.checkRestrictions(user.username);
            if (restrictions.isBanned) {
                const banInfo = restrictions.restrictions.find(r => r.type.includes('ban'));
                return res.json({ 
                    success: false, 
                    error: 'Account is banned',
                    banInfo: {
                        type: banInfo.type,
                        expiresAt: banInfo.expiresAt
                    }
                });
            }
        }
        
        const result = await auth.login(usernameOrEmail, password);
        
        if (!result.success) {
            // Track failed login
            security.recordFailedLogin(clientId);
        } else {
            // Clear failed login record on success
            security.clearFailedLogins(clientId);
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Session verification — accepts both GET and POST so the client-side
// fetch({ method: 'POST' }) call in unified-auth.js is correctly handled.
// Previously only GET was registered; a POST from the client would fall
// through to a 404, causing JSON.parse to throw, and clearSession() to
// fire on every page reload (perpetual logout bug).
async function handleVerifyToken(req, res) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.json({ valid: false });
        }
        const result = auth.verifyToken(token);
        if (result.valid) {
            const user = await auth.getProfile(result.user.username);
            const restrictions = await moderation.checkRestrictions(result.user.username);
            res.json({ valid: true, user, restrictions });
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        res.json({ valid: false });
    }
}
app.get('/api/auth/verify', security.rateLimitMiddleware('api_auth'), handleVerifyToken);
app.post('/api/auth/verify', security.rateLimitMiddleware('api_auth'), handleVerifyToken);

// ============================================
// Web3 Wallet Authentication
// Multi-chain support: Ethereum (MetaMask), Solana (Phantom), XRP (XUMM/Crossmark)
// For AtomicFizz ecosystem integration
// ============================================

app.post('/api/auth/wallet', security.rateLimitMiddleware('api_auth'), async (req, res) => {
    try {
        const walletAuth = require('./api/auth/wallet');
        await walletAuth(req, res);
    } catch (error) {
        console.error('Wallet auth error:', error);
        res.status(500).json({ success: false, error: 'Wallet authentication failed' });
    }
});

// ============================================
// Browser-Native Authentication (Credential Management API)
// FREE - no external dependencies or user limits
// Uses browser's built-in password manager for seamless sign-in
// ============================================

// Get browser auth status and configuration
app.get('/api/auth/browser/status', (req, res) => {
    res.json({
        success: true,
        available: browserAuth.isAvailable(),
        config: browserAuth.getClientConfig()
    });
});

// Verify stored browser credentials
app.post('/api/auth/browser/verify', security.rateLimitMiddleware('api_auth'), async (req, res) => {
    try {
        const credentialData = req.body;
        
        if (!credentialData || !credentialData.id || !credentialData.password) {
            return res.status(400).json({ success: false, error: 'Credentials required' });
        }
        
        const clientId = security.getClientIdentifier(req);
        
        // Check if locked out from too many failed attempts
        const lockStatus = security.isLoginLocked(clientId);
        if (lockStatus.locked) {
            return res.json({ 
                success: false, 
                error: `Too many failed attempts. Try again in ${lockStatus.remainingTime} seconds.`
            });
        }
        
        const result = await browserAuth.verifyStoredCredential(credentialData);
        
        if (!result.success) {
            security.recordFailedLogin(clientId);
        } else {
            security.clearFailedLogins(clientId);
            // Log credential usage for analytics
            await browserAuth.logCredentialUsage(result.user.username, credentialData.type);
            
            // Check if user is banned
            const restrictions = await moderation.checkRestrictions(result.user.username);
            if (restrictions.isBanned) {
                const banInfo = restrictions.restrictions.find(r => r.type.includes('ban'));
                return res.json({ 
                    success: false, 
                    error: 'Account is banned',
                    banInfo: {
                        type: banInfo.type,
                        expiresAt: banInfo.expiresAt
                    }
                });
            }
        }
        
        res.json(result);
    } catch (error) {
        console.error('Browser auth verify error:', error);
        res.status(500).json({ success: false, error: 'Authentication failed' });
    }
});

// Register with browser credential storage
app.post('/api/auth/browser/register', security.rateLimitMiddleware('api_register'), async (req, res) => {
    try {
        // Bot protection - honeypot check
        if (security.checkHoneypot(req)) {
            return res.json({ success: true, message: 'Registration successful' });
        }
        
        const { username, email, password, storeBrowserCredential } = req.body;
        
        // Sanitize inputs
        const cleanUsername = security.sanitizeUsername(username);
        const cleanEmail = security.sanitizeEmail(email);
        
        const result = await browserAuth.registerWithBrowserCredential({
            username: cleanUsername,
            email: cleanEmail,
            password,
            storeBrowserCredential
        });
        
        res.json(result);
    } catch (error) {
        console.error('Browser auth register error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Profile routes
app.get('/api/profile/:username', async (req, res) => {
    try {
        const profile = await auth.getProfile(req.params.username);
        if (profile) {
            res.json({ success: true, profile });
        } else {
            res.json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const result = await auth.updateProfile(req.user.username, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Social routes
app.get('/api/users/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ success: true, users: [] });
        }
        const users = await auth.searchUsers(q, req.user.username);
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/api/follow/:username', authenticateToken, async (req, res) => {
    try {
        // Check if blocked
        const blocked = await moderation.areBlocked(req.user.username, req.params.username);
        if (blocked) {
            return res.json({ success: false, error: 'Cannot follow this user' });
        }
        const result = await auth.followUser(req.user.username, req.params.username);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.delete('/api/follow/:username', authenticateToken, async (req, res) => {
    try {
        const result = await auth.unfollowUser(req.user.username, req.params.username);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.get('/api/following', authenticateToken, async (req, res) => {
    try {
        const following = await auth.getFollowingWithStatus(req.user.username);
        res.json({ success: true, following });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.get('/api/followers', authenticateToken, async (req, res) => {
    try {
        const followers = await auth.getFollowersList(req.user.username);
        res.json({ success: true, followers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Block routes
app.post('/api/block/:username', authenticateToken, async (req, res) => {
    try {
        const result = await moderation.blockUser(req.user.username, req.params.username);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.delete('/api/block/:username', authenticateToken, async (req, res) => {
    try {
        const result = await moderation.unblockUser(req.user.username, req.params.username);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.get('/api/blocked', authenticateToken, async (req, res) => {
    try {
        const blocked = await moderation.getBlockedUsers(req.user.username);
        res.json({ success: true, blocked });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Report routes with rate limiting
app.post('/api/report', authenticateToken, security.rateLimitMiddleware('api_report'), async (req, res) => {
    try {
        const { username, category, description, evidence } = req.body;
        
        // Sanitize inputs
        const cleanDescription = security.sanitizeString(description, 1000);
        
        const result = await moderation.reportUser(
            req.user.username, 
            username, 
            category, 
            cleanDescription,
            evidence
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.get('/api/report/categories', (req, res) => {
    res.json({ success: true, categories: REPORT_CATEGORIES });
});

// Leaderboard routes
app.get('/api/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await storage.getLeaderboard(Math.min(limit, 100));
        res.json({ success: true, leaderboard });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Game routes
app.get('/api/games/active', authenticateToken, async (req, res) => {
    try {
        const games = await gameManager.getActiveGames(req.user.username);
        res.json({ success: true, games });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.get('/api/games/recent', authenticateToken, async (req, res) => {
    try {
        const games = await gameManager.getRecentGames(req.user.username);
        res.json({ success: true, games });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get time controls
app.get('/api/games/time-controls', (req, res) => {
    res.json({ success: true, timeControls: gameManager.getTimeControls() });
});

// Stats route
app.get('/api/stats', async (req, res) => {
    try {
        const onlineCount = await storage.getOnlineCount();
        const leaderboard = await storage.getLeaderboard(1);
        res.json({
            success: true,
            stats: {
                onlinePlayers: onlineCount,
                topPlayer: leaderboard[0]?.username || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Client configuration (public values only)
// SECURITY: Never expose API keys or secrets here. infuraKey / alchemyKey are
// server-side keys and must NOT be returned to unauthenticated clients.
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        config: {
            // Only expose safe, non-secret public configuration
            environment: config.NODE_ENV,
            maintenanceMode: config.MAINTENANCE_MODE
        }
    });
});


// ============================================
// Monetization Routes
// ============================================

// Get monetization status
app.get('/api/monetization/status', authenticateToken, async (req, res) => {
    try {
        const status = await monetization.getStatus(req.user.username);
        res.json(status);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Record ad view and get reward
app.post('/api/monetization/ad-reward', authenticateToken, async (req, res) => {
    try {
        const { rewardType } = req.body;
        const result = await monetization.recordAdView(req.user.username, rewardType || AD_REWARDS.AD_FREE_HOUR);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get available cosmetics
app.get('/api/monetization/cosmetics', (req, res) => {
    res.json({ success: true, cosmetics: COSMETICS });
});

// Equip a cosmetic
app.post('/api/monetization/equip', authenticateToken, async (req, res) => {
    try {
        const { cosmeticType, cosmeticId } = req.body;
        const result = await monetization.equipCosmetic(req.user.username, cosmeticType, cosmeticId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ============================================
// Avatar Upload Routes  
// ============================================

// Avatar upload - accepts base64 image data
app.post('/api/profile/avatar', authenticateToken, async (req, res) => {
    try {
        const { avatarData, avatarType } = req.body;
        
        // Validate avatar type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(avatarType)) {
            return res.status(400).json({ success: false, error: 'Invalid image type. Use JPEG, PNG, GIF, or WebP.' });
        }
        
        // Validate base64 data
        if (!avatarData || typeof avatarData !== 'string') {
            return res.status(400).json({ success: false, error: 'Invalid avatar data' });
        }
        
        // Check size (limit to ~500KB after base64 encoding, roughly 375KB actual)
        if (avatarData.length > 500000) {
            return res.status(400).json({ success: false, error: 'Avatar too large. Max 500KB.' });
        }
        
        // Validate it's actual base64 image data
        if (!avatarData.match(/^data:image\/(jpeg|png|gif|webp);base64,/)) {
            return res.status(400).json({ success: false, error: 'Invalid image format' });
        }
        
        // Store the avatar as a custom uploaded avatar
        const avatar = {
            type: 'custom',
            data: avatarData,
            uploadedAt: new Date().toISOString()
        };
        
        const result = await auth.updateProfile(req.user.username, { avatar });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Reset avatar to default (generated from username)
app.delete('/api/profile/avatar', authenticateToken, async (req, res) => {
    try {
        const user = await storage.getUser(req.user.username);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        // Generate default avatar
        const defaultAvatar = auth.generateAvatar(req.user.username);
        const result = await auth.updateProfile(req.user.username, { avatar: defaultAvatar });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const result = auth.verifyToken(token);
    if (!result.valid) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    req.user = result.user;
    next();
}

// ============================================
// Socket.io Real-time Events
// ============================================

const connectedUsers = new Map();
const userSockets = new Map();

// Monster Rampage arcade sessions (co-op, up to 3 players per room)
const rampageSessions = new Map(); // sessionId -> { players, hostSocket, created }
const RAMPAGE_MAX_PLAYERS   = 3;
const RAMPAGE_MIN_REMOTE_SLOT = 2; // slots 2-3 are remote players; slot 1 is always host

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Authenticate socket connection
    socket.on('authenticate', async (token) => {
        try {
        const result = auth.verifyToken(token);
        if (!result.valid) {
            socket.emit('auth_error', { error: 'Invalid token' });
            return;
        }

        const user = result.user;
        
        // Check if banned
        const restrictions = await moderation.checkRestrictions(user.username);
        if (restrictions.isBanned) {
            socket.emit('auth_error', { error: 'Account is banned', restrictions });
            socket.disconnect();
            return;
        }

        connectedUsers.set(socket.id, user);
        userSockets.set(user.username, socket.id);
        
        await storage.setPlayerOnline(user.username, socket.id);
        
        socket.join(`user:${user.username}`);
        
        // Notify followers
        const followers = await storage.getFollowers(user.username);
        followers.forEach(follower => {
            const followerSocket = userSockets.get(follower);
            if (followerSocket) {
                io.to(followerSocket).emit('friend_online', { username: user.username });
            }
        });

        // Send pending challenges
        const pendingChallenges = gameManager.getPendingChallenges(user.username);
        if (pendingChallenges.length > 0) {
            socket.emit('pending_challenges', pendingChallenges);
        }

        socket.emit('authenticated', { user, restrictions });
        console.log(`User authenticated: ${user.username}`);
        } catch (error) {
            console.error('[socket] authenticate error:', error);
            socket.emit('auth_error', { error: 'Authentication failed. Please try again.' });
        }
    });

    // Matchmaking
    socket.on('find_match', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) {
            socket.emit('error', { error: 'Not authenticated' });
            return;
        }

        // Check restrictions
        const restrictions = await moderation.checkRestrictions(user.username);
        if (restrictions.isBanned) {
            socket.emit('error', { error: 'Cannot play while banned' });
            return;
        }

        const gameType = data?.gameType || 'ultimate-tictactoe';
        const timeControl = data?.timeControl || 'rapid-10';
        const result = await gameManager.findMatch(user.username, gameType, timeControl);
        
        if (result.matched) {
            socket.join(`game:${result.game.id}`);
            const opponentSocket = userSockets.get(result.game.players.X.username);
            if (opponentSocket) {
                io.sockets.sockets.get(opponentSocket)?.join(`game:${result.game.id}`);
            }
            io.to(`game:${result.game.id}`).emit('game_start', result.game);
        } else if (result.queued) {
            socket.emit('matchmaking_queued', { message: 'Looking for opponent...', timeControl });
        } else {
            socket.emit('matchmaking_error', { error: result.error });
        }
    });

    socket.on('cancel_matchmaking', () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            gameManager.cancelMatchmaking(user.username);
            socket.emit('matchmaking_cancelled');
        }
    });

    // Challenge a player
    socket.on('challenge_player', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) {
            socket.emit('error', { error: 'Not authenticated' });
            return;
        }

        // Check if can interact (blocked/banned)
        const canInteract = await moderation.canInteract(user.username, data.targetUsername);
        if (!canInteract.allowed) {
            socket.emit('challenge_error', { error: 'Cannot challenge this player' });
            return;
        }

        const result = await gameManager.challengePlayer(
            user.username, 
            data.targetUsername, 
            data.gameType,
            data.timeControl || 'rapid-10'
        );

        if (result.success) {
            socket.emit('challenge_sent', result.challenge);
            
            const targetSocket = userSockets.get(data.targetUsername);
            if (targetSocket) {
                io.to(targetSocket).emit('challenge_received', {
                    ...result.challenge,
                    challengerProfile: await auth.getProfile(user.username)
                });
            }
        } else {
            socket.emit('challenge_error', { error: result.error });
        }
    });

    socket.on('accept_challenge', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const result = await gameManager.acceptChallenge(data.challengeId, user.username);
        
        if (result.success) {
            socket.join(`game:${result.game.id}`);
            const challengerSocket = userSockets.get(result.game.players.X.username);
            if (challengerSocket) {
                io.sockets.sockets.get(challengerSocket)?.join(`game:${result.game.id}`);
            }
            
            io.to(`game:${result.game.id}`).emit('game_start', result.game);
        } else {
            socket.emit('challenge_error', { error: result.error });
        }
    });

    socket.on('decline_challenge', (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const challenge = gameManager.activeChallenges?.get(data.challengeId);
        const result = gameManager.declineChallenge(data.challengeId, user.username);
        
        if (result.success && challenge) {
            const challengerSocket = userSockets.get(challenge.challenger);
            if (challengerSocket) {
                io.to(challengerSocket).emit('challenge_declined', {
                    challengeId: data.challengeId,
                    declinedBy: user.username
                });
            }
        }
    });

    // Create private game
    socket.on('create_private_game', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const game = await gameManager.createGame(user.username, data.gameType, true, data.timeControl || 'rapid-10');
        socket.join(`game:${game.id}`);
        socket.emit('private_game_created', { game, inviteCode: game.id });
    });

    socket.on('join_private_game', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const result = await gameManager.joinGame(data.gameId, user.username);
        
        if (result.success) {
            socket.join(`game:${result.game.id}`);
            io.to(`game:${result.game.id}`).emit('game_start', result.game);
        } else {
            socket.emit('join_error', { error: result.error });
        }
    });

    // Game moves
    socket.on('make_move', async (data) => {
        try {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        if (!data || typeof data.gameId !== 'string' || data.move === undefined) {
            socket.emit('move_error', { error: 'Invalid move data' });
            return;
        }

        const result = await gameManager.makeMove(data.gameId, user.username, data.move);
        
        if (result.success) {
            io.to(`game:${data.gameId}`).emit('game_update', result.game);
            
            if (result.game.status === 'finished') {
                io.to(`game:${data.gameId}`).emit('game_ended', {
                    game: result.game,
                    winner: result.game.winner
                });
            }
        } else {
            socket.emit('move_error', { error: result.error });
        }
        } catch (error) {
            console.error('[socket] make_move error:', error);
            socket.emit('move_error', { error: 'Internal error processing move' });
        }
    });

    // Forfeit game
    socket.on('forfeit_game', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        if (!data || typeof data.gameId !== 'string') {
            socket.emit('error', { error: 'Invalid forfeit data' });
            return;
        }

        const result = await gameManager.forfeitGame(data.gameId, user.username);
        
        if (result.success) {
            io.to(`game:${data.gameId}`).emit('game_ended', {
                game: result.game,
                winner: result.game.winner,
                forfeit: true
            });
        }
    });

    // In-game chat with moderation
    socket.on('game_chat', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        if (!data || typeof data.gameId !== 'string' || typeof data.message !== 'string') {
            socket.emit('chat_error', { error: 'Invalid chat data' });
            return;
        }

        // Check if muted
        const canSend = await moderation.canSendMessage(user.username);
        if (!canSend.allowed) {
            socket.emit('chat_error', { 
                error: `You are ${canSend.reason}`,
                expiresAt: canSend.expiresAt
            });
            return;
        }

        const message = {
            id: Date.now(),
            username: user.username,
            text: data.message.slice(0, 500),
            timestamp: new Date().toISOString()
        };

        await storage.addMessage(`game:${data.gameId}`, message);
        io.to(`game:${data.gameId}`).emit('chat_message', { gameId: data.gameId, message });
    });

    // Lobby chat
    socket.on('join_lobby', () => {
        const user = connectedUsers.get(socket.id);
        if (!user) { socket.emit('error', { error: 'Not authenticated' }); return; }
        socket.join('lobby');
        socket.emit('joined_lobby');
    });

    socket.on('lobby_chat', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        if (!data || typeof data.message !== 'string') {
            socket.emit('chat_error', { error: 'Invalid message data' });
            return;
        }

        const canSend = await moderation.canSendMessage(user.username);
        if (!canSend.allowed) {
            socket.emit('chat_error', { 
                error: `You are ${canSend.reason}`,
                expiresAt: canSend.expiresAt
            });
            return;
        }

        const message = {
            id: Date.now(),
            username: user.username,
            text: data.message.slice(0, 500),
            timestamp: new Date().toISOString()
        };

        await storage.addMessage('lobby', message);
        io.to('lobby').emit('lobby_message', message);
    });

    // Direct messaging with block check
    socket.on('direct_message', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        if (!data || typeof data.to !== 'string' || typeof data.message !== 'string') {
            socket.emit('dm_error', { error: 'Invalid message data' });
            return;
        }

        // Check if blocked
        const blocked = await moderation.areBlocked(user.username, data.to);
        if (blocked) {
            socket.emit('dm_error', { error: 'Cannot message this user' });
            return;
        }

        const canSend = await moderation.canSendMessage(user.username);
        if (!canSend.allowed) {
            socket.emit('chat_error', { 
                error: `You are ${canSend.reason}`,
                expiresAt: canSend.expiresAt
            });
            return;
        }

        const message = {
            id: Date.now(),
            from: user.username,
            to: data.to,
            text: data.message.slice(0, 500),
            timestamp: new Date().toISOString()
        };

        const roomId = [user.username, data.to].sort().join(':');
        await storage.addMessage(`dm:${roomId}`, message);

        const recipientSocket = userSockets.get(data.to);
        if (recipientSocket) {
            io.to(recipientSocket).emit('direct_message', message);
        }
        
        socket.emit('message_sent', message);
    });

    // Get chat history
    socket.on('get_chat_history', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        let roomId;
        if (data.type === 'game') {
            roomId = `game:${data.id}`;
        } else if (data.type === 'dm') {
            roomId = `dm:${[user.username, data.id].sort().join(':')}`;
        } else {
            roomId = 'lobby';
        }

        const messages = await storage.getMessages(roomId, data.limit || 50);
        socket.emit('chat_history', { type: data.type, id: data.id, messages });
    });

    // Report player via socket
    socket.on('report_player', async (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const result = await moderation.reportUser(
            user.username,
            data.username,
            data.category,
            data.description,
            data.evidence
        );

        socket.emit('report_submitted', result);
    });

    // Disconnect handling
    // ── Monster Rampage: Online Co-op ────────────────────────────────

    // Create a new co-op session (host)
    socket.on('rampage_create', (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) { socket.emit('error', { error: 'Not authenticated' }); return; }
        // Use crypto for a collision-resistant, URL-safe session ID
        const sessionId = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F7B2"
        rampageSessions.set(sessionId, {
            players: [{ socketId: socket.id, name: (data && data.name) || 'P1', slot: 1 }],
            hostSocket: socket.id,
            created: Date.now()
        });
        socket.join(`rampage:${sessionId}`);
        socket.emit('rampage_created', { sessionId, slot: 1 });
        console.log(`[rampage] Session created: ${sessionId}`);
    });

    // Join an existing co-op session
    socket.on('rampage_join', (data) => {
        const user = connectedUsers.get(socket.id);
        if (!user) { socket.emit('error', { error: 'Not authenticated' }); return; }
        if (!data || !data.sessionId) return;
        const session = rampageSessions.get(data.sessionId);
        if (!session) {
            socket.emit('rampage_error', { error: 'Session not found' });
            return;
        }
        if (session.players.length >= RAMPAGE_MAX_PLAYERS) {
            socket.emit('rampage_error', { error: `Session is full (max ${RAMPAGE_MAX_PLAYERS} players)` });
            return;
        }
        const slot = session.players.length + 1;
        const name = (data.name) || `P${slot}`;
        session.players.push({ socketId: socket.id, name, slot });
        socket.join(`rampage:${data.sessionId}`);
        socket.emit('rampage_joined', { sessionId: data.sessionId, slot });
        io.to(`rampage:${data.sessionId}`).emit('rampage_player_joined', {
            slot, name, playerCount: session.players.length
        });
        console.log(`[rampage] Player joined session ${data.sessionId} as slot ${slot}`);
    });

    // Relay remote player input to the host for authoritative simulation
    socket.on('rampage_input', (data) => {
        // Require an authenticated user before relaying any input.
        // Without this check, any connected socket knowing a session ID
        // could flood the host with arbitrary inputs (DoS vector).
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        if (!data || !data.sessionId) return;
        const session = rampageSessions.get(data.sessionId);
        if (!session) return;
        // Only relay valid slot numbers and compact input objects
        const slot = parseInt(data.slot, 10);
        if (isNaN(slot) || slot < RAMPAGE_MIN_REMOTE_SLOT || slot > RAMPAGE_MAX_PLAYERS) return;
        io.to(session.hostSocket).emit('rampage_remote_input', { slot, input: data.input });
    });

    // Host broadcasts authoritative game state to all remote players
    socket.on('rampage_state', (data) => {
        if (!data || !data.sessionId) return;
        const session = rampageSessions.get(data.sessionId);
        if (!session || session.hostSocket !== socket.id) return;
        socket.to(`rampage:${data.sessionId}`).emit('rampage_state_update', { state: data.state });
    });

    // Leave a co-op session
    socket.on('rampage_leave', (data) => {
        if (!data || !data.sessionId) return;
        const session = rampageSessions.get(data.sessionId);
        if (!session) return;
        session.players = session.players.filter(p => p.socketId !== socket.id);
        socket.leave(`rampage:${data.sessionId}`);
        if (session.players.length === 0) {
            rampageSessions.delete(data.sessionId);
            console.log(`[rampage] Session ${data.sessionId} closed (empty)`);
        } else {
            // If the host left, promote the next player as host
            if (session.hostSocket === socket.id && session.players.length > 0) {
                session.hostSocket = session.players[0].socketId;
            }
            io.to(`rampage:${data.sessionId}`).emit('rampage_player_left', {
                playerCount: session.players.length
            });
        }
    });

    socket.on('disconnect', async () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            await storage.setPlayerOffline(user.username);
            userSockets.delete(user.username);
            connectedUsers.delete(socket.id);
            
            gameManager.cancelMatchmaking(user.username);

            const followers = await storage.getFollowers(user.username);
            followers.forEach(follower => {
                const followerSocket = userSockets.get(follower);
                if (followerSocket) {
                    io.to(followerSocket).emit('friend_offline', { username: user.username });
                }
            });

            console.log(`User disconnected: ${user.username}`);
        }

        // Clean up any Monster Rampage co-op sessions this socket was part of
        for (const [sid, session] of rampageSessions) {
            const wasInSession = session.players.some(p => p.socketId === socket.id);
            if (!wasInSession) continue;
            session.players = session.players.filter(p => p.socketId !== socket.id);
            if (session.players.length === 0) {
                rampageSessions.delete(sid);
            } else {
                if (session.hostSocket === socket.id) {
                    session.hostSocket = session.players[0].socketId;
                }
                io.to(`rampage:${sid}`).emit('rampage_player_left', {
                    playerCount: session.players.length
                });
            }
        }
    });
});

// ============================================
// Catch-all route for SPA
// ============================================

app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: 'API endpoint not found' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// ============================================
// Start Server
// ============================================

async function startServer() {
    // Run boot sequence
    await boot.run();
    
    // Initialize storage
    await storage.initialize();
    
    server.listen(config.PORT, () => {
        // Start keep-alive service for Render (prevents free tier from sleeping)
        const renderUrl = process.env.RENDER_EXTERNAL_URL;
        if (renderUrl) {
            keepAlive.start(renderUrl, 14 * 60 * 1000); // Ping every 14 minutes
        }
        
        console.log(`  ${'\x1b[32m'}✓ Server listening on port ${config.PORT}${'\x1b[0m'}\n`);
    });
}

startServer().catch((err) => {
    console.error('[server] Fatal startup error:', err);
    process.exit(1);
});

// ============================================
// Global Process Error Handlers
// ============================================

// Catch unhandled promise rejections — prevents Node from crashing silently.
// We log the rejection and exit so the process manager (Render) can restart clean.
process.on('unhandledRejection', (reason, promise) => {
    console.error('[server] Unhandled promise rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Catch synchronous uncaught exceptions. After an uncaught exception the
// process is in an undefined state; exit immediately so it can be restarted.
process.on('uncaughtException', (err) => {
    console.error('[server] Uncaught exception:', err);
    process.exit(1);
});
