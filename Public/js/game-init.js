/**
 * Universal Game Initializer
 * Single script that initializes authentication, UI, and common game features
 * Include this in every game HTML file to ensure consistency
 */

(async function() {
    'use strict';
    
    console.log('🎮 Initializing game...');
    
    // 1. Initialize Firebase if available
    async function initFirebase() {
        if (typeof firebase === 'undefined') {
            console.log('Firebase not loaded');
            return false;
        }
        
        try {
            const response = await fetch('/api/auth/firebase/status');
            const data = await response.json();
            
            if (data.available && data.config && !firebase.apps.length) {
                firebase.initializeApp(data.config);
                console.log('✅ Firebase initialized');
                return true;
            }
        } catch (error) {
            console.log('Firebase not configured');
        }
        return false;
    }
    
    // 2. Initialize Unified Auth
    async function initAuth() {
        if (!window.unifiedAuth) {
            console.error('Unified auth not loaded!');
            return;
        }
        
        await window.unifiedAuth.init();
        console.log('✅ Authentication ready');
        
        // Show welcome message for logged-in users
        const user = window.unifiedAuth.getUser();
        if (user && !user.isGuest) {
            console.log(`👋 Welcome back, ${user.displayName || user.username}!`);
        }
    }
    
    // 3. Initialize Game UI
    function initGameUI() {
        if (window.GameUI && !window.gameUI) {
            window.gameUI = new GameUI();
            window.gameUI.init();
            console.log('✅ Game UI initialized');
        }
    }
    
    // 4. Initialize Multiplayer
    function initMultiplayer() {
        if (window.MultiplayerClient && !window.multiplayerClient) {
            window.multiplayerClient = new MultiplayerClient();
            console.log('✅ Multiplayer client ready');
        }
    }
    
    // 5. Initialize Gamepad Support
    function initGamepad() {
        if (window.gamepadManager) {
            console.log('✅ Gamepad support enabled');
        }
    }
    
    // 6. Initialize Accessibility
    function initAccessibility() {
        if (window.AccessibilityManager) {
            window.accessibilityManager = new AccessibilityManager();
            console.log('✅ Accessibility features enabled');
        }
    }
    
    // 7. Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Shift+A: Auth modal
            if (e.shiftKey && e.key === 'A') {
                e.preventDefault();
                if (window.authUI) window.authUI.show();
            }
            
            // Shift+L: Leaderboard
            if (e.shiftKey && e.key === 'L') {
                e.preventDefault();
                if (window.leaderboardUI) window.leaderboardUI.show();
            }
            
            // Shift+M: Menu
            if (e.shiftKey && e.key === 'M') {
                e.preventDefault();
                if (window.gameUI) window.gameUI.toggleMenu();
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                if (window.authUI && document.getElementById('authModal')?.style.display === 'block') {
                    window.authUI.hide();
                }
                if (window.gameUI && window.gameUI.menuOpen) {
                    window.gameUI.toggleMenu();
                }
            }
        });
        
        console.log('✅ Keyboard shortcuts enabled');
        console.log('   Shift+A: Auth | Shift+L: Leaderboard | Shift+M: Menu | Esc: Close');
    }
    
    // 8. Add loading indicator
    function showLoadingIndicator() {
        const loader = document.createElement('div');
        loader.id = 'game-loader';
        loader.innerHTML = `
            <style>
                #game-loader {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(10, 14, 39, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    animation: fadeOut 0.5s ease-out 1s forwards;
                }
                
                @keyframes fadeOut {
                    to {
                        opacity: 0;
                        pointer-events: none;
                    }
                }
                
                .loader-content {
                    text-align: center;
                    color: #fff;
                }
                
                .loader-spinner {
                    width: 60px;
                    height: 60px;
                    border: 4px solid rgba(74, 144, 226, 0.2);
                    border-top-color: #4a90e2;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <h2>🎮 Loading Game...</h2>
                <p>Initializing systems</p>
            </div>
        `;
        document.body.appendChild(loader);
        
        // Remove after initialization
        setTimeout(() => {
            loader.remove();
        }, 1500);
    }
    
    // 9. Initialize everything
    async function initializeAll() {
        showLoadingIndicator();
        
        await initFirebase();
        await initAuth();
        initGameUI();
        initMultiplayer();
        initGamepad();
        initAccessibility();
        setupKeyboardShortcuts();
        
        console.log('🎉 Game initialization complete!');
        
        // Dispatch ready event for game-specific code
        window.dispatchEvent(new Event('gameReady'));
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAll);
    } else {
        initializeAll();
    }
})();
