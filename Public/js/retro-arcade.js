/**
 * Retro Arcade Features
 * 8-bit sounds, high scores, CRT effects, and more
 */

class RetroArcade {
    constructor() {
        this.audioContext = null;
        this.highScores = [];
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.setupAudio();
        this.loadHighScores();
        this.setupInsertCoin();
        this.setupCRTToggle();
        this.initParentControls();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('retroArcadeSettings');
            return saved ? JSON.parse(saved) : {
                soundEnabled: true,
                crtEnabled: false,
                limitedColors: false,
                monochrome: false,
                timeLimit: 0, // 0 = no limit, otherwise minutes
                timePlayed: 0
            };
        } catch {
            return {
                soundEnabled: true,
                crtEnabled: false,
                limitedColors: false,
                monochrome: false,
                timeLimit: 0,
                timePlayed: 0
            };
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('retroArcadeSettings', JSON.stringify(this.settings));
        } catch {
            console.warn('Could not save settings');
        }
    }

    /**
     * Setup Web Audio API for 8-bit sounds
     */
    setupAudio() {
        // Create audio context on first user interaction
        const initAudio = () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                } catch {
                    console.warn('Web Audio API not supported');
                }
            }
        };

        // { once: true } automatically removes the listener after first execution
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });
    }

    /**
     * Play 8-bit style sound effect
     */
    playSound(type = 'select') {
        if (!this.settings.soundEnabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'select':
                // Short blip sound
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(440, now);
                oscillator.frequency.setValueAtTime(880, now + 0.05);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'navigate':
                // Tick sound
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(220, now);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                oscillator.start(now);
                oscillator.stop(now + 0.05);
                break;

            case 'coin':
                // Coin insert sound (ascending notes)
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(523, now);
                oscillator.frequency.setValueAtTime(659, now + 0.08);
                oscillator.frequency.setValueAtTime(784, now + 0.16);
                oscillator.frequency.setValueAtTime(1047, now + 0.24);
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.setValueAtTime(0.12, now + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;

            case 'start':
                // Game start fanfare
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(262, now);
                oscillator.frequency.setValueAtTime(330, now + 0.1);
                oscillator.frequency.setValueAtTime(392, now + 0.2);
                oscillator.frequency.setValueAtTime(523, now + 0.3);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.setValueAtTime(0.15, now + 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                oscillator.start(now);
                oscillator.stop(now + 0.6);
                break;

            case 'win':
                // Victory jingle
                this.playWinJingle();
                return;

            case 'lose':
                // Sad descending notes
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, now);
                oscillator.frequency.linearRampToValueAtTime(110, now + 0.5);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
        }
    }

    /**
     * Play victory jingle (multiple notes)
     */
    playWinJingle() {
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const notes = [523, 659, 784, 1047, 784, 1047];
        const durations = [0.1, 0.1, 0.1, 0.2, 0.1, 0.3];
        let time = ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
            osc.start(time);
            osc.stop(time + durations[i]);
            time += durations[i];
        });
    }

    /**
     * Load high scores from localStorage
     */
    loadHighScores() {
        try {
            const saved = localStorage.getItem('retroArcadeHighScores');
            this.highScores = saved ? JSON.parse(saved) : this.getDefaultHighScores();
        } catch {
            this.highScores = this.getDefaultHighScores();
        }
        this.updateHighScoreDisplay();
    }

    /**
     * Get default placeholder high scores
     */
    getDefaultHighScores() {
        return [
            { name: 'AAA', score: 999999 },
            { name: 'BBB', score: 888888 },
            { name: 'CCC', score: 777777 },
            { name: 'DDD', score: 666666 },
            { name: 'EEE', score: 555555 }
        ];
    }

    /**
     * Add a new high score
     */
    addHighScore(name, score) {
        name = (name || 'AAA').toUpperCase().substring(0, 3);
        this.highScores.push({ name, score });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10);
        
        try {
            localStorage.setItem('retroArcadeHighScores', JSON.stringify(this.highScores));
        } catch {
            console.warn('Could not save high scores');
        }
        
        this.updateHighScoreDisplay();
        return this.highScores.findIndex(h => h.name === name && h.score === score) + 1;
    }

    /**
     * Update high score display in DOM
     */
    updateHighScoreDisplay() {
        const list = document.getElementById('high-score-list');
        if (!list) return;

        const ranks = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH'];
        
        list.innerHTML = this.highScores.slice(0, 5).map((score, i) => `
            <li class="high-score-item">
                <span class="high-score-rank">${ranks[i]}</span>
                <span class="high-score-name">${this._escapeHtml(score.name)}</span>
                <span class="high-score-score">${Number(score.score).toLocaleString()}</span>
            </li>
        `).join('');
    }

    /**
     * Setup insert coin animation
     */
    setupInsertCoin() {
        const coinElement = document.getElementById('insert-coin');
        if (!coinElement) return;

        // Make it clickable to play sound
        coinElement.addEventListener('click', () => {
            this.playSound('coin');
            coinElement.classList.add('clicked');
            setTimeout(() => coinElement.classList.remove('clicked'), 500);
        });

        // Also respond to gamepad (only add listener once)
        if (window.gamepadManager && !this.gamepadCoinListenerAdded) {
            this.gamepadCoinListenerAdded = true;
            window.gamepadManager.on('buttondown', (data) => {
                if (data.button === 'a' || data.button === 'start') {
                    this.playSound('coin');
                }
            });
        }
    }

    /**
     * Setup CRT filter toggle
     */
    setupCRTToggle() {
        // Apply saved CRT setting
        if (this.settings.crtEnabled) {
            document.body.classList.add('crt-effect');
        }
        if (this.settings.limitedColors) {
            document.body.classList.add('limited-colors');
        }
        if (this.settings.monochrome) {
            document.body.classList.add('monochrome');
        }
    }

    /**
     * Toggle CRT scanlines effect
     */
    toggleCRT(enabled = null) {
        if (enabled === null) {
            this.settings.crtEnabled = !this.settings.crtEnabled;
        } else {
            this.settings.crtEnabled = enabled;
        }
        
        document.body.classList.toggle('crt-effect', this.settings.crtEnabled);
        this.saveSettings();
        return this.settings.crtEnabled;
    }

    /**
     * Toggle limited color palette
     */
    toggleLimitedColors(enabled = null) {
        if (enabled === null) {
            this.settings.limitedColors = !this.settings.limitedColors;
        } else {
            this.settings.limitedColors = enabled;
        }
        
        document.body.classList.toggle('limited-colors', this.settings.limitedColors);
        this.saveSettings();
        return this.settings.limitedColors;
    }

    /**
     * Toggle monochrome mode
     */
    toggleMonochrome(enabled = null) {
        if (enabled === null) {
            this.settings.monochrome = !this.settings.monochrome;
        } else {
            this.settings.monochrome = enabled;
        }
        
        document.body.classList.toggle('monochrome', this.settings.monochrome);
        this.saveSettings();
        return this.settings.monochrome;
    }

    /**
     * Parent Controls - Time Limit Feature
     */
    initParentControls() {
        // Check for time limit
        if (this.settings.timeLimit > 0) {
            this.startTimeTracking();
        }
    }

    /**
     * Set time limit (in minutes, 0 = no limit)
     */
    setTimeLimit(minutes) {
        this.settings.timeLimit = minutes;
        this.settings.timePlayed = 0;
        this.saveSettings();
        
        if (minutes > 0) {
            this.startTimeTracking();
        }
    }

    /**
     * Start tracking play time
     */
    startTimeTracking() {
        if (this.timeTracker) clearInterval(this.timeTracker);
        
        this.timeTracker = setInterval(() => {
            this.settings.timePlayed += 1; // Add 1 minute
            this.saveSettings();
            
            // Check if time limit reached
            if (this.settings.timeLimit > 0 && this.settings.timePlayed >= this.settings.timeLimit) {
                this.showTimeWarning();
            }
        }, 60000); // Check every minute
    }

    /**
     * Show time limit warning
     */
    showTimeWarning() {
        // Create warning overlay if it doesn't exist
        let warning = document.querySelector('.time-warning');
        if (!warning) {
            warning = document.createElement('div');
            warning.className = 'time-warning';
            warning.innerHTML = `
                <h2>⏰ TIME'S UP! ⏰</h2>
                <p>You've reached your play time limit.</p>
                <p>Time to take a break!</p>
            `;
            document.body.appendChild(warning);
        }
        
        warning.classList.add('show');
        this.playSound('lose');
        
        // Stop time tracking
        if (this.timeTracker) {
            clearInterval(this.timeTracker);
        }
    }

    /**
     * Reset time played (for parent to use)
     */
    resetTimePlayed() {
        this.settings.timePlayed = 0;
        this.saveSettings();
        
        const warning = document.querySelector('.time-warning');
        if (warning) {
            warning.classList.remove('show');
        }
        
        if (this.settings.timeLimit > 0) {
            this.startTimeTracking();
        }
    }

    /**
     * Get progress statistics for a player
     */
    getProgressStats() {
        try {
            const stats = localStorage.getItem('playerProgressStats');
            return stats ? JSON.parse(stats) : {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                streak: 0,
                bestStreak: 0,
                achievements: []
            };
        } catch {
            return {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                streak: 0,
                bestStreak: 0,
                achievements: []
            };
        }
    }

    /**
     * Update progress statistics
     */
    updateProgressStats(update) {
        const stats = this.getProgressStats();
        
        if (update.gamesPlayed) stats.gamesPlayed += update.gamesPlayed;
        if (update.gamesWon) {
            stats.gamesWon += update.gamesWon;
            stats.streak += update.gamesWon;
            if (stats.streak > stats.bestStreak) {
                stats.bestStreak = stats.streak;
            }
        }
        if (update.gameLost) {
            stats.streak = 0;
        }
        if (update.score) stats.totalScore += update.score;
        if (update.achievement && !stats.achievements.includes(update.achievement)) {
            stats.achievements.push(update.achievement);
        }
        
        try {
            localStorage.setItem('playerProgressStats', JSON.stringify(stats));
        } catch {
            console.warn('Could not save progress stats');
        }
        
        return stats;
    }

    /**
     * Escape HTML special characters to prevent XSS when rendering
     * localStorage-sourced strings into innerHTML.
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

// Create global instance
window.retroArcade = new RetroArcade();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RetroArcade;
}
