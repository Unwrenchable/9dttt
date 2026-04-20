/**
 * Universal Game Polish System
 * Visual effects, sound hooks, pause menus, tutorials, and performance
 */

class GamePolishSystem {
    constructor(game) {
        this.game = game;
        this.particles = new ParticleSystem();
        this.screenEffects = new ScreenEffectsSystem();
        this.soundManager = new SoundManager();
        this.pauseMenu = new PauseMenuSystem(game);
        this.tutorialSystem = new TutorialSystem();
        this.performanceMonitor = new PerformanceMonitor();
    }
}

// ==================== PARTICLE SYSTEM ====================

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }
    
    emit(type, x, y, options = {}) {
        const particle = this.createParticle(type, x, y, options);
        this.particles.push(particle);
        
        // Limit total particles
        if (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }
        
        return particle;
    }
    
    createParticle(type, x, y, options) {
        const templates = {
            'hit': {
                size: 8,
                color: '#FFD700',
                life: 0.5,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                fadeOut: true
            },
            'blood': {
                size: 6,
                color: '#DC143C',
                life: 1,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -5,
                gravity: 0.3,
                fadeOut: true
            },
            'explosion': {
                size: 20,
                color: '#FF4500',
                life: 0.3,
                vx: 0,
                vy: 0,
                growSpeed: 50,
                fadeOut: true
            },
            'spark': {
                size: 4,
                color: '#FFA500',
                life: 0.4,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                trail: true
            },
            'smoke': {
                size: 12,
                color: '#808080',
                life: 2,
                vx: (Math.random() - 0.5) * 2,
                vy: -2,
                growSpeed: 10,
                fadeOut: true
            },
            'powerup': {
                size: 10,
                color: '#00FF00',
                life: 1.5,
                vx: 0,
                vy: -2,
                sine: true,
                glow: true
            }
        };
        
        const template = templates[type] || templates['hit'];
        
        return {
            type,
            x, y,
            vx: options.vx || template.vx,
            vy: options.vy || template.vy,
            size: options.size || template.size,
            color: options.color || template.color,
            life: options.life || template.life,
            maxLife: options.life || template.life,
            fadeOut: template.fadeOut,
            gravity: template.gravity || 0,
            growSpeed: template.growSpeed || 0,
            trail: template.trail,
            sine: template.sine,
            glow: template.glow,
            sineOffset: Math.random() * Math.PI * 2
        };
    }
    
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx * deltaTime * 60;
            p.y += p.vy * deltaTime * 60;
            
            // Apply gravity
            if (p.gravity) {
                p.vy += p.gravity * deltaTime * 60;
            }
            
            // Sine wave motion
            if (p.sine) {
                p.x += Math.sin(p.sineOffset) * 2;
                p.sineOffset += deltaTime * 5;
            }
            
            // Grow
            if (p.growSpeed) {
                p.size += p.growSpeed * deltaTime;
            }
            
            // Decrease life
            p.life -= deltaTime;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(ctx, camera = { x: 0, y: 0 }) {
        for (const p of this.particles) {
            ctx.save();
            
            // Opacity based on life
            if (p.fadeOut) {
                ctx.globalAlpha = p.life / p.maxLife;
            }
            
            // Glow effect
            if (p.glow) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
            }
            
            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;
            
            // Trail effect
            if (p.trail) {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX - p.vx * 2, screenY - p.vy * 2);
                ctx.stroke();
            } else {
                // Regular particle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    clear() {
        this.particles = [];
    }
}

// ==================== SCREEN EFFECTS ====================

class ScreenEffectsSystem {
    constructor() {
        this.effects = [];
        this.chromatic = 0;
        this.flash = 0;
        this.shake = { x: 0, y: 0, intensity: 0 };
        this.slowMotion = 1.0;
        this.zoom = 1.0;
    }
    
