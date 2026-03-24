/**
 * Leaderboard UI Component
 * Beautiful, responsive leaderboard display
 */

class LeaderboardUI {
    constructor() {
        this.createModal();
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'leaderboardModal';
        modal.className = 'leaderboard-modal';
        modal.innerHTML = `
            <style>
                .leaderboard-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 10000;
                    backdrop-filter: blur(10px);
                }
                
                .leaderboard-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 900px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                }
                
                .leaderboard-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .leaderboard-header h2 {
                    color: #fff;
                    font-size: 36px;
                    margin: 0 0 10px 0;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                }
                
                .leaderboard-tabs {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-bottom: 20px;
                }
                
                .leaderboard-tab {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    padding: 10px 20px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .leaderboard-tab:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }
                
                .leaderboard-tab.active {
                    background: #fff;
                    color: #1e3c72;
                    border-color: #fff;
                }
                
                .leaderboard-content {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 15px;
                    padding: 20px;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .leaderboard-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .leaderboard-table th {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    padding: 15px;
                    text-align: left;
                    font-size: 14px;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .leaderboard-table td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #eee;
                }
                
                .leaderboard-table tr:hover {
                    background: #f5f5f5;
                }
                
                .rank-badge {
                    display: inline-block;
                    width: 30px;
                    height: 30px;
                    line-height: 30px;
                    text-align: center;
                    border-radius: 50%;
                    font-weight: bold;
                }
                
                .rank-1 { background: linear-gradient(135deg, #FFD700, #FFA500); color: #fff; }
                .rank-2 { background: linear-gradient(135deg, #C0C0C0, #808080); color: #fff; }
                .rank-3 { background: linear-gradient(135deg, #CD7F32, #8B4513); color: #fff; }
                .rank-other { background: #e0e0e0; color: #666; }
                
                .player-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .player-avatar {
                    font-size: 24px;
                }
                
                .player-name {
                    font-weight: bold;
                    color: #333;
                }
                
                .score-value {
                    font-size: 18px;
                    font-weight: bold;
                    color: #667eea;
                }
                
                .token-value {
                    color: #f39c12;
                    font-weight: bold;
                }
                
                .close-button {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid #fff;
                    color: #fff;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .close-button:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: rotate(90deg);
                }
                
                .loading-spinner {
                    text-align: center;
                    padding: 40px;
                    color: #667eea;
                    font-size: 18px;
                }
                
                .game-selector {
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .game-selector select {
                    padding: 10px 20px;
                    border-radius: 10px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    font-size: 16px;
                    cursor: pointer;
                }
                
                .user-stats {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: #fff;
                    padding: 20px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-around;
                }
                
                .stat-item {
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 32px;
                    font-weight: bold;
                    display: block;
                }
                
                .stat-label {
                    font-size: 12px;
                    opacity: 0.9;
                    margin-top: 5px;
                }
            </style>
            
            <div class="leaderboard-container">
                <button class="close-button" onclick="window.leaderboardUI.hide()">×</button>
                
                <div class="leaderboard-header">
                    <h2>🏆 Leaderboard</h2>
                    <div class="leaderboard-tabs">
                        <button class="leaderboard-tab active" data-tab="global" onclick="window.leaderboardUI.switchTab('global')">
                            Global Top Players
                        </button>
                        <button class="leaderboard-tab" data-tab="game" onclick="window.leaderboardUI.switchTab('game')">
                            Game Rankings
                        </button>
                        <button class="leaderboard-tab" data-tab="stats" onclick="window.leaderboardUI.switchTab('stats')">
                            My Stats
                        </button>
                    </div>
                </div>
                
                <div id="leaderboardContent" class="leaderboard-content">
                    <div class="loading-spinner">Loading...</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
    }
    
    async show(tab = 'global', gameId = null) {
        this.modal.style.display = 'block';
        this.currentTab = tab;
        this.currentGameId = gameId;
        await this.loadContent();
    }
    
    hide() {
        this.modal.style.display = 'none';
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab styles
        this.modal.querySelectorAll('.leaderboard-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        this.loadContent();
    }
    
    async loadContent() {
        const content = this.modal.querySelector('#leaderboardContent');
        content.innerHTML = '<div class="loading-spinner">⏳ Loading...</div>';
        
        try {
            if (this.currentTab === 'global') {
                await this.loadGlobalLeaderboard();
            } else if (this.currentTab === 'game') {
                await this.loadGameLeaderboard();
            } else if (this.currentTab === 'stats') {
                await this.loadUserStats();
            }
        } catch (error) {
            console.error('Leaderboard load error:', error);
            content.innerHTML = '<div class="loading-spinner">❌ Failed to load data</div>';
        }
    }
    
    async loadGlobalLeaderboard() {
        const leaderboard = await window.globalLeaderboard.getGlobalLeaderboard(100);
        const content = this.modal.querySelector('#leaderboardContent');
        
        content.innerHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Total Score</th>
                        <th>Games Played</th>
                        <th>Tokens Earned</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.map((entry, index) => `
                        <tr>
                            <td><span class="rank-badge rank-${index < 3 ? index + 1 : 'other'}">${index + 1}</span></td>
                            <td>
                                <div class="player-info">
                                    <span class="player-avatar">${this._escapeHtml(entry.userAvatar || '👤')}</span>
                                    <span class="player-name">${this._escapeHtml(entry.userName || 'Anonymous')}</span>
                                </div>
                            </td>
                            <td><span class="score-value">${entry.totalScore.toLocaleString()}</span></td>
                            <td>${entry.gamesPlayed}</td>
                            <td><span class="token-value">🪙 ${entry.tokensEarned}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    async loadGameLeaderboard() {
        const content = this.modal.querySelector('#leaderboardContent');
        
        // Add game selector
        const games = window.globalLeaderboard.games;
        const gameNames = {
            'monster-rampage': 'Monster Rampage',
            'contra-commando': 'Contra Commando',
            'sky-ace-combat': 'Sky Ace Combat',
            'mega-heroes': 'Mega Heroes',
            'tournament-fighters': 'Tournament Fighters',
            'brain-academy': 'Brain Academy',
            'reflex-master': 'Reflex Master',
            'brain-age': 'Brain Age',
            'dragon-fist': 'Dragon Fist',
            'street-brawlers': 'Street Brawlers'
        };
        
        const selectedGame = this.currentGameId || games[0];
        
        content.innerHTML = `
            <div class="game-selector">
                <select onchange="window.leaderboardUI.currentGameId = this.value; window.leaderboardUI.loadGameLeaderboard();">
                    ${games.map(game => `
                        <option value="${game}" ${game === selectedGame ? 'selected' : ''}>
                            ${gameNames[game] || game}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="loading-spinner">⏳ Loading...</div>
        `;
        
        const leaderboard = await window.globalLeaderboard.getGameLeaderboard(selectedGame, 100);
        
        content.innerHTML = `
            <div class="game-selector">
                <select onchange="window.leaderboardUI.currentGameId = this.value; window.leaderboardUI.loadGameLeaderboard();">
                    ${games.map(game => `
                        <option value="${game}" ${game === selectedGame ? 'selected' : ''}>
                            ${gameNames[game] || game}
                        </option>
                    `).join('')}
                </select>
            </div>
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.length > 0 ? leaderboard.map((entry, index) => `
                        <tr>
                            <td><span class="rank-badge rank-${index < 3 ? index + 1 : 'other'}">${index + 1}</span></td>
                            <td>
                                <div class="player-info">
                                    <span class="player-avatar">${this._escapeHtml(entry.userAvatar || '👤')}</span>
                                    <span class="player-name">${this._escapeHtml(entry.userName || 'Anonymous')}</span>
                                </div>
                            </td>
                            <td><span class="score-value">${entry.score.toLocaleString()}</span></td>
                            <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="4" style="text-align: center; padding: 40px;">No scores yet. Be the first!</td></tr>'}
                </tbody>
            </table>
        `;
    }
    
    async loadUserStats() {
        const user = window.universalAuth?.getUser();
        if (!user) {
            const content = this.modal.querySelector('#leaderboardContent');
            content.innerHTML = '<div class="loading-spinner">Please log in to view your stats</div>';
            return;
        }
        
        const stats = await window.globalLeaderboard.getUserStats(user.id);
        const content = this.modal.querySelector('#leaderboardContent');
        
        content.innerHTML = `
            <div class="user-stats">
                <div class="stat-item">
                    <span class="stat-value">${stats.totalGames}</span>
                    <div class="stat-label">Games Played</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.totalScore.toLocaleString()}</span>
                    <div class="stat-label">Total Score</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">🪙 ${stats.totalTokens}</span>
                    <div class="stat-label">Tokens Earned</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${Math.round(stats.averageScore)}</span>
                    <div class="stat-label">Avg Score</div>
                </div>
            </div>
            
            <h3 style="margin: 20px 0 10px 0; color: #333;">Game Breakdown</h3>
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Game</th>
                        <th>Plays</th>
                        <th>High Score</th>
                        <th>Avg Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(stats.gameBreakdown).map(([game, data]) => `
                        <tr>
                            <td>${game}</td>
                            <td>${data.plays}</td>
                            <td><span class="score-value">${data.highScore.toLocaleString()}</span></td>
                            <td>${Math.round(data.avgScore)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Escape HTML special characters to prevent XSS when rendering
     * server-supplied strings into innerHTML.
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

// Initialize global leaderboard UI
window.leaderboardUI = new LeaderboardUI();

// Add keyboard shortcut to open leaderboard
document.addEventListener('keydown', (e) => {
    if (e.key === 'L' && e.shiftKey) {
        window.leaderboardUI.show();
    }
});
