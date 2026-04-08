/**
 * Security Module
 * Rate limiting, bot protection, and security utilities
 */

const config = require('./config');

// Rate limiter storage (in-memory, resets on restart)
const rateLimits = new Map();
const failedLogins = new Map();
const suspiciousActivity = new Map();

// Rate limit configurations
const RATE_LIMITS = {
    // API endpoints
    api_general: { requests: 100, windowMs: 60000 },      // 100 requests per minute
    api_auth: { requests: 10, windowMs: 60000 },          // 10 auth attempts per minute
    api_register: { requests: 3, windowMs: 300000 },      // 3 registrations per 5 minutes
    api_report: { requests: 5, windowMs: 300000 },        // 5 reports per 5 minutes
    
    // Socket events
    socket_chat: { requests: 30, windowMs: 60000 },       // 30 messages per minute
    socket_matchmaking: { requests: 10, windowMs: 60000 }, // 10 matchmaking attempts per minute
    socket_challenge: { requests: 20, windowMs: 60000 },  // 20 challenges per minute
    socket_move: { requests: 60, windowMs: 60000 },       // 60 moves per minute (fast games)
};

class Security {
    constructor() {
        // Clean up old rate limit entries every 5 minutes
        setInterval(() => this.cleanupRateLimits(), 5 * 60 * 1000);
    }

    // ==========================================
    // RATE LIMITING
    // ==========================================

    /**
     * Check if request should be rate limited
     * @returns {object} { allowed: boolean, remaining: number, resetIn: number }
     */
    checkRateLimit(identifier, type = 'api_general') {
        const limit = RATE_LIMITS[type] || RATE_LIMITS.api_general;
        const key = `${type}:${identifier}`;
        const now = Date.now();

        if (!rateLimits.has(key)) {
            rateLimits.set(key, { count: 1, windowStart: now });
            return { allowed: true, remaining: limit.requests - 1, resetIn: limit.windowMs };
        }

        const record = rateLimits.get(key);

        // Reset window if expired
        if (now - record.windowStart > limit.windowMs) {
            rateLimits.set(key, { count: 1, windowStart: now });
            return { allowed: true, remaining: limit.requests - 1, resetIn: limit.windowMs };
        }

        // Check if limit exceeded
        if (record.count >= limit.requests) {
            const resetIn = limit.windowMs - (now - record.windowStart);
            return { allowed: false, remaining: 0, resetIn };
        }

        // Increment count
        record.count++;
        return { 
            allowed: true, 
            remaining: limit.requests - record.count, 
            resetIn: limit.windowMs - (now - record.windowStart) 
        };
    }

