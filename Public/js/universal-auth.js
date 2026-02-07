/**
 * Universal Authentication System
 * Uses browser-based OAuth (Google, Microsoft, Apple) + Web3 wallets
 * No Firebase needed - uses IndexedDB for local storage and your backend API
 * Cross-browser compatible with fallbacks for older browsers
 */

class UniversalAuth {
    constructor() {
        this.user = null;
        this.db = null;
        this.useLocalStorageFallback = false;
        this.apiEndpoint = 'https://atomicfizzcaps.xyz/api'; // Your tokenization backend
        this.init();
    }
    
    async init() {
        // Check browser capabilities
        this.checkBrowserSupport();
        
        // Try IndexedDB first, fallback to localStorage
        try {
            await this.initDB();
        } catch (error) {
            console.warn('IndexedDB not available, using localStorage fallback');
            this.useLocalStorageFallback = true;
        }
        
        await this.checkSession();
    }
    
    checkBrowserSupport() {
        // Log supported features
        const features = {
            indexedDB: 'indexedDB' in window,
            localStorage: 'localStorage' in window,
            credentials: 'credentials' in navigator,
            crypto: 'crypto' in window && 'subtle' in window.crypto,
            fetch: 'fetch' in window
        };
        
        console.log('Browser capabilities:', features);
        
        // Provide polyfill warnings
        if (!features.fetch) {
            console.warn('Fetch API not supported - some features may not work');
        }
        
        return features;
    }
    
