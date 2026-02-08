/**
 * Unified Authentication System
 * Single auth solution combining all login methods:
 * - Email/Password (stored in browser)
 * - Browser Credential Management API (auto sign-in)
 * - Web3 Wallet Authentication (MetaMask, Phantom, XUMM)
 * - Seamless guest mode fallback
 */

class UnifiedAuth {
    constructor() {
        this.user = null;
        this.token = null;
        this.listeners = new Set();
        this.isInitialized = false;
        this.hasBrowserAuth = false;
        this.initPromise = null;
    }

    /**
     * Initialize authentication system
     */
    async init() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            try {
                // Check browser capabilities
                this.hasBrowserAuth = !!window.PasswordCredential;
                
                // Wait for wallet to initialize
                if (window.multiChainWallet && !window.multiChainWallet.isInitialized) {
                    await window.multiChainWallet.init();
                }
                
                // Load existing token
                this.token = localStorage.getItem('auth_token');
                const authMethod = localStorage.getItem('auth_method');
                
                if (this.token) {
                    // Verify existing session
                    const result = await this.verifyToken();
                    if (result.valid) {
                        this.user = result.user;
                        this.notifyListeners();
                        this.isInitialized = true;
                        
                        // If wallet auth, ensure wallet is still connected
                        if (authMethod === 'wallet' && window.multiChainWallet) {
                            const walletStatus = window.multiChainWallet.getStatus();
                            if (!walletStatus.connected) {
                                console.warn('⚠️ Wallet disconnected, clearing auth');
                                this.clearSession();
                            }
                        }
                        
                        return true;
                    } else {
                        this.clearSession();
                    }
                }
                
                // Try auto sign-in with browser credentials
                if (this.hasBrowserAuth) {
                    const autoSignedIn = await this.attemptAutoSignIn();
                    if (autoSignedIn) {
                        this.isInitialized = true;
                        return true;
                    }
                }
                
                this.isInitialized = true;
                return false;
            } catch (error) {
                console.error('⚠️ Auth initialization failed:', error.message);
                this.isInitialized = true;
                return false;
            }
        })();
        
        return this.initPromise;
    }

    /**
     * Attempt auto sign-in with stored credentials
     */
    async attemptAutoSignIn() {
        if (!this.hasBrowserAuth) return false;
        
        try {
            const credential = await navigator.credentials.get({
                password: true,
                mediation: 'silent'
            });

            if (credential && credential.type === 'password') {
                const result = await this.login(credential.id, credential.password, false);
                return result.success;
            }
        } catch (error) {
            // Silent fail - auto sign-in is optional
        }
        return false;
    }

    /**
     * Register new user
     */
    async register(username, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.token = result.token;
                this.user = result.user;
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('auth_method', 'email');
                
                // Store in browser for auto sign-in
                if (this.hasBrowserAuth) {
                    await this.storeCredentials(username, password);
                }
                
                this.notifyListeners();
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Login with username/password
     */
    async login(username, password, storeCredentials = true) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.token = result.token;
                this.user = result.user;
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('auth_method', 'email');
                
                // Store in browser for auto sign-in
                if (this.hasBrowserAuth && storeCredentials) {
                    await this.storeCredentials(username, password);
                }
                
                this.notifyListeners();
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Continue as guest
     */
    async continueAsGuest() {
        const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        this.user = {
            id: guestId,
            username: 'Guest',
            displayName: 'Guest Player',
            isGuest: true,
            profile: {
                avatar: {
                    type: 'initial',
                    initial: 'G',
                    color: '#888888'
                }
            }
        };
        
        localStorage.setItem('guest_id', guestId);
        this.notifyListeners();
        return { success: true };
    }

    /**
     * Store credentials in browser
     */
    async storeCredentials(username, password) {
        if (!this.hasBrowserAuth) return;
        
        try {
            const credential = new PasswordCredential({
                id: username,
                password: password,
                name: username
            });
            
            await navigator.credentials.store(credential);
        } catch (error) {
            // Silent fail - credential storage is optional
        }
    }
    /**
     * Login with Web3 Wallet (Multi-Chain: Ethereum, Solana, XRP)
     */
    async loginWithWallet(chain = 'auto') {
        try {
            // Ensure multi-chain wallet is loaded
            if (!window.multiChainWallet) {
                throw new Error('Wallet module not loaded. Please refresh the page.');
            }

            let walletResult;

            // Connect to specified chain or auto-detect
            switch (chain) {
                case 'auto':
                    walletResult = await window.multiChainWallet.autoConnect();
                    break;
                case 'ethereum':
                    walletResult = await window.multiChainWallet.connectEthereum();
                    break;
                case 'walletconnect':
                    walletResult = await window.multiChainWallet.connectViaWalletConnect();
                    break;
                case 'solana':
                    walletResult = await window.multiChainWallet.connectSolana();
                    break;
                case 'xrp':
                case 'xumm':
                    walletResult = await window.multiChainWallet.connectXUMM();
                    break;
                case 'crossmark':
                    walletResult = await window.multiChainWallet.connectCrossmark();
                    break;
                default:
                    throw new Error(`Unsupported chain: ${chain}`);
            }

            if (!walletResult.success) {
                throw new Error('Wallet connection failed');
            }

            // Sign message for authentication
            const nonce = Math.random().toString(36).substr(2);
            const message = `Sign in to 9DTTT\nNonce: ${nonce}\nAddress: ${walletResult.address}`;
            
            const signResult = await window.multiChainWallet.signMessage(message);

            // Authenticate with backend
            const response = await fetch('/api/auth/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chain: walletResult.chain,
                    address: walletResult.address,
                    signature: signResult.signature,
                    message: message,
                    wallet: walletResult.wallet
                })
            });

            // Check for network or server errors
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error (${response.status}): ${errorText}`);
            }

            const authResult = await response.json();

            if (!authResult.success) {
                throw new Error(authResult.error || 'Wallet authentication failed');
            }

            // Store authenticated user and token
            this.user = authResult.user;
            this.token = authResult.token;
            
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('auth_method', 'wallet');
            localStorage.setItem('wallet_chain', walletResult.chain);
            localStorage.setItem('wallet_address', walletResult.address);
            
            this.notifyListeners();
            
            return { success: true, user: this.user, wallet: walletResult };
        } catch (error) {
            console.error('Wallet login error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnectWallet() {
        if (window.multiChainWallet) {
            await window.multiChainWallet.disconnect();
        }
        
        localStorage.removeItem('wallet_chain');
        localStorage.removeItem('wallet_address');
        
        if (this.user && this.user.wallet) {
            await this.logout();
        }
    }

    /**
     * Get wallet balance
     */
    async getWalletBalance() {
        if (!window.multiChainWallet || !window.multiChainWallet.address) {
            return null;
        }
        
        try {
            return await window.multiChainWallet.getBalance();
        } catch (error) {
            console.error('Failed to get wallet balance:', error);
            return null;
        }
    }
    /**
     * Verify existing token
     */
    async verifyToken() {
        if (!this.token) return { valid: false };
        
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            return { valid: false };
        }
    }

    /**
     * Logout
     */
    async logout() {
        this.clearSession();
        this.notifyListeners();
    }

    /**
     * Clear session data
     */
    clearSession() {
        this.user = null;
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_method');
        localStorage.removeItem('guest_id');
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!this.user;
    }

    /**
     * Check if user is guest
     */
    isGuest() {
        return this.user?.isGuest === true;
    }

    /**
     * Add auth state change listener
     */
    onAuthStateChanged(callback) {
        this.listeners.add(callback);
        // Immediately call with current state
        if (this.isInitialized) {
            callback(this.user);
        }
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of auth state change
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.user);
            } catch (error) {
                console.error('⚠️ Auth listener error:', error.message);
            }
        });
    }

    /**
     * Get auth header for API requests
     */
    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        if (!this.user || this.isGuest()) {
            return { success: false, error: 'Must be logged in' };
        }
        
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(updates)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.user = { ...this.user, ...result.user };
                this.notifyListeners();
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create and export global instance
if (typeof window !== 'undefined') {
    window.unifiedAuth = new UnifiedAuth();
    
    // Auto-initialize auth on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.unifiedAuth.init().catch(err => {
                console.error('Auth init failed:', err);
            });
        });
    } else {
        window.unifiedAuth.init().catch(err => {
            console.error('Auth init failed:', err);
        });
    }
    
    // Legacy compatibility - map to old authClient API
    window.authClient = {
        get user() { return window.unifiedAuth.getUser(); },
        get token() { return window.unifiedAuth.token; },
        init: () => window.unifiedAuth.init(),
        register: (...args) => window.unifiedAuth.register(...args),
        login: (...args) => window.unifiedAuth.login(...args),
        logout: () => window.unifiedAuth.logout(),
        isLoggedIn: () => window.unifiedAuth.isLoggedIn(),
        onAuthStateChanged: (...args) => window.unifiedAuth.onAuthStateChanged(...args),
        addListener: (...args) => window.unifiedAuth.onAuthStateChanged(...args),
        verifyToken: () => window.unifiedAuth.verifyToken(),
        updateProfile: (...args) => window.unifiedAuth.updateProfile(...args),
        getAuthHeader: () => window.unifiedAuth.getAuthHeader()
    };
    
    // Legacy compatibility - map to old universalAuth API
    window.universalAuth = {
        get user() { return window.unifiedAuth.getUser(); },
        getUser: () => window.unifiedAuth.getUser(),
        init: () => window.unifiedAuth.init(),
        saveUser: async (user) => {
            // Legacy method - update profile
            return window.unifiedAuth.updateProfile(user);
        }
    };
}
