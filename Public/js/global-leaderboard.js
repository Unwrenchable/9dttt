/**
 * Global Leaderboard & Scoring System
 * Tracks scores across all games with tokenization rewards
 */

class GlobalLeaderboard {
    constructor() {
        this.db = null;
        this.apiEndpoint = (window.API_CONFIG && window.API_CONFIG.apiUrl) ? window.API_CONFIG.apiUrl : 'https://ninedttt.onrender.com/api';
        this.games = [
            'monster-rampage', 'contra-commando', 'sky-ace-combat', 
            'mega-heroes', 'tournament-fighters', 'brain-academy',
            'reflex-master', 'brain-age', 'dragon-fist', 'street-brawlers',
            '4d-chess', 'connect-four', 'crystal-connect', 'farkle',
            'hangman', 'memory-game', 'quantum-sudoku', 'recursive-maze',
            'thirteen', 'tide-turner', 'ultimate-tictactoe'
        ];
        this.initDB();
    }
    
    async initDB() {
        const dbRequest = indexedDB.open('9DTTT_GameDB', 1);
        dbRequest.onsuccess = (e) => {
            this.db = e.target.result;
        };
    }
    
    // Submit score with token reward calculation
    async submitScore(gameId, score, metadata = {}) {
        const user = window.universalAuth?.getUser();
        if (!user) {
            console.warn('No user logged in - score not saved');
            return null;
        }
        
        const scoreEntry = {
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            game: gameId,
            score: score,
            metadata: metadata, // level, time, accuracy, etc.
            timestamp: Date.now(),
            tokensEarned: this.calculateTokenReward(gameId, score, metadata)
        };
        
        // Save locally
        await this.saveScoreLocal(scoreEntry);
        
        // Award tokens
        if (scoreEntry.tokensEarned > 0) {
            await this.awardTokens(user.id, scoreEntry.tokensEarned, gameId);
        }
        
        // Sync with backend
        await this.syncScoreToBackend(scoreEntry);
        
        // Check for achievements
        await this.checkAchievements(user.id, gameId, score, metadata);
        
        return scoreEntry;
    }
    
    calculateTokenReward(gameId, score, metadata) {
        // Base reward calculation
        let tokens = Math.floor(score / 100); // 1 token per 100 points
        
        // Multipliers for different games
        const multipliers = {
            'brain-academy': 2.0,     // Educational games earn more
            'brain-age': 2.0,
            'reflex-master': 1.5,     // Skill-based
            'tournament-fighters': 1.8,
            'monster-rampage': 1.5,
            'contra-commando': 1.5,
            'mega-heroes': 1.5
        };
        
        tokens *= (multipliers[gameId] || 1.0);
        
        // Bonus for performance
        if (metadata.accuracy && metadata.accuracy > 90) {
            tokens *= 1.5; // 50% bonus for 90%+ accuracy
        }
        
        if (metadata.perfectRound) {
            tokens *= 2.0; // Double for perfect rounds
        }
        
        if (metadata.speedBonus) {
            tokens += 50; // Flat bonus for speed
        }
        
        // Daily login bonus
        if (this.isFirstGameToday(metadata.userId)) {
            tokens += 100;
        }
        
        return Math.floor(tokens);
    }
    
