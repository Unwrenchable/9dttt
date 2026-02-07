/**
 * Firebase Authentication Module
 * Handles social login via Firebase (Google, Apple, etc.)
 * FREE tier supports: 50,000 monthly active users
 * 
 * This module verifies Firebase ID tokens on the server side
 * and manages user accounts in our system.
 */

const { v4: uuidv4 } = require('uuid');
const https = require('https');
const config = require('./config');
const storage = require('./storage');
const auth = require('./auth');

// Firebase provider display info
const FIREBASE_PROVIDERS = {
    'google.com': {
        name: 'Google',
        icon: '🔍',
        color: '#4285F4'
    },
    'apple.com': {
        name: 'Apple',
        icon: '🍎',
        color: '#000000'
    },
    'password': {
        name: 'Email',
        icon: '📧',
        color: '#4a90e2'
    }
};

class FirebaseAuth {
    constructor() {
        this.projectId = null;
    }

    /**
     * Initialize Firebase configuration
     * Returns true if Firebase is configured, false otherwise
     */
    init() {
        if (!config.FIREBASE_PROJECT_ID) {
            console.log('Firebase not configured - social login disabled');
            return false;
        }

        this.projectId = config.FIREBASE_PROJECT_ID;
        console.log('✅ Firebase initialized successfully');
        return true;
    }

    /**
     * Check if Firebase is available
     */
    isAvailable() {
        return !!this.projectId;
    }

    /**
     * Get available providers (for frontend display)
     */
    getAvailableProviders() {
        if (!this.projectId) return [];
        
        return [
            { id: 'google.com', ...FIREBASE_PROVIDERS['google.com'] },
            { id: 'apple.com', ...FIREBASE_PROVIDERS['apple.com'] }
        ];
    }

