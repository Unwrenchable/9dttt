/**
 * Achievements & Fun System
 * Makes games more engaging with challenges, combos, and rewards
 */

class AchievementSystem {
    constructor() {
        this.achievements = [];
        this.unlockedAchievements = new Set();
        this.comboCounter = 0;
        this.streakCounter = 0;
        this.loadProgress();
        this.createUI();
        this.initializeAchievements();
    }
    
    initializeAchievements() {
        // Universal achievements that work across all games
        this.addAchievement({
            id: 'first_game',
            name: 'Getting Started',
            description: 'Play your first game',
            icon: '🎮',
            reward: 50,
            condition: () => true
        });
        
        this.addAchievement({
            id: 'combo_5',
            name: 'Combo Master',
            description: 'Get a 5-hit combo',
            icon: '🔥',
            reward: 100,
            condition: (data) => data.combo >= 5
        });
        
        this.addAchievement({
            id: 'combo_10',
            name: 'Unstoppable',
            description: 'Get a 10-hit combo',
            icon: '💥',
            reward: 250,
            condition: (data) => data.combo >= 10
        });
        
        this.addAchievement({
            id: 'perfect_round',
            name: 'Flawless Victory',
            description: 'Complete a round without taking damage',
            icon: '👑',
            reward: 200,
            condition: (data) => data.damageTaken === 0 && data.roundComplete
        });
        
        this.addAchievement({
            id: 'speed_demon',
            name: 'Speed Demon',
            description: 'Complete a level in under 60 seconds',
            icon: '⚡',
            reward: 150,
            condition: (data) => data.levelTime < 60 && data.levelComplete
        });
        
        this.addAchievement({
            id: 'high_score_1000',
            name: 'Rising Star',
            description: 'Score over 1,000 points',
            icon: '⭐',
            reward: 100,
            condition: (data) => data.score >= 1000
        });
        
        this.addAchievement({
            id: 'high_score_10000',
            name: 'Champion',
            description: 'Score over 10,000 points',
            icon: '🏆',
            reward: 500,
            condition: (data) => data.score >= 10000
        });
        
        this.addAchievement({
            id: 'high_score_100000',
            name: 'Legend',
            description: 'Score over 100,000 points',
            icon: '👑',
            reward: 2000,
            condition: (data) => data.score >= 100000
        });
        
        this.addAchievement({
            id: 'win_streak_3',
            name: 'On Fire',
            description: 'Win 3 games in a row',
            icon: '🔥',
            reward: 150,
            condition: (data) => data.winStreak >= 3
        });
        
        this.addAchievement({
            id: 'win_streak_10',
            name: 'Domination',
            description: 'Win 10 games in a row',
            icon: '💎',
            reward: 1000,
            condition: (data) => data.winStreak >= 10
        });
        
        this.addAchievement({
            id: 'playtime_1hour',
            name: 'Dedicated Player',
            description: 'Play for 1 hour total',
            icon: '⏰',
            reward: 200,
            condition: (data) => data.totalPlaytime >= 3600
        });
        
        this.addAchievement({
            id: 'all_games',
            name: 'Explorer',
            description: 'Play 5 different games',
            icon: '🗺️',
            reward: 300,
            condition: (data) => data.uniqueGamesPlayed >= 5
        });
    }
    
    addAchievement(achievement) {
        this.achievements.push(achievement);
    }
    
    checkAchievements(gameData) {
        const newUnlocks = [];
        
        for (const achievement of this.achievements) {
            if (!this.unlockedAchievements.has(achievement.id)) {
                if (achievement.condition(gameData)) {
                    this.unlockAchievement(achievement);
                    newUnlocks.push(achievement);
                }
            }
        }
        
        return newUnlocks;
    }
    
    unlockAchievement(achievement) {
        this.unlockedAchievements.add(achievement.id);
        this.saveProgress();
        this.showUnlockNotification(achievement);
        
        // Award tokens
        if (window.globalLeaderboard) {
            const user = window.universalAuth?.getUser();
            if (user) {
                user.tokens = (user.tokens || 0) + achievement.reward;
            }
        }
    }
    
    showUnlockNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-unlock';
        notification.innerHTML = `
            <div class="achievement-glow"></div>
            <div class="achievement-content">
                <div class="achievement-icon-large">${this._escapeHtml(achievement.icon)}</div>
                <div class="achievement-text">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${this._escapeHtml(achievement.name)}</div>
                    <div class="achievement-desc">${this._escapeHtml(achievement.description)}</div>
                    <div class="achievement-reward">+${Number(achievement.reward) || 0} 🪙</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Play sound effect
        if (window.SoundManager) {
            const sound = new SoundManager();
            sound.play('powerup');
        }
        
        // Remove after animation
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-out forwards';
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }
    
    createUI() {
        const style = document.createElement('style');
        style.textContent = `
            .achievement-unlock {
                position: fixed;
                top: 100px;
                right: 20px;
                width: 350px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                z-index: 10002;
                animation: slideIn 0.6s ease-out;
                overflow: hidden;
            }
            
