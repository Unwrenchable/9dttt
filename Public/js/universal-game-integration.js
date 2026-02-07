/**
 * Universal Game Integration Template
 * Shows how to integrate all systems: Auth, Leaderboards, Fullscreen, Multiplayer, Tokens
 * 
 * Add this to any game HTML file:
 * 
 * <script src="../js/universal-auth.js"></script>
 * <script src="../js/global-leaderboard.js"></script>
 * <script src="../js/leaderboard-ui.js"></script>
 * <script src="../js/fullscreen-manager.js"></script>
 * <script src="../js/auth-ui.js"></script>
 * <script src="../js/multiplayer-client.js"></script>
 * 
 * Then use this integration code:
 */

class UniversalGameIntegration {
    constructor(gameId, gameName) {
        this.gameId = gameId;
        this.gameName = gameName;
        this.score = 0;
        this.isMultiplayer = false;
        this.setupIntegration();
    }
    
    setupIntegration() {
        // Add game menu UI
        this.createGameMenu();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup mobile controls if needed
        if (window.mobileControls) {
            window.mobileControls.show();
        }
        
        // Check for auto-login
        this.checkAutoLogin();
    }
    
    createGameMenu() {
        // Add floating menu button
        const menuBtn = document.createElement('button');
        menuBtn.innerHTML = '☰';
        menuBtn.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            border: 2px solid #fff;
            border-radius: 8px;
            width: 44px;
            height: 44px;
            font-size: 24px;
            cursor: pointer;
            backdrop-filter: blur(10px);
        `;
        menuBtn.onclick = () => this.showGameMenu();
        document.body.appendChild(menuBtn);
    }
    
    showGameMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        menu.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; max-width: 400px;">
                <h2 style="color: #fff; text-align: center; margin-bottom: 30px;">${this.gameName}</h2>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <button class="menu-btn" onclick="window.authUI.show(); this.closest('div[style*=fixed]').remove();">
                        🔑 Account
                    </button>
                    <button class="menu-btn" onclick="window.leaderboardUI.show(); this.closest('div[style*=fixed]').remove();">
                        🏆 Leaderboards
                    </button>
                    <button class="menu-btn" onclick="window.fullscreenManager.toggle(); this.closest('div[style*=fixed]').remove();">
                        ⛶ Fullscreen
                    </button>
                    <button class="menu-btn" onclick="window.gameIntegration.createMultiplayerRoom(); this.closest('div[style*=fixed]').remove();">
                        🎮 Multiplayer
                    </button>
                    <button class="menu-btn" onclick="window.gameIntegration.shareScore(); this.closest('div[style*=fixed]').remove();">
                        📤 Share Score
                    </button>
                    <button class="menu-btn" onclick="this.closest('div[style*=fixed]').remove();">
                        ❌ Close
                    </button>
                </div>
            </div>
            <style>
                .menu-btn {
                    background: #fff;
                    color: #333;
                    border: none;
                    padding: 15px 20px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .menu-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
            </style>
        `;
        
        document.body.appendChild(menu);
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC - Show menu
            if (e.key === 'Escape') {
                this.showGameMenu();
            }
            
            // Shift+L - Leaderboards
            if (e.key === 'L' && e.shiftKey) {
                window.leaderboardUI.show();
            }
            
            // Shift+A - Account
            if (e.key === 'A' && e.shiftKey) {
                window.authUI.show();
            }
            
            // F11 - Fullscreen (handled by fullscreen manager)
        });
    }
    
    checkAutoLogin() {
        // Check if user is already logged in
        if (!window.unifiedAuth || !window.unifiedAuth.isLoggedIn || !window.unifiedAuth.isLoggedIn()) {
            // Show login prompt after 30 seconds
            setTimeout(() => {
                if (!window.unifiedAuth || !window.unifiedAuth.isLoggedIn || !window.unifiedAuth.isLoggedIn()) {
                    this.showLoginPrompt();
                }
            }, 30000);
        }
    }
    
    showLoginPrompt() {
        const prompt = document.createElement('div');
        prompt.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideUp 0.5s ease-out;
        `;
        
        prompt.innerHTML = `
            <div style="color: #fff; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                    🎮 Sign in to earn tokens!
                </div>
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">
                    Save your progress and compete globally
                </div>
                <button onclick="window.authUI.show(); this.closest('div[style*=fixed]').remove();" 
                        style="background: #fff; color: #667eea; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    Sign In Now
                </button>
                <button onclick="this.closest('div[style*=fixed]').remove();" 
                        style="background: transparent; color: #fff; border: 2px solid #fff; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-left: 10px;">
                    Later
                </button>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.remove();
            }
        }, 15000);
    }
    
    // Submit score when game ends
    async submitScore(score, metadata = {}) {
        this.score = score;
        
        if (window.globalLeaderboard && window.unifiedAuth?.isLoggedIn && window.unifiedAuth.isLoggedIn()) {
            const scoreEntry = await window.globalLeaderboard.submitScore(
                this.gameId,
                score,
                {
                    ...metadata,
                    gameName: this.gameName,
                    timestamp: Date.now()
                }
            );
            
            if (scoreEntry && scoreEntry.tokensEarned > 0) {
                this.showScoreSubmitted(scoreEntry);
            }
            
            return scoreEntry;
        } else {
            // Prompt user to log in
            this.showLoginToSaveScore(score);
            return null;
        }
    }
    
    showScoreSubmitted(scoreEntry) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            text-align: center;
            color: #fff;
            animation: popIn 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
            <h2 style="margin: 0 0 15px 0;">Score Submitted!</h2>
            <div style="font-size: 36px; margin: 20px 0; font-weight: bold;">${scoreEntry.score.toLocaleString()}</div>
            <div style="font-size: 24px; margin: 15px 0;">+${scoreEntry.tokensEarned} 🪙 Tokens</div>
            <div style="display: flex; gap: 10px; margin-top: 30px;">
                <button onclick="window.leaderboardUI.show(); this.closest('div[style*=fixed]').remove();" 
                        style="flex: 1; background: #fff; color: #667eea; border: none; padding: 15px; border-radius: 10px; font-weight: bold; cursor: pointer;">
                    View Leaderboard
                </button>
                <button onclick="this.closest('div[style*=fixed]').remove();" 
                        style="flex: 1; background: rgba(255,255,255,0.2); color: #fff; border: 2px solid #fff; padding: 15px; border-radius: 10px; font-weight: bold; cursor: pointer;">
                    Continue
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    showLoginToSaveScore(score) {
        const prompt = document.createElement('div');
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            text-align: center;
            color: #fff;
        `;
        
        prompt.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h2 style="margin: 0 0 15px 0;">Sign in to save your score!</h2>
            <div style="font-size: 24px; margin: 20px 0; font-weight: bold;">Score: ${score.toLocaleString()}</div>
            <div style="margin-bottom: 30px; opacity: 0.9;">
                Create an account to save scores and earn tokens
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="window.authUI.show(); this.closest('div[style*=fixed]').remove();" 
                        style="flex: 1; background: #fff; color: #f5576c; border: none; padding: 15px; border-radius: 10px; font-weight: bold; cursor: pointer;">
                    Sign In
                </button>
                <button onclick="this.closest('div[style*=fixed]').remove();" 
                        style="flex: 1; background: rgba(255,255,255,0.2); color: #fff; border: 2px solid #fff; padding: 15px; border-radius: 10px; font-weight: bold; cursor: pointer;">
                    Skip
                </button>
            </div>
        `;
        
        document.body.appendChild(prompt);
    }
    
    async createMultiplayerRoom() {
        if (!window.multiplayerClient) {
            alert('Multiplayer not available');
            return;
        }
        
        const roomCode = await window.multiplayerClient.createP2PRoom(this.gameId);
        this.isMultiplayer = true;
        
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            text-align: center;
            color: #fff;
        `;
        
        panel.innerHTML = `
            <h2 style="margin: 0 0 20px 0;">Multiplayer Room Created</h2>
            <div style="font-size: 48px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px;">
                ${roomCode}
            </div>
            <div style="margin-bottom: 30px; opacity: 0.9;">
                Share this code with friends to play together
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="navigator.clipboard.writeText('${roomCode}'); alert('Code copied!');" 
                        style="flex: 1; background: #fff; color: #667eea; border: none; padding: 15px; border-radius: 10px; font-weight: bold; cursor: pointer;">
                    📋 Copy Code
                </button>
                <button onclick="this.closest('div[style*=fixed]').remove();" 
                        style="flex: 1; background: rgba(255,255,255,0.2); color: #fff; border: 2px solid #fff; padding: 15px; border-radius: 10px; font-weight: bold; cursor: pointer;">
                    Start Game
                </button>
            </div>
        `;
        
        document.body.appendChild(panel);
    }
    
    shareScore() {
        const user = window.universalAuth?.getUser();
        const text = `I scored ${this.score.toLocaleString()} in ${this.gameName}! Can you beat it? 🎮`;
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: this.gameName,
                text: text,
                url: url
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text + ' ' + url);
            alert('Score shared! Link copied to clipboard.');
        }
    }
}

// CSS Animations
const gameIntegrationStyle = document.createElement('style');
gameIntegrationStyle.textContent = `
    @keyframes slideUp {
        from {
            transform: translateY(100px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes popIn {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }
`;
document.head.appendChild(gameIntegrationStyle);

/* 
 * USAGE EXAMPLE:
 * 
 * In your game file (e.g., contra-commando.html), add after loading all scripts:
 * 
 * <script>
 *   // Initialize universal game integration
 *   window.gameIntegration = new UniversalGameIntegration('contra-commando', 'Contra Commando');
 *   
 *   // When game ends, submit score:
 *   async function gameOver() {
 *       await window.gameIntegration.submitScore(finalScore, {
 *           level: currentLevel,
 *           accuracy: hitRate,
 *           time: gameTime
 *       });
 *   }
 * </script>
 */