    /**
     * Verify Firebase ID token using Google's public keys
     * This is a lightweight verification without requiring firebase-admin
     */
    async verifyIdToken(idToken) {
        return new Promise((resolve, reject) => {
            // Verify token with Google's tokeninfo endpoint
            const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const tokenInfo = JSON.parse(data);
                        
                        if (tokenInfo.error) {
                            reject(new Error(tokenInfo.error_description || 'Invalid token'));
                            return;
                        }

                        // Verify the token is for our project
                        // Firebase ID tokens have 'aud' set to the project ID
                        if (this.projectId && tokenInfo.aud !== this.projectId) {
                            reject(new Error('Token not issued for this application'));
                            return;
                        }

                        resolve({
                            uid: tokenInfo.sub,
                            email: tokenInfo.email,
                            name: tokenInfo.name || tokenInfo.email?.split('@')[0],
                            picture: tokenInfo.picture,
                            email_verified: tokenInfo.email_verified === 'true',
                            provider: this.getProviderFromToken(tokenInfo)
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Determine provider from token info
     */
    getProviderFromToken(tokenInfo) {
        if (tokenInfo.iss?.includes('apple')) return 'apple.com';
        if (tokenInfo.iss?.includes('google') || tokenInfo.azp) return 'google.com';
        return 'unknown';
    }

    /**
     * Verify Firebase ID token and get/create user
     * Called from frontend after Firebase client-side auth
     */
    async verifyAndGetUser(idToken) {
        if (!this.projectId) {
            return { success: false, error: 'Firebase not configured' };
        }

        try {
            // Verify the ID token
            const decodedToken = await this.verifyIdToken(idToken);
            
            const firebaseUid = decodedToken.uid;
            const email = decodedToken.email;
            const name = decodedToken.name || 'User';
            const picture = decodedToken.picture || null;
            const provider = decodedToken.provider;

            // Normalize user info
            const userInfo = {
                firebaseUid,
                email,
                username: this.sanitizeUsername(name),
                displayName: name,
                avatar: picture,
                provider,
                verified: decodedToken.email_verified || false
            };

            // Find or create user in our system
            const result = await this.findOrCreateUser(userInfo);
            return result;
        } catch (error) {
            console.error('Firebase token verification error:', error.message);
            return { success: false, error: 'Invalid authentication token' };
        }
    }

    /**
     * Find existing user or create new one from Firebase auth
     */
    async findOrCreateUser(userInfo) {
        const { firebaseUid, email, username, displayName, avatar, provider, verified } = userInfo;

        // Check if user exists with this Firebase UID
        let user = await storage.getUserByFirebaseUid(firebaseUid);

        if (user) {
            // Update last login and provider info
            user.lastLoginAt = new Date().toISOString();
            if (!user.firebase) user.firebase = {};
            user.firebase.lastProvider = provider;
            user.firebase.lastUsed = new Date().toISOString();
            if (avatar) user.profile.avatar = { url: avatar };
            
            await storage.setUser(user.username, user);

            const token = auth.generateToken(user);
            return {
                success: true,
                user: auth.sanitizeUser(user),
                token,
                isNewUser: false
            };
        }

        // Check if email already exists (link Firebase to existing account)
        if (email) {
            user = await storage.getUserByEmail(email);
            if (user) {
                // Link Firebase to existing account
                user.firebaseUid = firebaseUid;
                user.isVerified = verified || user.isVerified;
                if (!user.firebase) user.firebase = {};
                user.firebase.uid = firebaseUid;
                user.firebase.provider = provider;
                user.firebase.connectedAt = new Date().toISOString();
                user.firebase.lastUsed = new Date().toISOString();
                
                await storage.setUser(user.username, user);
                await storage.setFirebaseMapping(firebaseUid, user.username);

                const token = auth.generateToken(user);
                return {
                    success: true,
                    user: auth.sanitizeUser(user),
                    token,
                    isNewUser: false,
                    linkedAccount: true
                };
            }
        }

        // Create new user with unique username
        let finalUsername = username;
        let existingUser = await storage.getUser(finalUsername);
        let counter = 1;
        const baseUsername = finalUsername;
        const maxAttempts = 100;
        while (existingUser && counter <= maxAttempts) {
            finalUsername = `${baseUsername}${counter}`;
            existingUser = await storage.getUser(finalUsername);
            counter++;
        }
        if (existingUser) {
            finalUsername = `user_${uuidv4().slice(0, 12)}`;
        }

        const newUser = {
            id: uuidv4(),
            username: finalUsername,
            displayName: displayName || finalUsername,
            email: email?.toLowerCase() || null,
            password: null,
            firebaseUid,
            createdAt: new Date().toISOString(),
            isVerified: verified,
            authMethod: 'firebase',
            firebase: {
                uid: firebaseUid,
                provider,
                connectedAt: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            },
            stats: {
                wins: 0,
                losses: 0,
                draws: 0,
                gamesPlayed: 0,
                winStreak: 0,
                bestWinStreak: 0
            },
            profile: {
                avatar: avatar ? { url: avatar } : auth.generateAvatar(finalUsername),
                bio: '',
                location: '',
                joinedAt: new Date().toISOString()
            },
            social: {
                google: provider === 'google.com' ? displayName : null,
                twitter: null,
                discord: null,
                twitch: null
            },
            settings: {
                notifications: true,
                publicProfile: true,
                showOnlineStatus: true
            }
        };

        await storage.setUser(finalUsername, newUser);
        await storage.setFirebaseMapping(firebaseUid, finalUsername);
        await storage.updateLeaderboard(finalUsername, newUser.stats);

        const token = auth.generateToken(newUser);

        return {
            success: true,
            user: auth.sanitizeUser(newUser),
            token,
            isNewUser: true
        };
    }

    /**
     * Sanitize username from display name
     */
    sanitizeUsername(name) {
        if (!name) return `user_${uuidv4().slice(0, 8)}`;
        return name
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .slice(0, 20)
            .toLowerCase() || `user_${uuidv4().slice(0, 8)}`;
    }

    /**
     * Get linked Firebase provider for a user
     */
    async getLinkedProvider(username) {
        const user = await storage.getUser(username);
        if (!user || !user.firebase) {
            return null;
        }

        const providerInfo = FIREBASE_PROVIDERS[user.firebase.provider] || {
            name: 'Unknown',
            icon: '🔐',
            color: '#666666'
        };

        return {
            provider: user.firebase.provider,
            connectedAt: user.firebase.connectedAt,
            ...providerInfo
        };
    }
}

module.exports = new FirebaseAuth();
module.exports.FIREBASE_PROVIDERS = FIREBASE_PROVIDERS;

