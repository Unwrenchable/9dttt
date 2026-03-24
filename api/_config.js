/**
 * API Configuration
 * Shared utilities for all API endpoints
 */

// Allowed origins for CORS — mirrors the list in server.js.
// Wildcard (*) is intentionally NOT used to prevent credential leakage
// from cross-origin pages that send a Bearer token.
const ALLOWED_ORIGINS = [
    'https://d9ttt.com',
    'https://www.d9ttt.com',
    'https://9dttt.vercel.app',
    'https://ninedttt.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000'
];

/**
 * Return the CORS headers appropriate for the incoming request origin.
 * Only allowed origins are reflected; unknown origins get no ACAO header.
 */
function getCorsHeaders(req) {
    const origin = (req && req.headers && req.headers.origin) || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
    return {
        'Access-Control-Allow-Origin': allowedOrigin || 'https://d9ttt.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    };
}

// Legacy constant kept for backwards compat — prefer getCorsHeaders(req) for new code.
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://d9ttt.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map();

function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitMap.has(identifier)) {
        rateLimitMap.set(identifier, []);
    }
    
    const requests = rateLimitMap.get(identifier);
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
        return false;
    }
    
    recentRequests.push(now);
    rateLimitMap.set(identifier, recentRequests);
    return true;
}

// Clean up old rate limit entries
setInterval(() => {
    const now = Date.now();
    const windowMs = 60000;
    
    for (const [identifier, requests] of rateLimitMap.entries()) {
        const recentRequests = requests.filter(timestamp => timestamp > now - windowMs);
        if (recentRequests.length === 0) {
            rateLimitMap.delete(identifier);
        } else {
            rateLimitMap.set(identifier, recentRequests);
        }
    }
}, 60000);

// Error response helper
function errorResponse(statusCode, message) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            error: message,
            timestamp: new Date().toISOString()
        })
    };
}

// Success response helper
function successResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            ...data,
            timestamp: new Date().toISOString()
        })
    };
}

// Validate required fields
function validateFields(body, requiredFields) {
    const missing = requiredFields.filter(field => !body[field]);
    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }
    return null;
}

module.exports = {
    CORS_HEADERS,
    getCorsHeaders,
    checkRateLimit,
    errorResponse,
    successResponse,
    validateFields
};
