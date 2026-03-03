/**
 * Storage Module
 * Handles data persistence with Redis (production) or in-memory (development)
 * Provides a unified interface for both storage backends
 */

const { createClient } = require('redis');
const config = require('./config');

class Storage {
    constructor() {
        this.redis = null;
        this.inMemory = {
            users: new Map(),
            sessions: new Map(),
            games: new Map(),
            leaderboard: new Map(),
            messages: new Map(),
            follows: new Map(),
            onlinePlayers: new Map(),
            blocks: new Map(),
            reports: new Map(),
            disciplines: new Map(),
            oauthMappings: new Map()
        };
        this.useRedis = false;
    }

    async initialize() {
        if (config.REDIS_URL) {
            try {
                this.redis = createClient({
                    url: config.REDIS_URL,
                    socket: { reconnectStrategy: false }
                });
                this.redis.on('error', (err) => {
                    console.error('Redis error:', err.message || err);
                    this.useRedis = false;
                });
                await this.redis.connect();
                this.useRedis = true;
                console.log('✅ Connected to Redis');
            } catch (error) {
                console.log('⚠️ Redis not available, using in-memory storage');
                this.useRedis = false;
                if (this.redis) {
                    this.redis.disconnect().catch(() => {});
                    this.redis = null;
                }
            }
        } else {
            console.log('📦 Using in-memory storage (set REDIS_URL for persistence)');
        }
    }

    // User operations
    async getUser(username) {
        if (this.useRedis) {
            const data = await this.redis.hGet('users', username.toLowerCase());
            return data ? JSON.parse(data) : null;
        }
        return this.inMemory.users.get(username.toLowerCase()) || null;
    }

    async setUser(username, userData) {
        const key = username.toLowerCase();
        if (this.useRedis) {
            await this.redis.hSet('users', key, JSON.stringify(userData));
        } else {
            this.inMemory.users.set(key, userData);
        }
    }

    async getUserByEmail(email) {
        if (this.useRedis) {
            const users = await this.redis.hGetAll('users');
            for (const userData of Object.values(users)) {
                const user = JSON.parse(userData);
                if (user.email === email.toLowerCase()) return user;
            }
            return null;
        }
        for (const user of this.inMemory.users.values()) {
            if (user.email === email.toLowerCase()) return user;
        }
        return null;
    }

    async searchUsers(query, limit = 20) {
        const results = [];
        const searchLower = query.toLowerCase();
        
        if (this.useRedis) {
            const users = await this.redis.hGetAll('users');
            for (const userData of Object.values(users)) {
                const user = JSON.parse(userData);
                if (user.username.toLowerCase().includes(searchLower)) {
                    results.push(user);
                    if (results.length >= limit) break;
                }
            }
        } else {
            for (const user of this.inMemory.users.values()) {
                if (user.username.toLowerCase().includes(searchLower)) {
                    results.push(user);
                    if (results.length >= limit) break;
                }
            }
        }
        return results;
    }

    // Session operations
    async setSession(sessionId, sessionData, ttl = 86400) {
        if (this.useRedis) {
            await this.redis.setEx(`session:${sessionId}`, ttl, JSON.stringify(sessionData));
        } else {
            this.inMemory.sessions.set(sessionId, {
                ...sessionData,
                expiresAt: Date.now() + (ttl * 1000)
            });
        }
    }

    async getSession(sessionId) {
        if (this.useRedis) {
            const data = await this.redis.get(`session:${sessionId}`);
            return data ? JSON.parse(data) : null;
        }
        const session = this.inMemory.sessions.get(sessionId);
        if (session && session.expiresAt > Date.now()) {
            return session;
        }
        this.inMemory.sessions.delete(sessionId);
        return null;
    }

    async deleteSession(sessionId) {
        if (this.useRedis) {
            await this.redis.del(`session:${sessionId}`);
        } else {
            this.inMemory.sessions.delete(sessionId);
        }
    }

    // Game operations
    async setGame(gameId, gameData) {
        if (this.useRedis) {
            await this.redis.hSet('games', gameId, JSON.stringify(gameData));
        } else {
            this.inMemory.games.set(gameId, gameData);
        }
    }

    async getGame(gameId) {
        if (this.useRedis) {
            const data = await this.redis.hGet('games', gameId);
            return data ? JSON.parse(data) : null;
        }
        return this.inMemory.games.get(gameId) || null;
    }

    async deleteGame(gameId) {
        if (this.useRedis) {
            await this.redis.hDel('games', gameId);
        } else {
            this.inMemory.games.delete(gameId);
        }
    }

