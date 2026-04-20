/**
 * Progression System
 * Player levels, XP, daily challenges, and battle pass progression
 * Integrates with CAPS token rewards
 */

class ProgressionSystem {
    constructor() {
        this.levels = this.generateLevelTable();
        this.dailyChallenges = [];
        this.playerProgress = new Map();
        this.challengeResetTime = this.getNextMidnight();
        this.initializeDailyChallenges();
    }

    /**
     * Generate XP requirements for each level
     */
    generateLevelTable() {
        const levels = {};
        for (let level = 1; level <= 100; level++) {
            // Exponential XP curve: base XP * level^1.5
            levels[level] = {
                xpRequired: Math.floor(100 * Math.pow(level, 1.5)),
                rewards: this.getLevelRewards(level)
            };
        }
        return levels;
    }

    /**
     * Get rewards for reaching a level
     */
    getLevelRewards(level) {
        const rewards = {
            caps: 0,
            cosmetics: [],
            titles: []
        };

        // CAPS rewards every 5 levels
        if (level % 5 === 0) {
            rewards.caps = level * 10; // 50 CAPS at level 5, 100 at level 10, etc.
        }

        // Special cosmetic unlocks
        if (level >= 10) rewards.cosmetics.push('avatar_frame_silver');
        if (level >= 25) rewards.cosmetics.push('avatar_frame_gold');
        if (level >= 50) rewards.cosmetics.push('avatar_frame_diamond');
        if (level >= 75) rewards.cosmetics.push('avatar_frame_legendary');

        // Title unlocks
        if (level >= 5) rewards.titles.push('Apprentice');
        if (level >= 15) rewards.titles.push('Skilled Player');
        if (level >= 30) rewards.titles.push('Expert');
        if (level >= 50) rewards.titles.push('Master');
        if (level >= 75) rewards.titles.push('Grandmaster');
        if (level >= 100) rewards.titles.push('Legend');

        return rewards;
    }

    /**
     * Initialize daily challenges
     */
    initializeDailyChallenges() {
        this.dailyChallenges = [
            {
                id: 'play_games',
                name: 'Game Master',
                description: 'Play 5 different games today',
                target: 5,
                reward: { caps: 25, xp: 50 },
                type: 'count',
                games: new Set()
            },
            {
                id: 'win_streak',
                name: 'Winning Streak',
                description: 'Win 3 games in a row',
                target: 3,
                reward: { caps: 50, xp: 100 },
                type: 'streak',
                current: 0
            },
            {
                id: 'perfect_game',
                name: 'Perfectionist',
                description: 'Complete a game without making any mistakes',
                target: 1,
                reward: { caps: 100, xp: 200 },
                type: 'achievement'
            },
            {
                id: 'social_player',
                name: 'Social Butterfly',
                description: 'Send 3 friend requests or join 2 multiplayer games',
                target: 3,
                reward: { caps: 30, xp: 75 },
                type: 'social',
                actions: []
            },
            {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Complete a game in under 30 seconds',
                target: 1,
                reward: { caps: 75, xp: 150 },
                type: 'time'
            }
        ];
    }

    /**
     * Get player progress data
     */
    getPlayerProgress(username) {
        if (!this.playerProgress.has(username)) {
            this.playerProgress.set(username, {
                level: 1,
                xp: 0,
                totalXp: 0,
                capsEarned: 0,
                dailyChallenges: this.getFreshDailyChallenges(),
                lastChallengeReset: new Date().toISOString(),
                battlePassProgress: 0,
                achievements: new Set(),
                stats: {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    winStreak: 0,
                    bestWinStreak: 0,
                    totalPlayTime: 0,
                    favoriteGame: null
                }
            });
        }

        const progress = this.playerProgress.get(username);

        // Check if daily challenges need reset
        if (this.shouldResetDailyChallenges(progress.lastChallengeReset)) {
            progress.dailyChallenges = this.getFreshDailyChallenges();
            progress.lastChallengeReset = new Date().toISOString();
        }

        return progress;
    }

    /**
     * Get fresh daily challenges for a player
     */
    getFreshDailyChallenges() {
        return this.dailyChallenges.map(challenge => ({
            ...challenge,
            progress: 0,
            completed: false,
            claimed: false
        }));
    }

    /**
     * Check if daily challenges should reset
     */
    shouldResetDailyChallenges(lastReset) {
        const lastResetTime = new Date(lastReset);
        const now = new Date();
        return now >= this.challengeResetTime && lastResetTime < this.challengeResetTime;
    }