    async initDB() {
        // Check if IndexedDB is available
        if (!window.indexedDB) {
            throw new Error('IndexedDB not supported');
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('9DTTT_GameDB', 1);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // User data store
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }
                
                // Scores store
                if (!db.objectStoreNames.contains('scores')) {
                    const scoreStore = db.createObjectStore('scores', { keyPath: 'id', autoIncrement: true });
                    scoreStore.createIndex('userId', 'userId', { unique: false });
                    scoreStore.createIndex('game', 'game', { unique: false });
                    scoreStore.createIndex('score', 'score', { unique: false });
                }
                
                // Achievements store
                if (!db.objectStoreNames.contains('achievements')) {
                    db.createObjectStore('achievements', { keyPath: 'id', autoIncrement: true });
                }
                
                // Tokens store (for atomicfizzcaps integration)
                if (!db.objectStoreNames.contains('tokens')) {
                    db.createObjectStore('tokens', { keyPath: 'userId' });
                }
            };
        });
    }
    
    // Browser-based OAuth Login with fallbacks
    async loginWithGoogle() {
        try {
            // Check if Google Identity Services is available
            if (window.google && window.google.accounts && window.google.accounts.id) {
                window.google.accounts.id.initialize({
                    client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual client ID
                    callback: (response) => this.handleGoogleCallback(response),
                    auto_select: false,
                    cancel_on_tap_outside: true
                });
                
                window.google.accounts.id.prompt();
            } else if (navigator.credentials && navigator.credentials.get) {
                // Fallback: Use Credential Management API (Chrome, Edge, Opera)
                try {
                    const credential = await navigator.credentials.get({
                        password: true,
                        federated: {
                            providers: ['https://accounts.google.com']
                        }
                    });
                    
                    if (credential) {
                        await this.processCredential(credential);
                    } else {
                        this.showError('Google Sign-In not available. Please use Guest mode or try another browser.');
                    }
                } catch (credError) {
                    console.warn('Credential API not supported:', credError);
                    this.showError('Google Sign-In requires a modern browser (Chrome, Edge, Opera, or Firefox 60+)');
                }
            } else {
                // Final fallback: Inform user
                this.showError('Google Sign-In is not available in this browser. Please use Guest mode or try Chrome/Edge.');
            }
        } catch (error) {
            console.error('Google login error:', error);
            this.showError('Failed to login with Google. Using Guest mode as fallback.');
            // Auto-fallback to guest mode
            await this.loginAsGuest();
        }
    }
    
    async loginWithApple() {
        try {
            // Check if Apple Sign In JS is loaded
            if (window.AppleID && window.AppleID.auth) {
                const data = await window.AppleID.auth.signIn();
                await this.handleAppleCallback(data);
            } else {
                console.warn('Apple Sign In not available');
                alert('Apple Sign In not available in this browser. Please use Google Sign-In or Guest mode.');
                // Auto-fallback to guest
                await this.loginAsGuest();
            }
        } catch (error) {
            console.error('Apple login error:', error);
            this.showError('Failed to login with Apple. Using Guest mode.');
            await this.loginAsGuest();
        }
    }
    
    async loginWithWallet() {
        try {
            // Web3 wallet login (Phantom, MetaMask, etc.)
            // Check Solana Phantom wallet first
            if (window.solana && window.solana.isPhantom) {
                const resp = await window.solana.connect();
                const publicKey = resp.publicKey.toString();
                
                await this.createUserFromWallet(publicKey, 'Solana');
            } 
            // Check Ethereum MetaMask or other Web3 providers
            else if (window.ethereum) {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                await this.createUserFromWallet(accounts[0], 'Ethereum');
            }
            // No wallet detected
            else {
                const installWallet = confirm(
                    'No Web3 wallet detected.\n\n' +
                    'Install Phantom (Solana) or MetaMask (Ethereum)?\n\n' +
                    'Click OK to learn more, or Cancel to use Guest mode.'
                );
                
                if (installWallet) {
                    window.open('https://phantom.app/', '_blank');
                } else {
                    await this.loginAsGuest();
                }
            }
        } catch (error) {
            console.error('Wallet login error:', error);
            this.showError('Failed to connect wallet. Using Guest mode.');
            await this.loginAsGuest();
        }
    }
    
    async loginAsGuest() {
        const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        this.user = {
            id: guestId,
            name: 'Guest Player',
            email: null,
            avatar: '👤',
            type: 'guest',
            tokens: 0,
            createdAt: Date.now()
        };
        
        await this.saveUser(this.user);
        this.onAuthStateChanged(this.user);
        return this.user;
    }
    
    async handleGoogleCallback(response) {
        // Decode JWT token
        const payload = this.parseJwt(response.credential);
        
        this.user = {
            id: 'google_' + payload.sub,
            name: payload.name,
            email: payload.email,
            avatar: payload.picture,
            type: 'google',
            tokens: 0,
            createdAt: Date.now()
        };
        
        await this.saveUser(this.user);
        await this.syncWithBackend(this.user);
        this.onAuthStateChanged(this.user);
    }
    
    async handleAppleCallback(data) {
        this.user = {
            id: 'apple_' + data.authorization.user,
            name: data.user?.name || 'Apple User',
            email: data.user?.email || null,
            avatar: '🍎',
            type: 'apple',
            tokens: 0,
            createdAt: Date.now()
        };
        
        await this.saveUser(this.user);
        await this.syncWithBackend(this.user);
        this.onAuthStateChanged(this.user);
    }
    
    async createUserFromWallet(address, chain) {
        this.user = {
            id: chain.toLowerCase() + '_' + address,
            name: address.substr(0, 6) + '...' + address.substr(-4),
            email: null,
            avatar: chain === 'Solana' ? '👻' : '🦊',
            walletAddress: address,
            chain: chain,
            type: 'wallet',
            tokens: 0,
            createdAt: Date.now()
        };
        
        await this.saveUser(this.user);
        await this.syncWithBackend(this.user);
        this.onAuthStateChanged(this.user);
    }
    
    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    }
    
    async saveUser(user) {
        // Use localStorage fallback if IndexedDB unavailable
        if (this.useLocalStorageFallback || !this.db) {
            try {
                localStorage.setItem('9dttt_user_' + user.id, JSON.stringify(user));
                localStorage.setItem('9dttt_userId', user.id);
                return Promise.resolve();
            } catch (error) {
                console.error('LocalStorage error:', error);
                return Promise.reject(error);
            }
        }
        
        // Use IndexedDB
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['users'], 'readwrite');
                const store = transaction.objectStore('users');
                const request = store.put(user);
                
                request.onsuccess = () => {
                    localStorage.setItem('9dttt_userId', user.id);
                    resolve();
                };
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('IndexedDB save error:', error);
                reject(error);
            }
        });
    }
    
    async getUser(userId) {
        // Use localStorage fallback if IndexedDB unavailable
        if (this.useLocalStorageFallback || !this.db) {
            try {
                const userData = localStorage.getItem('9dttt_user_' + userId);
                return userData ? JSON.parse(userData) : null;
            } catch (error) {
                console.error('LocalStorage read error:', error);
                return null;
            }
        }
        
        // Use IndexedDB
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['users'], 'readonly');
                const store = transaction.objectStore('users');
                const request = store.get(userId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('IndexedDB read error:', error);
                reject(error);
            }
        });
    }
    
    async checkSession() {
        try {
            const userId = localStorage.getItem('9dttt_userId');
            if (userId) {
                this.user = await this.getUser(userId);
                if (this.user) {
                    this.onAuthStateChanged(this.user);
                }
            }
        } catch (error) {
            console.error('Session check error:', error);
            // Clear corrupted session
            localStorage.removeItem('9dttt_userId');
        }
    }
    
    async syncWithBackend(user) {
        try {
            // Check if fetch is available
            if (!window.fetch) {
                console.warn('Fetch API not available - skipping backend sync');
                return;
            }
            
            // Sync user data with your atomicfizzcaps.xyz backend
            const response = await fetch(`${this.apiEndpoint}/users/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    walletAddress: user.walletAddress,
                    chain: user.chain,
                    type: user.type
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                // Update user with server data (tokens, achievements, etc.)
                if (data.tokens !== undefined) {
                    user.tokens = data.tokens;
                    await this.saveUser(user);
                }
            }
        } catch (error) {
            console.error('Backend sync error:', error);
            // Continue offline - sync later
        }
    }
    
    async logout() {
        if (this.user) {
            localStorage.removeItem('9dttt_userId');
            this.user = null;
            this.onAuthStateChanged(null);
        }
    }
    
    onAuthStateChanged(user) {
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user } 
        }));
    }
    
    isAuthenticated() {
        return this.user !== null;
    }
    
    getUser() {
        return this.user;
    }
    
    showError(message) {
        // You can implement a better error UI
        console.error(message);
        alert(message);
    }
}

// Initialize global auth instance
window.universalAuth = new UniversalAuth();

// Log compatibility info
console.log('🔐 Universal Auth initialized with cross-browser support');
console.log('✅ Supports: Chrome, Firefox, Safari, Edge, Opera');
console.log('✅ Fallbacks enabled for older browsers');