    async getAllActiveGames() {
        if (this.useRedis) {
            const games = await this.redis.hGetAll('games');
            return Object.entries(games).map(([id, data]) => ({
                id,
                ...JSON.parse(data)
            }));
        }
        return Array.from(this.inMemory.games.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    // Leaderboard operations
    async updateLeaderboard(username, stats) {
        if (this.useRedis) {
            const score = (stats.wins * 3) + stats.draws - (stats.losses * 2);
            await this.redis.zAdd('leaderboard', { score, value: username });
            await this.redis.hSet('player_stats', username, JSON.stringify(stats));
        } else {
            this.inMemory.leaderboard.set(username, stats);
        }
    }

    async getLeaderboard(limit = 10) {
        if (this.useRedis) {
            const topPlayers = await this.redis.zRange('leaderboard', 0, limit - 1, { REV: true });
            const leaderboard = [];
            for (const username of topPlayers) {
                const statsData = await this.redis.hGet('player_stats', username);
                if (statsData) {
                    leaderboard.push({ username, ...JSON.parse(statsData) });
                }
            }
            return leaderboard;
        }
        
        return Array.from(this.inMemory.leaderboard.entries())
            .map(([username, stats]) => ({ username, ...stats }))
            .sort((a, b) => {
                const scoreA = (a.wins * 3) + a.draws - (a.losses * 2);
                const scoreB = (b.wins * 3) + b.draws - (b.losses * 2);
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }

    async getPlayerStats(username) {
        if (this.useRedis) {
            const data = await this.redis.hGet('player_stats', username);
            return data ? JSON.parse(data) : { wins: 0, losses: 0, draws: 0, gamesPlayed: 0 };
        }
        return this.inMemory.leaderboard.get(username) || { wins: 0, losses: 0, draws: 0, gamesPlayed: 0 };
    }

    async getPlayerRank(username) {
        if (this.useRedis) {
            const rank = await this.redis.zRevRank('leaderboard', username);
            return rank !== null ? rank + 1 : null;
        }
        const sorted = Array.from(this.inMemory.leaderboard.entries())
            .sort((a, b) => {
                const scoreA = (a[1].wins * 3) + a[1].draws - (a[1].losses * 2);
                const scoreB = (b[1].wins * 3) + b[1].draws - (b[1].losses * 2);
                return scoreB - scoreA;
            });
        const index = sorted.findIndex(([u]) => u === username);
        return index !== -1 ? index + 1 : null;
    }

    // Follow system operations
    async followUser(followerUsername, followingUsername) {
        if (this.useRedis) {
            await this.redis.sAdd(`following:${followerUsername}`, followingUsername);
            await this.redis.sAdd(`followers:${followingUsername}`, followerUsername);
        } else {
            if (!this.inMemory.follows.has(followerUsername)) {
                this.inMemory.follows.set(followerUsername, { following: new Set(), followers: new Set() });
            }
            if (!this.inMemory.follows.has(followingUsername)) {
                this.inMemory.follows.set(followingUsername, { following: new Set(), followers: new Set() });
            }
            this.inMemory.follows.get(followerUsername).following.add(followingUsername);
            this.inMemory.follows.get(followingUsername).followers.add(followerUsername);
        }
    }

    async unfollowUser(followerUsername, followingUsername) {
        if (this.useRedis) {
            await this.redis.sRem(`following:${followerUsername}`, followingUsername);
            await this.redis.sRem(`followers:${followingUsername}`, followerUsername);
        } else {
            const followerData = this.inMemory.follows.get(followerUsername);
            const followingData = this.inMemory.follows.get(followingUsername);
            if (followerData) followerData.following.delete(followingUsername);
            if (followingData) followingData.followers.delete(followerUsername);
        }
    }

    async getFollowing(username) {
        if (this.useRedis) {
            return await this.redis.sMembers(`following:${username}`);
        }
        const data = this.inMemory.follows.get(username);
        return data ? Array.from(data.following) : [];
    }

    async getFollowers(username) {
        if (this.useRedis) {
            return await this.redis.sMembers(`followers:${username}`);
        }
        const data = this.inMemory.follows.get(username);
        return data ? Array.from(data.followers) : [];
    }

    async isFollowing(followerUsername, followingUsername) {
        if (this.useRedis) {
            return await this.redis.sIsMember(`following:${followerUsername}`, followingUsername);
        }
        const data = this.inMemory.follows.get(followerUsername);
        return data ? data.following.has(followingUsername) : false;
    }

    // Chat/Message operations
    async addMessage(roomId, message) {
        const key = `chat:${roomId}`;
        if (this.useRedis) {
            await this.redis.lPush(key, JSON.stringify(message));
            await this.redis.lTrim(key, 0, 99);
            await this.redis.expire(key, 86400);
        } else {
            if (!this.inMemory.messages.has(roomId)) {
                this.inMemory.messages.set(roomId, []);
            }
            const messages = this.inMemory.messages.get(roomId);
            messages.unshift(message);
            if (messages.length > 100) messages.pop();
        }
    }

    async getMessages(roomId, limit = 50) {
        const key = `chat:${roomId}`;
        if (this.useRedis) {
            const messages = await this.redis.lRange(key, 0, limit - 1);
            return messages.map(m => {
                try {
                    return JSON.parse(m);
                } catch (e) {
                    return null;
                }
            }).filter(m => m !== null).reverse();
        }
        const messages = this.inMemory.messages.get(roomId) || [];
        return messages.slice(0, limit).reverse();
    }

    // Online players tracking
    async setPlayerOnline(username, socketId) {
        if (this.useRedis) {
            await this.redis.hSet('online_players', username, socketId);
        } else {
            this.inMemory.onlinePlayers.set(username, socketId);
        }
    }

    async setPlayerOffline(username) {
        if (this.useRedis) {
            await this.redis.hDel('online_players', username);
        } else {
            this.inMemory.onlinePlayers.delete(username);
        }
    }

    async getOnlinePlayers() {
        if (this.useRedis) {
            return await this.redis.hGetAll('online_players');
        }
        return Object.fromEntries(this.inMemory.onlinePlayers);
    }

    async isPlayerOnline(username) {
        if (this.useRedis) {
            return await this.redis.hExists('online_players', username);
        }
        return this.inMemory.onlinePlayers.has(username);
    }

    async getOnlineCount() {
        if (this.useRedis) {
            return await this.redis.hLen('online_players');
        }
        return this.inMemory.onlinePlayers.size;
    }

    // ==========================================
    // BLOCKING OPERATIONS
    // ==========================================

    async blockUser(blockerUsername, blockedUsername) {
        if (this.useRedis) {
            await this.redis.sAdd(`blocked:${blockerUsername}`, blockedUsername);
        } else {
            if (!this.inMemory.blocks.has(blockerUsername)) {
                this.inMemory.blocks.set(blockerUsername, new Set());
            }
            this.inMemory.blocks.get(blockerUsername).add(blockedUsername);
        }
    }

    async unblockUser(blockerUsername, blockedUsername) {
        if (this.useRedis) {
            await this.redis.sRem(`blocked:${blockerUsername}`, blockedUsername);
        } else {
            const blocked = this.inMemory.blocks.get(blockerUsername);
            if (blocked) blocked.delete(blockedUsername);
        }
    }

    async isBlocked(blockerUsername, blockedUsername) {
        if (this.useRedis) {
            return await this.redis.sIsMember(`blocked:${blockerUsername}`, blockedUsername);
        }
        const blocked = this.inMemory.blocks.get(blockerUsername);
        return blocked ? blocked.has(blockedUsername) : false;
    }

    async getBlockedUsers(username) {
        if (this.useRedis) {
            return await this.redis.sMembers(`blocked:${username}`);
        }
        const blocked = this.inMemory.blocks.get(username);
        return blocked ? Array.from(blocked) : [];
    }

    // ==========================================
    // REPORTING OPERATIONS
    // ==========================================

    async addReport(report) {
        if (this.useRedis) {
            await this.redis.hSet('reports', report.id, JSON.stringify(report));
            await this.redis.sAdd(`reports_by:${report.reporterUsername}`, report.id);
            await this.redis.sAdd(`reports_against:${report.reportedUsername}`, report.id);
        } else {
            this.inMemory.reports.set(report.id, report);
        }
    }

    async getReport(reportId) {
        if (this.useRedis) {
            const data = await this.redis.hGet('reports', reportId);
            return data ? JSON.parse(data) : null;
        }
        return this.inMemory.reports.get(reportId) || null;
    }

    async updateReport(report) {
        if (this.useRedis) {
            await this.redis.hSet('reports', report.id, JSON.stringify(report));
        } else {
            this.inMemory.reports.set(report.id, report);
        }
    }

    async getReportsAgainstUser(username) {
        if (this.useRedis) {
            const reportIds = await this.redis.sMembers(`reports_against:${username}`);
            const reports = [];
            for (const id of reportIds) {
                const report = await this.getReport(id);
                if (report) reports.push(report);
            }
            return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return Array.from(this.inMemory.reports.values())
            .filter(r => r.reportedUsername === username)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async getReportsByReporter(username) {
        if (this.useRedis) {
            const reportIds = await this.redis.sMembers(`reports_by:${username}`);
            const reports = [];
            for (const id of reportIds) {
                const report = await this.getReport(id);
                if (report) reports.push(report);
            }
            return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return Array.from(this.inMemory.reports.values())
            .filter(r => r.reporterUsername === username)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async getAllPendingReports() {
        if (this.useRedis) {
            const allReports = await this.redis.hGetAll('reports');
            return Object.values(allReports)
                .map(r => JSON.parse(r))
                .filter(r => r.status === 'pending')
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        return Array.from(this.inMemory.reports.values())
            .filter(r => r.status === 'pending')
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    // ==========================================
    // DISCIPLINE OPERATIONS
    // ==========================================

    async addDiscipline(discipline) {
        if (this.useRedis) {
            await this.redis.hSet('disciplines', discipline.id, JSON.stringify(discipline));
            await this.redis.sAdd(`discipline_history:${discipline.username}`, discipline.id);
        } else {
            this.inMemory.disciplines.set(discipline.id, discipline);
        }
    }

    async getDiscipline(disciplineId) {
        if (this.useRedis) {
            const data = await this.redis.hGet('disciplines', disciplineId);
            return data ? JSON.parse(data) : null;
        }
        return this.inMemory.disciplines.get(disciplineId) || null;
    }

    async updateDiscipline(discipline) {
        if (this.useRedis) {
            await this.redis.hSet('disciplines', discipline.id, JSON.stringify(discipline));
        } else {
            this.inMemory.disciplines.set(discipline.id, discipline);
        }
    }

    async deactivateDiscipline(disciplineId) {
        const discipline = await this.getDiscipline(disciplineId);
        if (discipline) {
            discipline.active = false;
            await this.updateDiscipline(discipline);
        }
    }

    async getDisciplineHistory(username) {
        if (this.useRedis) {
            const disciplineIds = await this.redis.sMembers(`discipline_history:${username}`);
            const disciplines = [];
            for (const id of disciplineIds) {
                const discipline = await this.getDiscipline(id);
                if (discipline) disciplines.push(discipline);
            }
            return disciplines.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
        }
        return Array.from(this.inMemory.disciplines.values())
            .filter(d => d.username === username)
            .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
    }

    async getActiveDisciplines(username) {
        const history = await this.getDisciplineHistory(username);
        return history.filter(d => d.active);
    }

    // ==========================================
    // OAUTH MAPPING OPERATIONS
    // ==========================================

    async setOAuthMapping(oauthKey, username) {
        if (this.useRedis) {
            await this.redis.hSet('oauth_mappings', oauthKey, username);
        } else {
            this.inMemory.oauthMappings.set(oauthKey, username);
        }
    }

    async getOAuthMapping(oauthKey) {
        if (this.useRedis) {
            return await this.redis.hGet('oauth_mappings', oauthKey);
        }
        return this.inMemory.oauthMappings.get(oauthKey) || null;
    }

    async deleteOAuthMapping(oauthKey) {
        if (this.useRedis) {
            await this.redis.hDel('oauth_mappings', oauthKey);
        } else {
            this.inMemory.oauthMappings.delete(oauthKey);
        }
    }

    async getUserByOAuth(oauthKey) {
        const username = await this.getOAuthMapping(oauthKey);
        if (!username) return null;
        return await this.getUser(username);
    }

    // ==========================================
    // FIREBASE MAPPING OPERATIONS
    // ==========================================

    async setFirebaseMapping(firebaseUid, username) {
        if (this.useRedis) {
            await this.redis.hSet('firebase_mappings', firebaseUid, username);
        } else {
            if (!this.inMemory.firebaseMappings) {
                this.inMemory.firebaseMappings = new Map();
            }
            this.inMemory.firebaseMappings.set(firebaseUid, username);
        }
    }

    async getFirebaseMapping(firebaseUid) {
        if (this.useRedis) {
            return await this.redis.hGet('firebase_mappings', firebaseUid);
        }
        if (!this.inMemory.firebaseMappings) {
            this.inMemory.firebaseMappings = new Map();
        }
        return this.inMemory.firebaseMappings.get(firebaseUid) || null;
    }

    async getUserByFirebaseUid(firebaseUid) {
        const username = await this.getFirebaseMapping(firebaseUid);
        if (!username) return null;
        return await this.getUser(username);
    }
}

module.exports = new Storage();