    /**
     * Get next midnight for challenge reset
     */
    getNextMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return midnight;
    }

    /**
     * Award XP to player
     */
    awardXP(username, xpAmount, reason = 'game_completion') {
        const progress = this.getPlayerProgress(username);
        progress.xp += xpAmount;
        progress.totalXp += xpAmount;

        // Check for level up
        let leveledUp = false;
        while (progress.level < 100 && progress.xp >= this.levels[progress.level + 1].xpRequired) {
            progress.level++;
            leveledUp = true;

            // Award level rewards
            const rewards = this.levels[progress.level].rewards;
            if (rewards.caps > 0) {
                progress.capsEarned += rewards.caps;
                // TODO: Integrate with CAPS token system
            }
        }

        return {
            newXP: progress.xp,
            newLevel: progress.level,
            leveledUp,
            rewards: leveledUp ? this.levels[progress.level].rewards : null
        };
    }

    /**
     * Update daily challenge progress
     */
    updateDailyChallenge(username, challengeId, progress = 1) {
        const playerProgress = this.getPlayerProgress(username);
        const challenge = playerProgress.dailyChallenges.find(c => c.id === challengeId);

        if (!challenge || challenge.completed) return;

        challenge.progress += progress;

        if (challenge.progress >= challenge.target) {
            challenge.completed = true;
            // Award challenge rewards
            this.awardXP(username, challenge.reward.xp, `daily_challenge_${challengeId}`);
            playerProgress.capsEarned += challenge.reward.caps;
        }

        return challenge;
    }

    /**
     * Track game completion for progression
     */
    trackGameCompletion(username, gameType, won = false, playTime = 0, mistakes = 0) {
        const progress = this.getPlayerProgress(username);
        const stats = progress.stats;

        stats.gamesPlayed++;
        if (won) {
            stats.gamesWon++;
            stats.winStreak++;
            if (stats.winStreak > stats.bestWinStreak) {
                stats.bestWinStreak = stats.winStreak;
            }
        } else {
            stats.winStreak = 0;
        }

        stats.totalPlayTime += playTime;

        // Update favorite game
        if (!stats.favoriteGame) {
            stats.favoriteGame = gameType;
        }

        // Award XP based on game completion
        let xpAward = 10; // Base XP
        if (won) xpAward += 20; // Bonus for winning
        if (mistakes === 0) xpAward += 30; // Bonus for perfect game
        if (playTime < 30) xpAward += 15; // Speed bonus

        const xpResult = this.awardXP(username, xpAward, 'game_completion');

        // Update daily challenges
        this.updateDailyChallenge(username, 'play_games', 1); // Count unique games
        if (won) {
            this.updateDailyChallenge(username, 'win_streak', 1);
        }
        if (mistakes === 0 && won) {
            this.updateDailyChallenge(username, 'perfect_game', 1);
        }
        if (playTime < 30 && won) {
            this.updateDailyChallenge(username, 'speed_demon', 1);
        }

        return {
            xpAward,
            ...xpResult,
            stats: { ...stats }
        };
    }

    /**
     * Get battle pass progress
     */
    getBattlePassProgress(username) {
        const progress = this.getPlayerProgress(username);
        const currentLevel = progress.level;

        // Battle pass has 50 tiers
        const battlePassTier = Math.min(50, Math.floor(currentLevel / 2));

        return {
            currentTier: battlePassTier,
            progressToNext: (currentLevel % 2) / 2 * 100, // Progress within current tier
            rewards: this.getBattlePassRewards(battlePassTier)
        };
    }

    /**
     * Get battle pass rewards for a tier
     */
    getBattlePassRewards(tier) {
        const rewards = {
            free: [],
            premium: [],
            ultimate: []
        };

        // Free rewards every tier
        rewards.free.push(`${tier * 5} CAPS`);

        // Premium rewards every 5 tiers
        if (tier % 5 === 0) {
            rewards.premium.push(`Premium Avatar Frame #${tier/5}`);
        }

        // Ultimate rewards every 10 tiers
        if (tier % 10 === 0) {
            rewards.ultimate.push(`Legendary Cosmetic #${tier/10}`);
        }

        return rewards;
    }

    /**
     * Get player stats summary
     */
    getPlayerStats(username) {
        const progress = this.getPlayerProgress(username);
        const stats = progress.stats;

        return {
            level: progress.level,
            xp: progress.xp,
            xpToNext: progress.level < 100 ? this.levels[progress.level + 1].xpRequired - progress.xp : 0,
            totalXp: progress.totalXp,
            capsEarned: progress.capsEarned,
            winRate: stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed * 100).toFixed(1) : 0,
            currentWinStreak: stats.winStreak,
            bestWinStreak: stats.bestWinStreak,
            gamesPlayed: stats.gamesPlayed,
            totalPlayTime: Math.floor(stats.totalPlayTime / 60), // minutes
            favoriteGame: stats.favoriteGame,
            dailyChallenges: progress.dailyChallenges,
            battlePass: this.getBattlePassProgress(username)
        };
    }

    /**
     * Reset daily challenges (called at midnight)
     */
    resetDailyChallenges() {
        this.challengeResetTime = this.getNextMidnight();

        // Reset all players' daily challenges
        for (const [username, progress] of this.playerProgress) {
            progress.dailyChallenges = this.getFreshDailyChallenges();
            progress.lastChallengeReset = new Date().toISOString();
        }
    }

    /**
     * Save progress to storage (would integrate with existing storage system)
     */
    async saveProgress(username) {
        const progress = this.getPlayerProgress(username);
        // TODO: Integrate with storage.js
        console.log(`Saving progress for ${username}:`, progress);
    }

    /**
     * Load progress from storage
     */
    async loadProgress(username) {
        // TODO: Integrate with storage.js
        console.log(`Loading progress for ${username}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressionSystem;
}