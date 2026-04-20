/**
 * Progression System Client
 * Handles XP, levels, daily challenges, and battle pass display
 */

class ProgressionClient {
    constructor() {
        this.stats = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createProgressionUI();
        this.loadStats();
        this.setupEventListeners();
    }

    createProgressionUI() {
        // Create main progression container
        const container = document.createElement('div');
        container.id = 'progression-container';
        container.className = 'progression-container hidden';
        container.innerHTML = `
            <div class="progression-header">
                <h2>🎮 Player Progression</h2>
                <button id="close-progression" class="close-btn">×</button>
            </div>

            <div class="progression-content">
                <!-- Level and XP Section -->
                <div class="level-section">
                    <div class="level-display">
                        <div class="level-badge">Level <span id="player-level">1</span></div>
                        <div class="xp-bar">
                            <div class="xp-fill" id="xp-fill"></div>
                            <span class="xp-text" id="xp-text">0 / 100 XP</span>
                        </div>
                    </div>
                    <div class="level-rewards">
                        <h3>Next Level Rewards:</h3>
                        <div id="next-rewards">Loading...</div>
                    </div>
                </div>

                <!-- Stats Section -->
                <div class="stats-section">
                    <h3>📊 Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Games Played</span>
                            <span class="stat-value" id="stat-games-played">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Win Rate</span>
                            <span class="stat-value" id="stat-win-rate">0%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Current Streak</span>
                            <span class="stat-value" id="stat-current-streak">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Best Streak</span>
                            <span class="stat-value" id="stat-best-streak">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">CAPS Earned</span>
                            <span class="stat-value" id="stat-caps-earned">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Total XP</span>
                            <span class="stat-value" id="stat-total-xp">0</span>
                        </div>
                    </div>
                </div>

                <!-- Daily Challenges Section -->
                <div class="challenges-section">
                    <h3>🎯 Daily Challenges</h3>
                    <div id="daily-challenges">Loading challenges...</div>
                </div>

                <!-- Battle Pass Section -->
                <div class="battle-pass-section">
                    <h3>🏆 Battle Pass</h3>
                    <div id="battle-pass-info">Loading battle pass...</div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .progression-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #ffd700;
                border-radius: 15px;
                padding: 20px;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
                font-family: 'Press Start 2P', monospace;
                color: #fff;
            }

            .progression-container.hidden {
                display: none;
            }

            .progression-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #ffd700;
                padding-bottom: 10px;
            }

            .progression-header h2 {
                margin: 0;
                color: #ffd700;
                font-size: 16px;
            }

            .close-btn {
                background: #ff4757;
                color: white;
                border: none;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .level-section {
                margin-bottom: 30px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
            }

            .level-display {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 20px;
            }

            .level-badge {
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                color: #000;
                padding: 10px 20px;
                border-radius: 25px;
                font-weight: bold;
                font-size: 14px;
            }

            .xp-bar {
                flex: 1;
                height: 25px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                position: relative;
                overflow: hidden;
            }

            .xp-fill {
                height: 100%;
                background: linear-gradient(90deg, #4ecdc4, #44a08d);
                border-radius: 12px;
                transition: width 0.3s ease;
            }

            .xp-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 10px;
                color: #000;
                font-weight: bold;
            }

            .stats-section, .challenges-section, .battle-pass-section {
                margin-bottom: 30px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
            }

            .stats-section h3, .challenges-section h3, .battle-pass-section h3 {
                margin-top: 0;
                color: #ffd700;
                border-bottom: 1px solid rgba(255, 215, 0, 0.3);
                padding-bottom: 10px;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
            }

            .stat-label {
                font-size: 10px;
                opacity: 0.8;
            }

            .stat-value {
                font-size: 12px;
                font-weight: bold;
                color: #4ecdc4;
            }

            .challenge-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                margin-bottom: 10px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                border-left: 4px solid #ffa502;
            }

            .challenge-item.completed {
                border-left-color: #2ed573;
                background: rgba(46, 213, 115, 0.1);
            }

            .challenge-info {
                flex: 1;
            }

            .challenge-name {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 5px;
            }

            .challenge-desc {
                font-size: 10px;
                opacity: 0.8;
                margin-bottom: 5px;
            }

            .challenge-progress {
                font-size: 10px;
                color: #ffa502;
            }

            .challenge-reward {
                font-size: 10px;
                color: #ffd700;
            }

            .claim-btn {
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                color: #000;
                border: none;
                padding: 8px 15px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 10px;
                font-weight: bold;
                transition: transform 0.2s;
            }

            .claim-btn:hover {
                transform: scale(1.05);
            }

            .claim-btn:disabled {
                background: #666;
                cursor: not-allowed;
                transform: none;
            }

            @media (max-width: 600px) {
                .progression-container {
                    width: 95vw;
                    max-height: 90vh;
                }

                .level-display {
                    flex-direction: column;
                    gap: 15px;
                }

                .stats-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.body.appendChild(style);
        document.body.appendChild(container);
    }

    setupEventListeners() {
        // Close button
        document.getElementById('close-progression').addEventListener('click', () => {
            this.hide();
        });

        // Click outside to close
        document.getElementById('progression-container').addEventListener('click', (e) => {
            if (e.target.id === 'progression-container') {
                this.hide();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    async loadStats() {
        try {
            const response = await fetch('/api/progression/stats', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.stats = data.stats;
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Failed to load progression stats:', error);
        }
    }

    updateUI() {
        if (!this.stats) return;

        // Update level and XP
        document.getElementById('player-level').textContent = this.stats.level;
        document.getElementById('xp-fill').style.width = `${(this.stats.xp / (this.stats.xp + this.stats.xpToNext)) * 100}%`;
        document.getElementById('xp-text').textContent = `${this.stats.xp} / ${this.stats.xp + this.stats.xpToNext} XP`;

        // Update next level rewards
        const nextLevel = this.stats.level + 1;
        const rewards = this.getLevelRewards(nextLevel);
        document.getElementById('next-rewards').innerHTML = this.formatRewards(rewards);

        // Update stats
        document.getElementById('stat-games-played').textContent = this.stats.gamesPlayed;
        document.getElementById('stat-win-rate').textContent = this.stats.winRate;
        document.getElementById('stat-current-streak').textContent = this.stats.currentWinStreak;
        document.getElementById('stat-best-streak').textContent = this.stats.bestWinStreak;
        document.getElementById('stat-caps-earned').textContent = this.stats.capsEarned;
        document.getElementById('stat-total-xp').textContent = this.stats.totalXp;

        // Update daily challenges
        this.updateChallenges();

        // Update battle pass
        this.updateBattlePass();
    }

    updateChallenges() {
        const container = document.getElementById('daily-challenges');
        container.innerHTML = '';

        this.stats.dailyChallenges.forEach(challenge => {
            const item = document.createElement('div');
            item.className = `challenge-item ${challenge.completed ? 'completed' : ''}`;

            const progressText = challenge.type === 'streak' ?
                `${challenge.progress}/${challenge.target} wins` :
                `${challenge.progress}/${challenge.target}`;

            item.innerHTML = `
                <div class="challenge-info">
                    <div class="challenge-name">${challenge.name}</div>
                    <div class="challenge-desc">${challenge.description}</div>
                    <div class="challenge-progress">${progressText}</div>
                    <div class="challenge-reward">Reward: ${challenge.reward.caps} CAPS, ${challenge.reward.xp} XP</div>
                </div>
                ${challenge.completed && !challenge.claimed ?
                    '<button class="claim-btn" data-challenge-id="' + challenge.id + '">Claim</button>' :
                    challenge.claimed ? '<span style="color: #2ed573; font-size: 10px;">✓ Claimed</span>' : ''}
            `;

            // Add claim button listener
            const claimBtn = item.querySelector('.claim-btn');
            if (claimBtn) {
                claimBtn.addEventListener('click', () => this.claimChallenge(challenge.id));
            }

            container.appendChild(item);
        });
    }

    updateBattlePass() {
        const container = document.getElementById('battle-pass-info');
        const bp = this.stats.battlePass;

        container.innerHTML = `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Tier ${bp.currentTier}/50</span>
                    <span>${bp.progressToNext.toFixed(1)}% to next</span>
                </div>
                <div style="width: 100%; height: 20px; background: rgba(255,255,255,0.2); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${bp.progressToNext}%; height: 100%; background: linear-gradient(90deg, #ffd700, #ffed4e); transition: width 0.3s ease;"></div>
                </div>
            </div>
            <div>
                <h4 style="margin: 10px 0; color: #ffd700;">Current Tier Rewards:</h4>
                <div style="font-size: 10px;">
                    <div>Free: ${bp.rewards.free.join(', ')}</div>
                    ${bp.rewards.premium.length > 0 ? '<div>Premium: ' + bp.rewards.premium.join(', ') + '</div>' : ''}
                    ${bp.rewards.ultimate.length > 0 ? '<div>Ultimate: ' + bp.rewards.ultimate.join(', ') + '</div>' : ''}
                </div>
            </div>
        `;
    }

    getLevelRewards(level) {
        const rewards = { caps: 0, cosmetics: [], titles: [] };

        if (level % 5 === 0) rewards.caps = level * 10;
        if (level >= 10) rewards.cosmetics.push('Silver Avatar Frame');
        if (level >= 25) rewards.cosmetics.push('Gold Avatar Frame');
        if (level >= 50) rewards.cosmetics.push('Diamond Avatar Frame');
        if (level >= 75) rewards.cosmetics.push('Legendary Avatar Frame');

        if (level >= 5) rewards.titles.push('Apprentice');
        if (level >= 15) rewards.titles.push('Skilled Player');
        if (level >= 30) rewards.titles.push('Expert');
        if (level >= 50) rewards.titles.push('Master');
        if (level >= 75) rewards.titles.push('Grandmaster');
        if (level >= 100) rewards.titles.push('Legend');

        return rewards;
    }

    formatRewards(rewards) {
        let html = '';
        if (rewards.caps > 0) html += `<div>${rewards.caps} CAPS</div>`;
        if (rewards.cosmetics.length > 0) html += `<div>Cosmetics: ${rewards.cosmetics.join(', ')}</div>`;
        if (rewards.titles.length > 0) html += `<div>Titles: ${rewards.titles.join(', ')}</div>`;
        return html || 'No rewards';
    }

    async claimChallenge(challengeId) {
        try {
            const response = await fetch('/api/progression/claim-challenge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ challengeId })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Show reward notification
                    this.showRewardNotification(data.rewards);
                    // Reload stats
                    await this.loadStats();
                }
            }
        } catch (error) {
            console.error('Failed to claim challenge:', error);
        }
    }

    showRewardNotification(rewards) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #000;
            padding: 15px 20px;
            border-radius: 10px;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `
            🎉 Rewards Claimed!<br>
            +${rewards.caps} CAPS<br>
            +${rewards.xp} XP
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getAuthToken() {
        // Get token from wherever it's stored (localStorage, etc.)
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    show() {
        const container = document.getElementById('progression-container');
        if (container) {
            container.classList.remove('hidden');
            this.isVisible = true;
            this.loadStats(); // Refresh data when shown
        }
    }

    hide() {
        const container = document.getElementById('progression-container');
        if (container) {
            container.classList.add('hidden');
            this.isVisible = false;
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.progressionClient = new ProgressionClient();
});

// Add CSS animations
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(animationStyle);