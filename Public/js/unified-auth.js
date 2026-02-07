/**
 * Unified Authentication System
 * Single auth solution combining all login methods:
 * - Email/Password (stored in browser)
 * - Browser Credential Management API (auto sign-in)
 * - Optional Firebase (Google/Apple) if configured
 * - Seamless guest mode fallback
 */

class UnifiedAuth {
    constructor() {
        this.user = null;
        this.token = null;
        this.listeners = new Set();
        this.isInitialized = false;
        this.hasFirebase = false;
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
                this.hasFirebase = typeof firebase !== 'undefined';
                
                // Load existing token
                this.token = localStorage.getItem('auth_token');
                
                if (this.token) {
                    // Verify existing session
                    const result = await this.verifyToken();
                    if (result.valid) {
                        this.user = result.user;
                        this.notifyListeners();
                        this.isInitialized = true;
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
                
                // Try Firebase session restore
                if (this.hasFirebase) {
                    await this.initFirebaseAuth();
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
     * Initialize Firebase authentication
     */
    async initFirebaseAuth() {
        try {
            const response = await fetch('/api/auth/firebase/status');
            const data = await response.json();
            
            if (!data.available || !data.config) {
                console.log('Firebase not configured');
                return;
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(data.config);
            }
            
            return new Promise((resolve) => {
                firebase.auth().onAuthStateChanged(async (firebaseUser) => {
                    if (firebaseUser && !this.user) {
                        try {
                            const idToken = await firebaseUser.getIdToken();
                            const result = await this.loginWithFirebase(idToken);
                            if (result.success) {
                                this.user = result.user;
                                this.token = result.token;
                                localStorage.setItem('auth_token', this.token);
                                localStorage.setItem('auth_method', 'firebase');
                                this.notifyListeners();
                            }
                        } catch (error) {
                            console.error('⚠️ Firebase login failed:', error.message);
                        }
                    }
                    resolve();
                });
            });
        } catch (error) {
            console.error('⚠️ Firebase initialization failed:', error.message);
        }
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
     * Login with Firebase token
     */
    async loginWithFirebase(idToken) {
        try {
            const response = await fetch('/api/auth/firebase/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });
            
            return await response.json();
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
        // Sign out from Firebase if available
        if (this.hasFirebase && firebase.auth) {
            try {
                await firebase.auth().signOut();
            } catch (error) {
                // Silent fail - Firebase signout is optional
            }
        }
        
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
}