    /**
     * Express middleware for rate limiting
     */
    rateLimitMiddleware(type = 'api_general') {
        return (req, res, next) => {
            const identifier = this.getClientIdentifier(req);
            const result = this.checkRateLimit(identifier, type);

            // Set rate limit headers
            res.set('X-RateLimit-Remaining', result.remaining.toString());
            res.set('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000).toString());

            if (!result.allowed) {
                return res.status(429).json({
                    success: false,
                    error: 'Too many requests. Please slow down.',
                    retryAfter: Math.ceil(result.resetIn / 1000)
                });
            }

            next();
        };
    }

    /**
     * Socket rate limiting
     */
    checkSocketRateLimit(socketId, username, type) {
        const identifier = username || socketId;
        return this.checkRateLimit(identifier, type);
    }

    // ==========================================
    // BOT PROTECTION
    // ==========================================

    /**
     * Check for bot-like behavior
     */
    checkBotBehavior(identifier, action) {
        const key = `bot:${identifier}`;
        const now = Date.now();

        if (!suspiciousActivity.has(key)) {
            suspiciousActivity.set(key, { 
                actions: [{ action, time: now }],
                score: 0 
            });
            return { isBot: false, score: 0 };
        }

        const record = suspiciousActivity.get(key);
        
        // Add new action
        record.actions.push({ action, time: now });
        
        // Keep only last 100 actions in last 5 minutes
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        record.actions = record.actions.filter(a => a.time > fiveMinutesAgo).slice(-100);

        // Calculate suspicion score
        let score = 0;

        // Check for rapid identical actions
        const recentActions = record.actions.filter(a => a.time > now - 10000);
        if (recentActions.length > 20) score += 30; // Too many actions in 10 seconds
        
        // Check for consistent timing (bot-like)
        if (record.actions.length >= 5) {
            const intervals = [];
            for (let i = 1; i < Math.min(record.actions.length, 10); i++) {
                intervals.push(record.actions[i].time - record.actions[i-1].time);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
            
            // Very consistent timing is suspicious
            if (variance < 100 && avgInterval < 500) score += 40;
        }

        // Check for impossible speed (moves faster than human can click)
        const ultraFast = record.actions.filter(a => a.time > now - 1000).length;
        if (ultraFast > 10) score += 50;

        record.score = Math.min(100, score);

        return { 
            isBot: record.score >= 70, 
            score: record.score,
            warning: record.score >= 40 && record.score < 70
        };
    }

    /**
     * Simple honeypot field check for registration
     */
    checkHoneypot(req) {
        // If a hidden field is filled, it's likely a bot
        const honeypotFields = ['website', 'url', 'fax', 'phone2'];
        for (const field of honeypotFields) {
            if (req.body[field] && req.body[field].length > 0) {
                return true; // Is a bot
            }
        }
        return false;
    }

    /**
     * Check registration timing (too fast = bot)
     */
    checkRegistrationTiming(sessionStart) {
        if (!sessionStart) return false;
        const timeTaken = Date.now() - sessionStart;
        // If form completed in less than 3 seconds, suspicious
        return timeTaken < 3000;
    }

    // ==========================================
    // FAILED LOGIN TRACKING
    // ==========================================

    recordFailedLogin(identifier) {
        const now = Date.now();
        if (!failedLogins.has(identifier)) {
            failedLogins.set(identifier, { count: 1, firstAttempt: now, lastAttempt: now });
            return { locked: false };
        }

        const record = failedLogins.get(identifier);
        
        // Reset if lockout period passed
        if (now - record.lastAttempt > config.LOGIN_LOCKOUT_TIME) {
            failedLogins.set(identifier, { count: 1, firstAttempt: now, lastAttempt: now });
            return { locked: false };
        }

        record.count++;
        record.lastAttempt = now;

        if (record.count >= config.MAX_LOGIN_ATTEMPTS) {
            const lockoutRemaining = config.LOGIN_LOCKOUT_TIME - (now - record.lastAttempt);
            return { 
                locked: true, 
                remainingTime: Math.ceil(lockoutRemaining / 1000),
                attempts: record.count
            };
        }

        return { 
            locked: false, 
            attemptsRemaining: config.MAX_LOGIN_ATTEMPTS - record.count 
        };
    }

    clearFailedLogins(identifier) {
        failedLogins.delete(identifier);
    }

    isLoginLocked(identifier) {
        const record = failedLogins.get(identifier);
        if (!record) return { locked: false };

        const now = Date.now();
        if (now - record.lastAttempt > config.LOGIN_LOCKOUT_TIME) {
            failedLogins.delete(identifier);
            return { locked: false };
        }

        if (record.count >= config.MAX_LOGIN_ATTEMPTS) {
            const lockoutRemaining = config.LOGIN_LOCKOUT_TIME - (now - record.lastAttempt);
            return { 
                locked: true, 
                remainingTime: Math.ceil(lockoutRemaining / 1000)
            };
        }

        return { locked: false };
    }

    // ==========================================
    // INPUT SANITIZATION
    // ==========================================

    sanitizeString(str, maxLength = 500) {
        if (typeof str !== 'string') return '';
        
        // First, limit length
        let sanitized = str.slice(0, maxLength);
        
        // Remove HTML tags iteratively until none remain
        let previous;
        do {
            previous = sanitized;
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        } while (sanitized !== previous);
        
        // Encode remaining special characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        
        return sanitized.trim();
    }

    sanitizeUsername(username) {
        if (typeof username !== 'string') return '';
        return username
            .slice(0, 20)
            .replace(/[^a-zA-Z0-9_]/g, '')
            .toLowerCase();
    }

    sanitizeEmail(email) {
        if (typeof email !== 'string') return '';
        return email.slice(0, 100).toLowerCase().trim();
    }

    // ==========================================
    // SECURITY HEADERS
    // ==========================================

    securityHeadersMiddleware() {
        return (req, res, next) => {
            // Prevent clickjacking
            res.set('X-Frame-Options', 'SAMEORIGIN');
            
            // Prevent MIME type sniffing
            res.set('X-Content-Type-Options', 'nosniff');
            
            // XSS Protection
            res.set('X-XSS-Protection', '1; mode=block');
            
            // Referrer Policy
            res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
            
            // HTTP Strict Transport Security (HSTS) - Force HTTPS
            // max-age=31536000 = 1 year, includeSubDomains for all subdomains
            if (config.NODE_ENV === 'production') {
                res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            }
            
            // Permissions Policy - Restrict browser features
            res.set('Permissions-Policy', 
                'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
            );
            
            // Content Security Policy (CSP)
            // 'unsafe-inline' is required for script-src because the HTML game pages
            // contain inline <script> blocks for game initialisation. Removing it breaks
            // all games. A nonce-based CSP would be the ideal long-term fix, but that
            // requires a server-side template/build step that does not currently exist.
            // Google APIs (Firebase/OAuth) and gstatic are retained as trusted CDNs.
            res.set('Content-Security-Policy', 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "connect-src 'self' wss: ws: https:; " +
                "font-src 'self'; " +
                "frame-src 'self'; " +
                "frame-ancestors 'self'; " +
                "base-uri 'self'; " +
                "form-action 'self';"
            );

            // Cross-Origin policies
            // same-origin-allow-popups: Allows popups to maintain access to the opener window,
            // enabling game windows to interact properly while still protecting against cross-origin attacks
            res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
            // same-site: Permits resources from the same site but different origins (e.g., subdomains)
            // to be loaded, allowing games to access their assets while blocking cross-site resource access
            res.set('Cross-Origin-Resource-Policy', 'same-site');

            next();
        };
    }

    /**
     * HTTPS redirect middleware for production
     */
    httpsRedirectMiddleware() {
        return (req, res, next) => {
            // Only redirect in production and if not already HTTPS
            if (config.NODE_ENV === 'production' && 
                req.headers['x-forwarded-proto'] !== 'https') {
                return res.redirect(301, `https://${req.headers.host}${req.url}`);
            }
            next();
        };
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    getClientIdentifier(req) {
        // Use forwarded IP if behind proxy (like Render)
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.ip || 
               req.connection?.remoteAddress ||
               'unknown';
    }

    cleanupRateLimits() {
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 minutes

        for (const [key, record] of rateLimits.entries()) {
            if (now - record.windowStart > maxAge) {
                rateLimits.delete(key);
            }
        }

        for (const [key, record] of suspiciousActivity.entries()) {
            if (record.actions.length === 0 || 
                now - record.actions[record.actions.length - 1].time > maxAge) {
                suspiciousActivity.delete(key);
            }
        }

        for (const [key, record] of failedLogins.entries()) {
            if (now - record.lastAttempt > config.LOGIN_LOCKOUT_TIME) {
                failedLogins.delete(key);
            }
        }
    }
}

module.exports = new Security();
