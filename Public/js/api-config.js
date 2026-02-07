/**
 * API Configuration
 * Automatically detects if running locally or in production
 * and sets the correct backend URL
 */

(function() {
    'use strict';
    
    // Detect environment
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');
    
    const isVercel = window.location.hostname.includes('vercel.app');
    const isProduction = window.location.hostname === '9dttt.vercel.app' || 
                        window.location.hostname === 'd9ttt.com' || 
                        window.location.hostname === 'www.d9ttt.com';
    
    // Backend URLs
    const API_CONFIG = {
        // Development - backend running locally
        development: 'http://localhost:3000',
        
        // Production - backend on Render
        production: 'https://ninedttt.onrender.com',
        
        // Vercel preview - use production backend
        preview: 'https://ninedttt.onrender.com'
    };
    
    // Determine which backend to use
    let backendUrl;
    if (isLocalhost) {
        backendUrl = API_CONFIG.development;
    } else if (isVercel && !isProduction) {
        backendUrl = API_CONFIG.preview;
    } else {
        backendUrl = API_CONFIG.production;
    }
    
    // For Vercel/production, use relative URLs (they're proxied)
    if (isProduction || isVercel) {
        backendUrl = ''; // Empty string = same domain (proxied by Vercel)
    }
    
    // Global API configuration
    window.API_BASE_URL = backendUrl;
    window.API_CONFIG = {
        baseUrl: backendUrl,
        apiUrl: `${backendUrl}/api`,
        wsUrl: backendUrl.replace('https:', 'wss:').replace('http:', 'ws:'),
        environment: isLocalhost ? 'development' : 'production',
        isProxied: isProduction || isVercel
    };
    
    // Silent configuration
    
    // Helper function for API calls
    window.apiCall = async function(endpoint, options = {}) {
        const url = `${window.API_CONFIG.apiUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include' // Important for cookies/sessions
        };
        
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    };
    
    // Override fetch URLs if needed
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // If URL starts with /api or /socket.io, prepend API base URL if in development
        if (typeof url === 'string' && isLocalhost && (url.startsWith('/api') || url.startsWith('/socket.io'))) {
            url = window.API_BASE_URL + url;
        }
        return originalFetch(url, options);
    };
})();
