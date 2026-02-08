/**
 * Authentication UI Component
 * Beautiful login modal with multiple authentication options
 */

class AuthUI {
    constructor() {
        this.createModal();
        this.setupEventListeners();
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <style>
                .auth-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10001;
                    backdrop-filter: blur(10px);
                    animation: fadeIn 0.3s ease-out;
                }
                
                .auth-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 450px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.4s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from {
                        transform: translate(-50%, -45%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, -50%);
                        opacity: 1;
                    }
                }
                
                .auth-header {
                    text-align: center;
                    color: #fff;
                    margin-bottom: 30px;
                }
                
                .auth-header h2 {
                    margin: 0 0 10px 0;
                    font-size: 32px;
                }
                
                .auth-header p {
                    margin: 0;
                    opacity: 0.9;
                }
                
                .auth-methods {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .auth-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 15px 20px;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .auth-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
                }
                
                .auth-button-google {
                    background: #fff;
                    color: #333;
                }
                
                .auth-button-apple {
                    background: #000;
                    color: #fff;
                }
                
                .auth-button-wallet {
                    background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
                    color: #fff;
                    position: relative;
                    overflow: hidden;
                    border: 2px solid #FFD700;
                    font-size: 18px !important;
                    padding: 18px 24px !important;
                }
                
                .auth-button-wallet::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,215,0,0.3), transparent);
                    animation: shimmer 3s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                }
                
                .auth-button-wallet:hover {
                    background: linear-gradient(135deg, #9b59b6 0%, #a569bd 100%);
                    border-color: #FFD700;
                    box-shadow: 0 0 20px rgba(255,215,0,0.5);
                }
                
                .recommended-badge {
                    display: inline-block;
                    background: rgba(255,215,0,0.3);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    margin-left: 8px;
                    color: #FFD700;
                    font-weight: bold;
                }
                
                .auth-button-guest {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                }
                
                .auth-divider {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 20px 0;
                    color: #fff;
                    opacity: 0.7;
                }
                
                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.3);
                }
                
                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: #fff;
                }
                
                .user-avatar {
                    font-size: 48px;
                }
                
                .user-info {
                    flex: 1;
                }
                
                .user-name {
                    font-size: 20px;
                    font-weight: bold;
                    margin: 0 0 5px 0;
                }
                
                .user-tokens {
                    font-size: 16px;
                    opacity: 0.9;
                }
                
                .user-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .close-button {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: #fff;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .close-button:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: rotate(90deg);
                }
                
                .auth-icon {
                    font-size: 24px;
                }
            </style>
            
            <div class="auth-container">
                <button class="close-button" onclick="window.authUI.hide()">×</button>
                <div id="authContent"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
    }
    
    // Helper to normalize user data from backend
    normalizeUser(user) {
        if (!user) return null;
        
        // Create normalized user object with consistent property names
        const normalized = {
            id: user.id,
            username: user.username,
            name: user.displayName || user.username,
            email: user.email,
            tokens: user.tokens || 0,
            isGuest: user.isGuest || false
        };
        
        // Handle avatar - convert from backend format to emoji/string
        if (user.profile && user.profile.avatar) {
            const avatar = user.profile.avatar;
            if (avatar.url) {
                // URL avatar - use emoji representation for now
                normalized.avatar = '👤';
            } else if (avatar.icon) {
                // Icon emoji from wallet auth
                normalized.avatar = avatar.icon;
            } else if (avatar.initial) {
                // Initial-based avatar - use the initial as emoji-style
                normalized.avatar = avatar.initial;
            } else {
                normalized.avatar = '👤';
            }
        } else if (user.avatar) {
            // Already in simple format
            normalized.avatar = user.avatar;
        } else {
            normalized.avatar = '👤';
        }
        
        return normalized;
    }
    
    setupEventListeners() {
        // Listen to unified auth state changes
        if (window.unifiedAuth) {
            window.unifiedAuth.onAuthStateChanged((user) => {
                const normalizedUser = this.normalizeUser(user);
                this.updateUI(normalizedUser);
            });
        }
    }
    
    show() {
        const user = window.unifiedAuth?.getUser();
        const normalizedUser = this.normalizeUser(user);
        this.updateUI(normalizedUser);
        this.modal.style.display = 'block';
    }
    
    hide() {
        this.modal.style.display = 'none';
    }
    
    updateUI(user) {
        const content = this.modal.querySelector('#authContent');
        
        if (user) {
            content.innerHTML = this.getUserProfileHTML(user);
        } else {
            content.innerHTML = this.getLoginHTML();
        }
    }
    
    getLoginHTML() {
        return `
            <div class="auth-header">
                <h2>🎮 Welcome!</h2>
                <p>Sign in to save your progress and compete on leaderboards</p>
            </div>
            
            <div class="auth-methods">
                <button class="auth-button auth-button-wallet" onclick="window.authUI.showWalletOptions()">
                    <span class="auth-icon">💎</span>
                    <span>Connect Wallet (XRP/SOL/ETH)</span>
                    <span class="recommended-badge">✨ RECOMMENDED</span>
                </button>
                
                <div class="auth-divider">or</div>
                
                <button class="auth-button auth-button-wallet" onclick="window.authUI.showEmailLogin()">
                    <span class="auth-icon">✉️</span>
                    <span>Email/Password Login</span>
                </button>
                
                <div class="auth-divider">or</div>
                
                <button class="auth-button auth-button-guest" onclick="window.authUI.loginAsGuest()">
                    <span class="auth-icon">👤</span>
                    <span>Continue as Guest</span>
                </button>
            </div>
        `;
    }
    
    getUserProfileHTML(user) {
        return `
            <div class="auth-header">
                <h2>👋 Hello, ${user.name}!</h2>
            </div>
            
            <div class="user-profile">
                <div class="user-avatar">${user.avatar}</div>
                <div class="user-info">
                    <h3 class="user-name">${user.name}</h3>
                    <div class="user-tokens">🪙 ${user.tokens || 0} Tokens</div>
                    ${user.email ? `<div style="font-size: 12px; opacity: 0.7;">${user.email}</div>` : ''}
                </div>
            </div>
            
            <div class="user-actions">
                <button class="auth-button auth-button-google" onclick="window.leaderboardUI.show('stats')">
                    📊 View My Stats
                </button>
                <button class="auth-button auth-button-wallet" onclick="window.authUI.openWallet()">
                    💰 Manage Tokens
                </button>
                <button class="auth-button auth-button-guest" onclick="window.authUI.logout()">
                    🚪 Sign Out
                </button>
            </div>
        `;
    }
    
    
    showLoginOptions() {
        this.show();
    }
    
    showWalletOptions() {
        this.loginWithWallet();
    }
    
    async loginWithWallet() {
        try {
            // Ensure wallet module is loaded
            if (!window.multiChainWallet) {
                throw new Error('Wallet module not ready. Please refresh the page.');
            }

            // Show wallet selection UI
            const content = this.modal.querySelector('#authContent');
            content.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h2 style="margin-bottom: 24px;">🔐 Connect Wallet</h2>
                    <p style="color: #888; margin-bottom: 32px;">
                        Choose your preferred blockchain wallet
                    </p>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px; max-width: 400px; margin: 0 auto;">
                        <button class="auth-button" onclick="window.authUI.connectWallet('xrp')" 
                                style="background: linear-gradient(135deg, #23292F 0%, #1A1F24 100%); border: 2px solid #888;">
                            💎 XUMM (XRP Ledger)
                        </button>
                        
                        <button class="auth-button" onclick="window.authUI.connectWallet('crossmark')" 
                                style="background: linear-gradient(135deg, #2A2F35 0%, #1F2428 100%); border: 2px solid #888;">
                            💠 Crossmark (XRP)
                        </button>
                        
                        <button class="auth-button" onclick="window.authUI.connectWallet('solana')" 
                                style="background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);">
                            👻 Phantom (Solana)
                        </button>
                        
                        <button class="auth-button" onclick="window.authUI.connectWallet('ethereum')" 
                                style="background: linear-gradient(135deg, #627EEA 0%, #5270E8 100%);">
                            🦊 MetaMask (Ethereum)
                        </button>
                        
                        <button class="auth-button" onclick="window.authUI.connectWallet('walletconnect')" 
                                style="background: linear-gradient(135deg, #3B99FC 0%, #2980E8 100%);">
                            📱 WalletConnect (Mobile)
                        </button>
                        
                        <button class="auth-button" onclick="window.authUI.connectWallet('auto')" 
                                style="background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%); margin-top: 16px;">
                            ✨ Auto-Detect Wallet
                        </button>
                        
                        <button onclick="window.authUI.showLoginOptions()" 
                                style="background: none; border: none; color: #888; margin-top: 16px; cursor: pointer;">
                            ← Back
                        </button>
                    </div>
                    
                    <div style="margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <p style="color: #888; font-size: 14px; margin: 0;">
                            🌐 Part of <strong>AtomicFizz Ecosystem</strong><br>
                            <a href="https://atomicfizzcaps.xyz" target="_blank" style="color: #4CAF50;">atomicfizzcaps.xyz</a>
                        </p>
                    </div>
                </div>
            `;
            
            this.show();
        } catch (error) {
            console.error('Wallet UI error:', error);
            alert('Error showing wallet options: ' + error.message);
        }
    }
    
    async connectWallet(chain) {
        try {
            const content = this.modal.querySelector('#authContent');
            content.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div class="auth-spinner"></div>
                    <p style="color: #888; margin-top: 20px;">
                        Connecting to your ${chain === 'auto' ? 'wallet' : chain.toUpperCase() + ' wallet'}...<br>
                        <small>Please approve the connection request</small>
                    </p>
                </div>
            `;

            const result = await window.unifiedAuth.loginWithWallet(chain);
            
            if (result.success) {
                this.hide();
                
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 16px 24px; border-radius: 8px; z-index: 10001; animation: slideIn 0.3s ease-out;';
                successMsg.innerHTML = `
                    ✅ Connected!<br>
                    <small>${result.wallet.wallet} (${result.wallet.chain})</small>
                `;
                document.body.appendChild(successMsg);
                
                setTimeout(() => {
                    successMsg.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => successMsg.remove(), 300);
                }, 3000);
            } else {
                throw new Error(result.error || 'Connection failed');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            
            const content = this.modal.querySelector('#authContent');
            content.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h2 style="margin-bottom: 16px;">❌ Connection Failed</h2>
                    <p style="color: #ff5252; margin-bottom: 24px;">
                        ${error.message}
                    </p>
                    <button class="auth-button" onclick="window.authUI.loginWithWallet()">
                        Try Again
                    </button>
                    <button onclick="window.authUI.showLoginOptions()" 
                            style="background: none; border: none; color: #888; margin-top: 16px; cursor: pointer;">
                        ← Back
                    </button>
                </div>
            `;
        }
    }
    
    showEmailLogin() {
        const content = this.modal.querySelector('#authContent');
        content.innerHTML = `
            <div class="auth-header">
                <h2>✉️ Email Login</h2>
                <p>Sign in or create a new account</p>
            </div>
            
            <form id="emailLoginForm" class="auth-methods" style="gap: 10px;">
                <input type="text" id="auth-username" placeholder="Username" 
                    style="padding: 15px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.3); 
                    background: rgba(255,255,255,0.1); color: #fff; font-size: 16px;">
                <input type="email" id="auth-email" placeholder="Email (for registration)" 
                    style="padding: 15px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.3); 
                    background: rgba(255,255,255,0.1); color: #fff; font-size: 16px;">
                <input type="password" id="auth-password" placeholder="Password" 
                    style="padding: 15px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.3); 
                    background: rgba(255,255,255,0.1); color: #fff; font-size: 16px;">
                
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button type="button" class="auth-button auth-button-google" style="flex: 1;" 
                        onclick="window.authUI.handleEmailLogin()">
                        🔑 Login
                    </button>
                    <button type="button" class="auth-button auth-button-wallet" style="flex: 1;" 
                        onclick="window.authUI.handleEmailRegister()">
                        ✨ Register
                    </button>
                </div>
                
                <button type="button" class="auth-button auth-button-guest" onclick="window.authUI.show()">
                    ← Back
                </button>
            </form>
            
            <div id="auth-error" style="color: #ff6b6b; text-align: center; margin-top: 10px; display: none;"></div>
        `;
    }
    
    async handleEmailLogin() {
        const username = document.getElementById('auth-username').value;
        const password = document.getElementById('auth-password').value;
        const errorEl = document.getElementById('auth-error');
        
        if (!username || !password) {
            errorEl.textContent = 'Please enter username and password';
            errorEl.style.display = 'block';
            return;
        }
        
        const result = await window.unifiedAuth.login(username, password);
        if (result.success) {
            this.hide();
        } else {
            errorEl.textContent = result.error || 'Login failed';
            errorEl.style.display = 'block';
        }
    }
    
    async handleEmailRegister() {
        const username = document.getElementById('auth-username').value;
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const errorEl = document.getElementById('auth-error');
        
        if (!username || !email || !password) {
            errorEl.textContent = 'Please fill all fields for registration';
            errorEl.style.display = 'block';
            return;
        }
        
        const result = await window.unifiedAuth.register(username, email, password);
        if (result.success) {
            this.hide();
        } else {
            errorEl.textContent = result.error || 'Registration failed';
            errorEl.style.display = 'block';
        }
    }
    
    async loginAsGuest() {
        try {
            await window.unifiedAuth.continueAsGuest();
            this.hide();
        } catch (error) {
            console.error('⚠️ Guest login failed:', error.message);
            alert('Guest login failed. Please try again.');
        }
    }
    
    async logout() {
        if (confirm('Are you sure you want to sign out?')) {
            await window.unifiedAuth.logout();
            this.hide();
        }
    }
    
    openWallet() {
        window.open('https://atomicfizzcaps.xyz/wallet', '_blank');
    }
}

// Initialize auth UI
window.authUI = new AuthUI();

// Create floating user badge
function createUserBadge() {
    const badge = document.createElement('div');
    badge.id = 'userBadge';
    badge.style.cssText = `
        position: fixed;
        top: 70px;
        right: 10px;
        z-index: 9999;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    badge.onclick = () => window.authUI.show();
    document.body.appendChild(badge);
    
    // Update badge on auth change
    if (window.unifiedAuth) {
        window.unifiedAuth.onAuthStateChanged((user) => {
            updateUserBadge(user);
        });
    }
    
    // Initial update
    updateUserBadge(window.unifiedAuth?.getUser());
}

function updateUserBadge(user) {
    const badge = document.getElementById('userBadge');
    if (!badge) return;
    
    // Normalize user data
    const normalizedUser = window.authUI?.normalizeUser(user);
    
    if (normalizedUser) {
        badge.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 10px 20px;
                border-radius: 25px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fff;
            ">
                <span style="font-size: 20px;">${normalizedUser.avatar}</span>
                <div>
                    <div style="font-weight: bold; font-size: 14px;">${normalizedUser.name}</div>
                    <div style="font-size: 11px; opacity: 0.9;">🪙 ${normalizedUser.tokens || 0}</div>
                </div>
            </div>
        `;
    } else {
        badge.innerHTML = `
            <button style="
                background: rgba(102, 126, 234, 0.2);
                backdrop-filter: blur(10px);
                border: 2px solid #667eea;
                color: #667eea;
                padding: 10px 20px;
                border-radius: 25px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(102, 126, 234, 0.3)'" 
               onmouseout="this.style.background='rgba(102, 126, 234, 0.2)'">
                🔑 Sign In
            </button>
        `;
    }
}

// Auto-create user badge on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUserBadge);
} else {
    createUserBadge();
}

// Keyboard shortcut to open auth
document.addEventListener('keydown', (e) => {
    if (e.key === 'A' && e.shiftKey) {
        window.authUI.show();
    }
});
