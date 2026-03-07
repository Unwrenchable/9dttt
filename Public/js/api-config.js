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

    // All known production front-end hostnames (Vercel + custom domain)
    const isProduction = window.location.hostname === '9dttt.vercel.app' || 
                        window.location.hostname === 'd9ttt.com' || 
                        window.location.hostname === 'www.d9ttt.com';

    // Accessing the backend directly (e.g. ninedttt.onrender.com)
    const isRenderDirect = window.location.hostname === 'ninedttt.onrender.com';
    
    // Canonical backend URL (Render)
    const BACKEND_URL = 'https://ninedttt.onrender.com';

    // Determine which backend to use
    let backendUrl;
    let wsUrl;
    let isProxied = false;

    if (isLocalhost) {
        // Development: Connect directly to local backend
        backendUrl = 'http://localhost:3000';
        wsUrl = 'ws://localhost:3000';
    } else if (isRenderDirect) {
        // Accessed via Render URL directly: connect to backend on same host
        backendUrl = BACKEND_URL;
        wsUrl = BACKEND_URL.replace('https:', 'wss:');
    } else if (isProduction || isVercel) {
        // Production/Vercel: HTTP API calls use relative URLs (proxied by Vercel to Render).
        // Socket.io connects DIRECTLY to the Render backend to avoid Vercel WebSocket
        // proxy limitations (Vercel rewrites do not reliably upgrade WebSocket connections).
        backendUrl = ''; // Empty string = same domain (proxied by Vercel)
        wsUrl = BACKEND_URL; // Socket.io accepts HTTPS URLs and upgrades to WSS internally
        isProxied = true;
    } else {
        // Fallback: Direct connection to production backend
        backendUrl = BACKEND_URL;
        wsUrl = BACKEND_URL.replace('https:', 'wss:');
    }

    // Global API configuration
    window.API_BASE_URL = backendUrl;
    window.API_CONFIG = {
        baseUrl: backendUrl,
        apiUrl: `${backendUrl}/api`,
        wsUrl: wsUrl,
        environment: isLocalhost ? 'development' : 'production',
        isProxied: isProxied
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