    async saveScoreLocal(scoreEntry) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readwrite');
            const store = transaction.objectStore('scores');
            const request = store.add(scoreEntry);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async syncScoreToBackend(scoreEntry) {
        try {
            const token = window.authClient?.token || localStorage.getItem('auth_token') || '';
            await fetch(`${this.apiEndpoint}/scores/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(scoreEntry)
            });
        } catch (error) {
            console.error('Score sync error:', error);
            // Queue for retry
            this.queueForRetry(scoreEntry);
        }
    }
    
    async awardTokens(userId, amount, source) {
        try {
            // Update local tokens
            const user = await window.universalAuth.getUser(userId);
            if (user) {
                user.tokens = (user.tokens || 0) + amount;
                await window.universalAuth.saveUser(user);
            }
            
            // Sync with blockchain
            const token = window.authClient?.token || localStorage.getItem('auth_token') || '';
            await fetch(`${this.apiEndpoint}/tokens/award`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    userId,
                    amount,
                    source,
                    timestamp: Date.now()
                })
            });
            
            // Show notification
            this.showTokenReward(amount);
        } catch (error) {
            console.error('Token award error:', error);
        }
    }
    
    // Get top scores for a specific game
    async getGameLeaderboard(gameId, limit = 100) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readonly');
            const store = transaction.objectStore('scores');
            const index = store.index('game');
            const request = index.getAll(gameId);
            
            request.onsuccess = () => {
                const scores = request.result
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit);
                resolve(scores);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    // Get global top players across all games
    async getGlobalLeaderboard(limit = 100) {
        try {
            // Fetch from backend for global leaderboard
            const response = await fetch(`${this.apiEndpoint}/leaderboard/global?limit=${limit}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch global leaderboard:', error);
        }
        
        // Fallback to local data
        return this.getLocalGlobalLeaderboard(limit);
    }
    
    async getLocalGlobalLeaderboard(limit) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readonly');
            const store = transaction.objectStore('scores');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const scores = request.result;
                
                // Aggregate by user
                const userScores = {};
                scores.forEach(score => {
                    if (!userScores[score.userId]) {
                        userScores[score.userId] = {
                            userId: score.userId,
                            userName: score.userName,
                            userAvatar: score.userAvatar,
                            totalScore: 0,
                            gamesPlayed: 0,
                            tokensEarned: 0
                        };
                    }
                    
                    userScores[score.userId].totalScore += score.score;
                    userScores[score.userId].gamesPlayed++;
                    userScores[score.userId].tokensEarned += (score.tokensEarned || 0);
                });
                
                const leaderboard = Object.values(userScores)
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .slice(0, limit);
                
                resolve(leaderboard);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    // Get user's rank
    async getUserRank(userId, gameId = null) {
        const leaderboard = gameId 
            ? await this.getGameLeaderboard(gameId, 10000)
            : await this.getGlobalLeaderboard(10000);
        
        const rank = leaderboard.findIndex(entry => 
            entry.userId === userId || entry.userId === userId
        );
        
        return rank === -1 ? null : rank + 1;
    }
    
    // Get user's stats
    async getUserStats(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readonly');
            const store = transaction.objectStore('scores');
            const index = store.index('userId');
            const request = index.getAll(userId);
            
            request.onsuccess = () => {
                const scores = request.result;
                
                const stats = {
                    totalGames: scores.length,
                    totalScore: scores.reduce((sum, s) => sum + s.score, 0),
                    totalTokens: scores.reduce((sum, s) => sum + (s.tokensEarned || 0), 0),
                    averageScore: scores.length > 0 ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length : 0,
                    highestScore: Math.max(...scores.map(s => s.score), 0),
                    gameBreakdown: {},
                    recentGames: scores.slice(-10).reverse()
                };
                
                // Breakdown by game
                scores.forEach(score => {
                    if (!stats.gameBreakdown[score.game]) {
                        stats.gameBreakdown[score.game] = {
                            plays: 0,
                            totalScore: 0,
                            highScore: 0,
                            avgScore: 0
                        };
                    }
                    
                    const game = stats.gameBreakdown[score.game];
                    game.plays++;
                    game.totalScore += score.score;
                    game.highScore = Math.max(game.highScore, score.score);
                    game.avgScore = game.totalScore / game.plays;
                });
                
                resolve(stats);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    async checkAchievements(userId, gameId, score, metadata) {
        const achievements = [];
        
        // Check various achievement criteria
        if (score >= 10000) achievements.push('score_10k');
        if (score >= 50000) achievements.push('score_50k');
        if (score >= 100000) achievements.push('score_100k');
        
        if (metadata.accuracy === 100) achievements.push('perfect_accuracy');
        if (metadata.noHits) achievements.push('flawless_victory');
        
        // Award achievement tokens
        for (const achievement of achievements) {
            await this.awardAchievement(userId, achievement);
        }
    }
    
    async awardAchievement(userId, achievementId) {
        const achievementRewards = {
            'score_10k': 500,
            'score_50k': 2000,
            'score_100k': 5000,
            'perfect_accuracy': 1000,
            'flawless_victory': 1500
        };
        
        const tokens = achievementRewards[achievementId] || 100;
        await this.awardTokens(userId, tokens, `achievement_${achievementId}`);
        
        // Save achievement
        const transaction = this.db.transaction(['achievements'], 'readwrite');
        const store = transaction.objectStore('achievements');
        store.add({
            userId,
            achievementId,
            tokensAwarded: tokens,
            timestamp: Date.now()
        });
    }
    
    showTokenReward(amount) {
        const notification = document.createElement('div');
        notification.className = 'token-reward-notification';
        notification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 20px 30px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 10000; animation: slideIn 0.5s ease-out;">
                <div style="font-size: 18px; font-weight: bold;">🎉 Tokens Earned!</div>
                <div style="font-size: 32px; margin: 10px 0;">+${Number(amount) || 0} 🪙</div>
                <div style="font-size: 12px; opacity: 0.8;">Added to your wallet</div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    isFirstGameToday(userId) {
        const lastPlay = localStorage.getItem(`lastPlay_${userId}`);
        const today = new Date().toDateString();
        
        if (lastPlay !== today) {
            localStorage.setItem(`lastPlay_${userId}`, today);
            return true;
        }
        return false;
    }
    
    queueForRetry(scoreEntry) {
        const queue = JSON.parse(localStorage.getItem('scoreQueue') || '[]');
        queue.push(scoreEntry);
        localStorage.setItem('scoreQueue', JSON.stringify(queue));
    }
}

// Initialize global leaderboard
window.globalLeaderboard = new GlobalLeaderboard();

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