    screenShake(intensity = 5, duration = 0.3) {
        this.shake = {
            intensity: intensity,
            duration: duration,
            timer: duration,
            x: 0,
            y: 0
        };
    }
    
    flash(color = '#FFFFFF', intensity = 0.8, duration = 0.1) {
        this.effects.push({
            type: 'flash',
            color: color,
            intensity: intensity,
            duration: duration,
            timer: duration
        });
    }
    
    chromaticAberration(intensity = 5, duration = 0.2) {
        this.chromatic = intensity;
        setTimeout(() => { this.chromatic = 0; }, duration * 1000);
    }
    
    slowMo(factor = 0.3, duration = 1) {
        this.slowMotion = factor;
        setTimeout(() => { this.slowMotion = 1.0; }, duration * 1000);
    }
    
    zoomPunch(intensity = 0.1, duration = 0.2) {
        this.zoom = 1 + intensity;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed < duration) {
                this.zoom = 1 + intensity * (1 - elapsed / duration);
                requestAnimationFrame(animate);
            } else {
                this.zoom = 1;
            }
        };
        animate();
    }
    
    update(deltaTime) {
        // Update shake
        if (this.shake.timer > 0) {
            this.shake.timer -= deltaTime;
            const factor = this.shake.timer / this.shake.duration;
            this.shake.x = (Math.random() - 0.5) * this.shake.intensity * factor;
            this.shake.y = (Math.random() - 0.5) * this.shake.intensity * factor;
        } else {
            this.shake.x = 0;
            this.shake.y = 0;
        }
        
        // Update effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.timer -= deltaTime;
            
            if (effect.timer <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    apply(ctx, canvas) {
        ctx.save();
        
        // Apply shake
        ctx.translate(this.shake.x, this.shake.y);
        
        // Apply zoom
        if (this.zoom !== 1) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(this.zoom, this.zoom);
            ctx.translate(-centerX, -centerY);
        }
        
        return () => {
            ctx.restore();
            
            // Apply flash
            for (const effect of this.effects) {
                if (effect.type === 'flash') {
                    const alpha = (effect.timer / effect.duration) * effect.intensity;
                    ctx.fillStyle = effect.color;
                    ctx.globalAlpha = alpha;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1;
                }
            }
        };
    }
    
    getSlowMotion() {
        return this.slowMotion;
    }
}

// ==================== SOUND MANAGER ====================

class SoundManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.7;
        this.muted = false;
        this.audioContext = null;
        
        // Initialize Web Audio API
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (AudioContext || webkitAudioContext)();
        }
    }
    
    // Generate simple sound effects
    play(type, options = {}) {
        if (this.muted || !this.audioContext) return;
        
        const sounds = {
            'hit': () => this.generateHitSound(),
            'jump': () => this.generateJumpSound(),
            'shoot': () => this.generateShootSound(),
            'powerup': () => this.generatePowerupSound(),
            'explosion': () => this.generateExplosionSound(),
            'coin': () => this.generateCoinSound(),
            'death': () => this.generateDeathSound()
        };
        
        if (sounds[type]) {
            sounds[type]();
        }
    }
    
    generateHitSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
    }
    
    generateJumpSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.15);
    }
    
    generateShootSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
        
        gainNode.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.08);
    }
    
    generatePowerupSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
    }
    
    generateExplosionSound() {
        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        
        source.buffer = buffer;
        gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start();
    }
    
    generateCoinSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(988, ctx.currentTime);
        oscillator.frequency.setValueAtTime(1319, ctx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.2);
    }
    
    generateDeathSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}

// ==================== PAUSE MENU ====================

