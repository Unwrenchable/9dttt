/**
 * Authentication Module
 * Handles user registration, login, JWT tokens, and social features
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const storage = require('./storage');

// Lazy-load monetization to avoid circular dependency
let monetization = null;
const getMonetization = () => {
    if (!monetization) {
        monetization = require('./monetization');
    }
    return monetization;
};

class Auth {
    // Register a new user
    async register(username, email, password) {
        if (!username || !email || !password) {
            return { success: false, error: 'All fields are required' };
        }

        if (username.length < 3 || username.length > 20) {
            return { success: false, error: 'Username must be 3-20 characters' };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { success: false, error: 'Invalid email address' };
        }

        // Block reserved wallet email patterns
        if (email.toLowerCase().includes('@wallet.reserved.9dttt.internal')) {
            return { success: false, error: 'Invalid email address - reserved domain' };
        }

        if (password.length < 8) {
            return { success: false, error: 'Password must be at least 8 characters' };
        }

        const existingUser = await storage.getUser(username);
        if (existingUser) {
            return { success: false, error: 'Username already taken' };
        }

        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
            return { success: false, error: 'Email already registered' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            id: uuidv4(),
            username,
            displayName: username,
            email: email.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            stats: {
                wins: 0,
                losses: 0,
                draws: 0,
                gamesPlayed: 0,
                winStreak: 0,
                bestWinStreak: 0
            },
            profile: {
                avatar: this.generateAvatar(username),
                bio: '',
                location: '',
                joinedAt: new Date().toISOString()
            },
            social: {
                twitter: null,
                discord: null,
                twitch: null,
                youtube: null
            },
            settings: {
                notifications: true,
                publicProfile: true,
                showOnlineStatus: true
            }
        };

        await storage.setUser(username, user);
        await storage.updateLeaderboard(username, user.stats);

        // Grant 60 minutes of ad-free time for account creation
        const bonusResult = await getMonetization().grantAdFreeTime(username, 60, 'account_creation');

        const token = this.generateToken(user);

        return {
            success: true,
            user: this.sanitizeUser(user),
            token,
            bonus: bonusResult.success ? {
                type: 'account_creation',
                minutesGranted: 60,
                description: '🎉 Welcome bonus: 60 minutes of ad-free gaming!'
            } : null
        };
    }

    // Login user
    async login(usernameOrEmail, password) {
        if (!usernameOrEmail || !password) {
            return { success: false, error: 'Username/email and password are required' };
        }

        let user = await storage.getUser(usernameOrEmail);
        if (!user) {
            user = await storage.getUserByEmail(usernameOrEmail);
        }

        if (!user) {
            return { success: false, error: 'Invalid credentials' };
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return { success: false, error: 'Invalid credentials' };
        }

        user.lastLoginAt = new Date().toISOString();
        await storage.setUser(user.username, user);

        const token = this.generateToken(user);

        return {
            success: true,
            user: this.sanitizeUser(user),
            token
        };
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            // Explicitly restrict to HS256 to prevent algorithm-confusion attacks
            // (e.g. alg:"none" bypass or RS256/HS256 confusion).
            const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
            return { valid: true, user: decoded };
        } catch (error) {
            return { valid: false, error: 'Invalid or expired token' };
        }
    }

    // Generate JWT token
    generateToken(user) {
        return jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN, algorithm: 'HS256' }
        );
    }

    // Get user profile
    async getProfile(username) {
        const user = await storage.getUser(username);
        if (!user) return null;
        
        const followers = await storage.getFollowers(username);
        const following = await storage.getFollowing(username);
        const rank = await storage.getPlayerRank(username);
        const isOnline = await storage.isPlayerOnline(username);

        return {
            ...this.sanitizeUser(user),
            followersCount: followers.length,
            followingCount: following.length,
            rank,
            isOnline
        };
    }

    // Update user profile
    async updateProfile(username, updates) {
        const user = await storage.getUser(username);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Profile updates
        if (updates.bio !== undefined) user.profile.bio = updates.bio.slice(0, 200).replace(/[<>]/g, '');
        if (updates.location !== undefined) user.profile.location = updates.location.slice(0, 50).replace(/[<>]/g, '');
        if (updates.displayName !== undefined) user.displayName = updates.displayName.slice(0, 30).replace(/[<>]/g, '');
        if (updates.avatar !== undefined) user.profile.avatar = updates.avatar;

        // Social links
        if (updates.twitter !== undefined) user.social.twitter = this.sanitizeSocialLink(updates.twitter);
        if (updates.discord !== undefined) user.social.discord = updates.discord?.slice(0, 50);
        if (updates.twitch !== undefined) user.social.twitch = this.sanitizeSocialLink(updates.twitch);
        if (updates.youtube !== undefined) user.social.youtube = this.sanitizeSocialLink(updates.youtube);

        // Settings
        if (updates.notifications !== undefined) user.settings.notifications = !!updates.notifications;
        if (updates.publicProfile !== undefined) user.settings.publicProfile = !!updates.publicProfile;
        if (updates.showOnlineStatus !== undefined) user.settings.showOnlineStatus = !!updates.showOnlineStatus;

        await storage.setUser(username, user);
        return { success: true, user: this.sanitizeUser(user) };
    }

    // Follow a user
    async followUser(followerUsername, targetUsername) {
        if (followerUsername === targetUsername) {
            return { success: false, error: "You can't follow yourself" };
        }

        const targetUser = await storage.getUser(targetUsername);
        if (!targetUser) {
            return { success: false, error: 'User not found' };
        }

        const isAlreadyFollowing = await storage.isFollowing(followerUsername, targetUsername);
        if (isAlreadyFollowing) {
            return { success: false, error: 'Already following this user' };
        }

        await storage.followUser(followerUsername, targetUsername);
        return { success: true };
    }

    // Unfollow a user
    async unfollowUser(followerUsername, targetUsername) {
        await storage.unfollowUser(followerUsername, targetUsername);
        return { success: true };
    }

    // Get following list with online status
    async getFollowingWithStatus(username) {
        const following = await storage.getFollowing(username);
        const result = [];

        for (const followedUsername of following) {
            const user = await storage.getUser(followedUsername);
            if (user) {
                const isOnline = await storage.isPlayerOnline(followedUsername);
                result.push({
                    username: user.username,
                    displayName: user.displayName,
                    avatar: user.profile.avatar,
                    isOnline,
                    stats: user.stats
                });
            }
        }

        return result;
    }

    // Get followers list
    async getFollowersList(username) {
        const followers = await storage.getFollowers(username);
        const result = [];

        for (const followerUsername of followers) {
            const user = await storage.getUser(followerUsername);
            if (user) {
                const isOnline = await storage.isPlayerOnline(followerUsername);
                result.push({
                    username: user.username,
                    displayName: user.displayName,
                    avatar: user.profile.avatar,
                    isOnline
                });
            }
        }

        return result;
    }

    // Search users
    async searchUsers(query, currentUser) {
        const users = await storage.searchUsers(query);
        const result = [];

        for (const user of users) {
            if (user.settings.publicProfile || user.username === currentUser) {
                const isOnline = await storage.isPlayerOnline(user.username);
                const isFollowing = currentUser ? await storage.isFollowing(currentUser, user.username) : false;
                result.push({
                    username: user.username,
                    displayName: user.displayName,
                    avatar: user.profile.avatar,
                    bio: user.profile.bio,
                    stats: user.stats,
                    isOnline,
                    isFollowing
                });
            }
        }

        return result;
    }

    // Update user stats after a game
    async updateStats(username, result) {
        const user = await storage.getUser(username);
        if (!user) return;

        user.stats.gamesPlayed++;
        
        if (result === 'win') {
            user.stats.wins++;
            user.stats.winStreak++;
            if (user.stats.winStreak > user.stats.bestWinStreak) {
                user.stats.bestWinStreak = user.stats.winStreak;
            }
        } else if (result === 'loss') {
            user.stats.losses++;
            user.stats.winStreak = 0;
        } else if (result === 'draw') {
            user.stats.draws++;
        }

        await storage.setUser(username, user);
        await storage.updateLeaderboard(username, user.stats);
    }

    // Remove sensitive data from user object
    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    // Sanitize social media links
    sanitizeSocialLink(link) {
        if (!link) return null;
        // Remove any potential malicious content, keep only username/handle
        return link.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
    }

    // Generate a simple avatar based on username
    generateAvatar(username) {
        const colors = ['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#3498db'];
        const colorIndex = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return {
            color: colors[colorIndex],
            initial: username.charAt(0).toUpperCase()
        };
    }
}

module.exports = new Auth();