            .achievement-glow {
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
                animation: glow 2s ease-in-out infinite;
            }
            
            .achievement-content {
                position: relative;
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .achievement-icon-large {
                font-size: 48px;
                animation: bounce 0.6s ease-out;
            }
            
            .achievement-text {
                flex: 1;
                color: white;
            }
            
            .achievement-title {
                font-size: 12px;
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .achievement-name {
                font-size: 18px;
                font-weight: bold;
                margin: 5px 0;
            }
            
            .achievement-desc {
                font-size: 13px;
                opacity: 0.9;
            }
            
            .achievement-reward {
                font-size: 16px;
                font-weight: bold;
                margin-top: 8px;
                color: #FFD700;
            }
            
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
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
            
            @keyframes bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
            
            @keyframes glow {
                0%, 100% { transform: rotate(0deg); opacity: 0.3; }
                50% { transform: rotate(180deg); opacity: 0.6; }
            }
            
            @media (max-width: 768px) {
                .achievement-unlock {
                    width: 90%;
                    right: 5%;
                    top: 80px;
                }
            }
            
            /* Combo display */
            .combo-display {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 64px;
                font-weight: bold;
                color: #FFD700;
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.8),
                             0 0 40px rgba(255, 215, 0, 0.6);
                z-index: 9999;
                pointer-events: none;
                animation: comboPopup 1s ease-out forwards;
            }
            
            @keyframes comboPopup {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 0;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.2);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -100%) scale(1);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    showComboDisplay(combo) {
        const display = document.createElement('div');
        display.className = 'combo-display';
        display.textContent = `${combo} COMBO!`;
        document.body.appendChild(display);
        
        setTimeout(() => display.remove(), 1000);
    }
    
    saveProgress() {
        localStorage.setItem('achievements', JSON.stringify([...this.unlockedAchievements]));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('achievements');
        if (saved) {
            this.unlockedAchievements = new Set(JSON.parse(saved));
        }
    }
    
    getProgress() {
        return {
            unlocked: this.unlockedAchievements.size,
            total: this.achievements.length,
            percentage: (this.unlockedAchievements.size / this.achievements.length * 100).toFixed(1)
        };
    }

    /**
     * Escape HTML special characters to prevent XSS when inserting
     * achievement data into innerHTML.
     */
    _escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// Power-ups system for more fun
class PowerUpSystem {
    constructor() {
        this.activePowerUps = [];
        this.powerUpTypes = {
            invincibility: {
                name: 'Invincibility',
                icon: '✨',
                duration: 5000,
                color: '#FFD700'
            },
            doublePoints: {
                name: '2x Points',
                icon: '💰',
                duration: 10000,
                color: '#4CAF50'
            },
            rapidFire: {
                name: 'Rapid Fire',
                icon: '🔫',
                duration: 8000,
                color: '#FF4757'
            },
            speedBoost: {
                name: 'Speed Boost',
                icon: '⚡',
                duration: 7000,
                color: '#FFA502'
            },
            shield: {
                name: 'Shield',
                icon: '🛡️',
                duration: 15000,
                color: '#3498DB'
            }
        };
    }
    
    activatePowerUp(type) {
        if (!this.powerUpTypes[type]) return;
        
        const powerUp = {
            ...this.powerUpTypes[type],
            type,
            expiresAt: Date.now() + this.powerUpTypes[type].duration
        };
        
        this.activePowerUps.push(powerUp);
        this.showPowerUpNotification(powerUp);
        
        // Auto-remove when expired
        setTimeout(() => {
            this.removePowerUp(type);
        }, powerUp.duration);
    }
    
    showPowerUpNotification(powerUp) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 150px;
            right: 20px;
            background: ${powerUp.color};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        `;
        notification.textContent = `${powerUp.icon} ${powerUp.name} Activated!`;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }
    
    removePowerUp(type) {
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== type);
    }
    
    isActive(type) {
        return this.activePowerUps.some(p => p.type === type && Date.now() < p.expiresAt);
    }
    
    getMultiplier() {
        let multiplier = 1;
        if (this.isActive('doublePoints')) multiplier *= 2;
        return multiplier;
    }
}

// Export
window.AchievementSystem = AchievementSystem;
window.PowerUpSystem = PowerUpSystem;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.achievementSystem = new AchievementSystem();
    window.powerUpSystem = new PowerUpSystem();
});