class PauseMenuSystem {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.createMenu();
    }
    
    createMenu() {
        const menu = document.createElement('div');
        menu.id = 'pauseMenu';
        menu.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            align-items: center;
            justify-content: center;
        `;
        
        menu.innerHTML = `
            <div style="text-align: center; color: #fff;">
                <h1 style="font-size: 48px; margin-bottom: 40px;">PAUSED</h1>
                <div style="display: flex; flex-direction: column; gap: 15px; max-width: 300px;">
                    <button onclick="window.pauseMenu.resume()" class="pause-btn">Continue</button>
                    <button onclick="window.pauseMenu.restart()" class="pause-btn">Restart</button>
                    <button onclick="window.pauseMenu.options()" class="pause-btn">Options</button>
                    <button onclick="window.pauseMenu.quit()" class="pause-btn">Main Menu</button>
                </div>
                <p style="margin-top: 40px; opacity: 0.6;">Press ESC to resume</p>
            </div>
            <style>
                .pause-btn {
                    padding: 15px 30px;
                    font-size: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: #fff;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .pause-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                }
            </style>
        `;
        
        document.body.appendChild(menu);
        this.menu = menu;
        window.pauseMenu = this;
    }
    
    show() {
        this.visible = true;
        this.menu.style.display = 'flex';
        if (this.game) this.game.state = 'paused';
    }
    
    hide() {
        this.visible = false;
        this.menu.style.display = 'none';
    }
    
    resume() {
        this.hide();
        if (this.game) this.game.state = 'playing';
    }
    
    restart() {
        this.hide();
        if (this.game && this.game.startGame) {
            this.game.startGame(this.game.numPlayers || 1);
        }
    }
    
    options() {
        window.gamepadConfig?.show();
    }
    
    quit() {
        if (confirm('Return to main menu?')) {
            window.location.href = '../index.html';
        }
    }
}

// ==================== TUTORIAL SYSTEM ====================

class TutorialSystem {
    constructor() {
        this.tips = [];
        this.currentTip = null;
        this.shown = new Set();
        this.activeTutorial = null;
        this.tutorialSteps = [];
        this.currentStepIndex = 0;
        this.overlay = null;
        this.highlightElement = null;
    }
    
    addTip(id, text, trigger = 'auto', duration = 5) {
        this.tips.push({ id, text, trigger, duration });
    }
    
    /**
     * Start an interactive tutorial
     */
    startTutorial(tutorialId, steps) {
        if (this.activeTutorial) {
            this.endTutorial();
        }
        
        this.activeTutorial = tutorialId;
        this.tutorialSteps = steps;
        this.currentStepIndex = 0;
        
        this.createTutorialOverlay();
        this.showTutorialStep(0);
    }
    
    /**
     * Create tutorial overlay
     */
    createTutorialOverlay() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9997;
            pointer-events: none;
        `;
        document.body.appendChild(this.overlay);
        
        // Create tutorial panel
        const panel = document.createElement('div');
        panel.id = 'tutorial-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a1a;
            color: #fff;
            padding: 25px;
            border-radius: 15px;
            border: 3px solid #FFD700;
            z-index: 9998;
            max-width: 600px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.5s;
        `;
        document.body.appendChild(panel);
        
        // Add navigation buttons
        const navDiv = document.createElement('div');
        navDiv.style.cssText = `
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Previous';
        prevBtn.style.cssText = `
            background: #333;
            color: #fff;
            border: 2px solid #666;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        `;
        prevBtn.onclick = () => this.previousStep();
        
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';
        nextBtn.style.cssText = `
            background: #FFD700;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        `;
        nextBtn.onclick = () => this.nextStep();
        
        const skipBtn = document.createElement('button');
        skipBtn.textContent = 'Skip Tutorial';
        skipBtn.style.cssText = `
            background: transparent;
            color: #999;
            border: none;
            cursor: pointer;
            font-size: 12px;
            text-decoration: underline;
        `;
        skipBtn.onclick = () => this.endTutorial();
        
        navDiv.appendChild(prevBtn);
        navDiv.appendChild(skipBtn);
        navDiv.appendChild(nextBtn);
        
        panel.appendChild(navDiv);
        this.panel = panel;
    }
    
    /**
     * Show a specific tutorial step
     */
    showTutorialStep(stepIndex) {
        if (!this.tutorialSteps[stepIndex]) return;
        
        const step = this.tutorialSteps[stepIndex];
        const panel = this.panel;
        
        // Clear previous content
        const contentDiv = panel.querySelector('.tutorial-content') || document.createElement('div');
        contentDiv.className = 'tutorial-content';
        contentDiv.innerHTML = '';
        
        // Add step content
        const title = document.createElement('h3');
        title.textContent = step.title;
        title.style.cssText = `
            margin: 0 0 15px 0;
            color: #FFD700;
            font-size: 18px;
        `;
        
        const description = document.createElement('p');
        description.textContent = step.description;
        description.style.cssText = `
            margin: 0 0 15px 0;
            line-height: 1.5;
        `;
        
        contentDiv.appendChild(title);
        contentDiv.appendChild(description);
        
        // Insert content before navigation
        const navDiv = panel.querySelector('div');
        panel.insertBefore(contentDiv, navDiv);
        
        // Highlight target element if specified
        this.highlightElement(step.target);
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Trigger visual effect if available
        if (step.effect && window.visualEffects) {
            this.triggerTutorialEffect(step.effect);
        }
    }
    
    /**
     * Highlight a target element
     */
    highlightElement(selector) {
        if (!selector) {
            if (this.highlightElement) {
                this.highlightElement.remove();
                this.highlightElement = null;
            }
            return;
        }
        
        const element = document.querySelector(selector);
        if (!element) return;
        
        // Remove previous highlight
        if (this.highlightElement) {
            this.highlightElement.remove();
        }
        
        // Create highlight
        this.highlightElement = document.createElement('div');
        this.highlightElement.style.cssText = `
            position: absolute;
            background: rgba(255, 215, 0, 0.3);
            border: 3px solid #FFD700;
            border-radius: 8px;
            z-index: 9996;
            pointer-events: none;
            animation: pulse 2s infinite;
        `;
        
        const rect = element.getBoundingClientRect();
        this.highlightElement.style.left = rect.left - 10 + 'px';
        this.highlightElement.style.top = rect.top - 10 + 'px';
        this.highlightElement.style.width = rect.width + 20 + 'px';
        this.highlightElement.style.height = rect.height + 20 + 'px';
        
        document.body.appendChild(this.highlightElement);
    }
    
    /**
     * Trigger tutorial visual effect
     */
    triggerTutorialEffect(effect) {
        if (!window.visualEffects) return;
        
        const canvas = window.visualEffects.canvas;
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        
        switch (effect) {
            case 'welcome':
                window.visualEffects.createParticleExplosion(x, y, '#FFD700', 30, 1.0);
                break;
            case 'highlight':
                window.visualEffects.createEnergyPulse(x, y, '#00FF88', 2);
                break;
            case 'celebrate':
                window.visualEffects.createWinCelebration(x, y);
                break;
        }
    }
    
    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        const prevBtn = this.panel.querySelector('button:first-child');
        const nextBtn = this.panel.querySelector('button:nth-child(3)');
        
        prevBtn.disabled = this.currentStepIndex === 0;
        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        
        const isLastStep = this.currentStepIndex === this.tutorialSteps.length - 1;
        nextBtn.textContent = isLastStep ? 'Finish Tutorial' : 'Next →';
        nextBtn.onclick = () => isLastStep ? this.endTutorial() : this.nextStep();
    }
    
    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStepIndex < this.tutorialSteps.length - 1) {
            this.currentStepIndex++;
            this.showTutorialStep(this.currentStepIndex);
        }
    }
    
    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.showTutorialStep(this.currentStepIndex);
        }
    }
    
    /**
     * End the current tutorial
     */
    endTutorial() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        if (this.highlightElement) {
            this.highlightElement.remove();
            this.highlightElement = null;
        }
        
        this.activeTutorial = null;
        this.tutorialSteps = [];
        this.currentStepIndex = 0;
        
        // Mark tutorial as completed
        if (this.activeTutorial) {
            localStorage.setItem(`tutorial_${this.activeTutorial}_completed`, 'true');
        }
    }
    
    /**
     * Check if tutorial has been completed
     */
    isTutorialCompleted(tutorialId) {
        return localStorage.getItem(`tutorial_${tutorialId}_completed`) === 'true';
    }
    
    showTip(text, duration = 5) {
        const tip = document.createElement('div');
        tip.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 20px 30px;
            border-radius: 10px;
            border: 2px solid #FFD700;
            z-index: 9998;
            animation: slideUp 0.5s;
            max-width: 500px;
            text-align: center;
        `;
        
        tip.innerHTML = `<p style="margin: 0;">${text}</p>`;
        document.body.appendChild(tip);
        
        setTimeout(() => {
            tip.remove();
        }, duration * 1000);
    }
    
    checkTrigger(trigger, context = {}) {
        const tip = this.tips.find(t => t.trigger === trigger && !this.shown.has(t.id));
        if (tip) {
            this.showTip(tip.text, tip.duration);
            this.shown.set(tip.id);
        }
    }
}

// ==================== PERFORMANCE MONITOR ====================

class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.visible = false;
        this.createDisplay();
    }
    
    createDisplay() {
        const display = document.createElement('div');
        display.id = 'perfMonitor';
        display.style.cssText = `
            display: none;
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            border-radius: 5px;
        `;
        document.body.appendChild(display);
        this.display = display;
    }
    
    update() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= this.lastTime + 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            if (this.visible) {
                this.render();
            }
        }
    }
    
    render() {
        const fpsColor = this.fps >= 55 ? '#0f0' : this.fps >= 30 ? '#ff0' : '#f00';
        this.display.innerHTML = `
            <div>FPS: <span style="color: ${fpsColor}">${this.fps}</span></div>
            <div>Memory: ${(performance.memory?.usedJSHeapSize / 1048576)?.toFixed(1)}MB</div>
        `;
    }
    
    toggle() {
        this.visible = !this.visible;
        this.display.style.display = this.visible ? 'block' : 'none';
    }
}

// ==================== GAME POLISH UTILITY ====================

/**
 * GamePolish — lightweight utility namespace for one-off polish helpers.
 * Separate from GamePolishSystem so it can be used without instantiating
 * the full per-game system.
 */
const GamePolish = {
    /**
     * Finds all start-game buttons on the page and wires up a click handler
     * that immediately snaps the canvas to the full viewport via
     * MobileGameAdapter.snapToViewport() (exposed as window.snapGameToViewport).
     * This supplements the RAF-patch approach for instant visual feedback.
     */
    enhanceStartButtons() {
        const selector = '.controls button, button[onclick*="startGame"], button[onclick*="start("]';
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(btn => {
            btn.addEventListener('click', function onStartClick() {
                if (typeof window.snapGameToViewport === 'function') {
                    window.snapGameToViewport();
                }
            }, { passive: true });
        });
        return buttons.length; // Return count for debugging
    }
};

// Export
window.GamePolish = GamePolish;
window.GamePolishSystem = GamePolishSystem;
window.ParticleSystem = ParticleSystem;
window.ScreenEffectsSystem = ScreenEffectsSystem;
window.SoundManager = SoundManager;
window.PauseMenuSystem = PauseMenuSystem;
window.TutorialSystem = TutorialSystem;
window.PerformanceMonitor = PerformanceMonitor;

// Add keyboard shortcut for performance monitor
document.addEventListener('keydown', (e) => {
    if (e.key === 'P' && e.shiftKey) {
        if (!window.perfMonitor) {
            window.perfMonitor = new PerformanceMonitor();
        }
        window.perfMonitor.toggle();
    }
});
