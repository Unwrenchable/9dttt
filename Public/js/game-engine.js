/**
 * Game Engine Core Module
 * Provides common utilities for all games with error handling
 * 
 * Features:
 * - Safe game loop with error recovery
 * - Frame-rate independent timing
 * - Gamepad input abstraction
 * - Common math utilities
 * - Performance monitoring
 * - Prevents page scrolling during gameplay
 * 
 * Part of the 9DTTT Game Library
 */

(function() {
    'use strict';
    
    // ==================== GLOBAL SCROLL PREVENTION ====================
    // Prevent arrow keys and space from scrolling the page when any game is active
    
    let gameActive = false;

    // All keys that browsers use to scroll the page
    const SCROLL_KEYS = new Set([
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Space', 'PageUp', 'PageDown', 'Home', 'End'
    ]);

    function preventGameKeyScroll(e) {
        if (!gameActive) return;
        if (!SCROLL_KEYS.has(e.code)) return;
        // Don't block input inside form elements
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
        e.preventDefault();
    }
    
    // Add global listener for scroll prevention
    window.addEventListener('keydown', preventGameKeyScroll, { passive: false });
    
    // Function to enable/disable scroll prevention
    window.setGameActive = function(active) {
        gameActive = active;
        if (active) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
    };
    
    // Auto-detect game pages and enable scroll prevention
    document.addEventListener('DOMContentLoaded', function() {
        // Enable on any page with a known game canvas id, or a canvas inside a
        // recognised game container. Avoids false-positives from charts/analytics
        // canvases that may appear on non-game pages.
        const gameCanvas = document.getElementById('game-canvas') ||
                           document.getElementById('gameCanvas') ||
                           document.querySelector(
                               '#game-container canvas, .game-container canvas, ' +
                               '.game-canvas-wrapper canvas, main canvas'
                           );
        if (gameCanvas) {
            gameActive = true;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }
    });

    /**
     * GameEngine - Base class for all games
     * Provides safe game loop, input handling, and common utilities
     */
    class GameEngine {
        constructor(canvasId, options = {}) {
            // Get canvas element
            this.canvas = typeof canvasId === 'string' 
                ? document.getElementById(canvasId) 
                : canvasId;
            
            if (!this.canvas) {
                console.error('GameEngine: Canvas not found:', canvasId);
                return;
            }
            
            this.ctx = this.canvas.getContext('2d');
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            
            // Timing
            this.lastTime = 0;
            this.deltaTime = 0;
            this.fps = 60;
            this.frameCount = 0;
            this.elapsedTime = 0;
            
            // State
            this.state = 'menu';
            this.running = false;
            this.paused = false;
            
            // Input
            this.keys = {};
            this.keysPressed = {};
            this.keysReleased = {};
            this.mouse = { x: 0, y: 0, down: false, clicked: false };
            
            // Options
            this.options = {
                maxDeltaTime: 0.1,      // Cap delta time to prevent physics issues
                targetFPS: 60,
                showFPS: false,
                autoStart: true,
                ...options
            };
            
            // Error tracking
            this.errorCount = 0;
            this.maxErrors = 10;
            this.lastError = null;

            // Lifecycle
            this._rafId = null;
            this._inputSetup = false;
            
            // Initialize
            this._setupInput();
            
            if (this.options.autoStart) {
                this.start();
            }
        }

        /**
         * Start the game loop
         */
        start() {
            if (this.running) return;
            this.running = true;
            this.lastTime = performance.now();
            this._gameLoop(this.lastTime);
        }

        /**
         * Stop the game loop
         */
        stop() {
            this.running = false;
            if (this._rafId) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }
        }

        /**
         * Pause the game
         */
        pause() {
            this._previousState = this.state;
            this.paused = true;
            this.state = 'paused';
        }

        /**
         * Resume the game
         */
        resume() {
            this.paused = false;
            if (this._previousState && this._previousState !== 'paused') {
                this.state = this._previousState;
            } else {
                this.state = 'playing';
            }
        }

        /**
         * Safe game loop with error recovery
         */
        _gameLoop(timestamp) {
            if (!this.running) return;
            
            try {
                // Calculate delta time
                this.deltaTime = Math.min(
                    (timestamp - this.lastTime) / 1000,
                    this.options.maxDeltaTime
                );
                this.lastTime = timestamp;
                this.elapsedTime += this.deltaTime;
                this.frameCount++;
                
                // Calculate FPS
                if (this.frameCount % 30 === 0) {
                    this.fps = Math.round(1 / this.deltaTime);
                }
                
                // Update game state
                if (!this.paused) {
                    this.update(this.deltaTime);
                }
                
                // Render
                this.render(this.ctx);
                
                // Show FPS if enabled
                if (this.options.showFPS) {
                    this._drawFPS();
                }
                
                // Clear per-frame input state
                this.keysPressed = {};
                this.keysReleased = {};
                this.mouse.clicked = false;
                
                // Reset error count on successful frame
                this.errorCount = 0;
                
            } catch (error) {
                this.errorCount++;
                this.lastError = error;
                console.error('GameEngine: Error in game loop:', error);
                
                // Stop if too many consecutive errors
                if (this.errorCount >= this.maxErrors) {
                    console.error('GameEngine: Too many errors, stopping game loop');
                    this.running = false;
                    this._showErrorScreen(error);
                    return;
                }
            }
            
            // Continue the loop
            this._rafId = requestAnimationFrame((t) => this._gameLoop(t));
        }

        /**
         * Override this method to update game state
         * @param {number} dt - Delta time in seconds
         */
        update(dt) {
            // Override in subclass
        }

        /**
         * Override this method to render the game
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         */
        render(ctx) {
            // Override in subclass
        }

        /**
         * Setup keyboard and mouse input handlers
         */
        _setupInput() {
            if (this._inputSetup) return;
            this._inputSetup = true;
            // Keyboard
            window.addEventListener('keydown', (e) => {
                if (!this.keys[e.code]) {
                    this.keysPressed[e.code] = true;
                }
                this.keys[e.code] = true;
                
                // Prevent default for game keys
                if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                    e.preventDefault();
                }
            });
            
            window.addEventListener('keyup', (e) => {
                this.keys[e.code] = false;
                this.keysReleased[e.code] = true;
            });
            
            // Mouse
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                this.mouse.x = (e.clientX - rect.left) * scaleX;
                this.mouse.y = (e.clientY - rect.top) * scaleY;
            });
            
            this.canvas.addEventListener('mousedown', (e) => {
                this.mouse.down = true;
                this.mouse.clicked = true;
            });
            
            this.canvas.addEventListener('mouseup', (e) => {
                this.mouse.down = false;
            });
            
            // Touch support
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                this.mouse.x = (touch.clientX - rect.left) * scaleX;
                this.mouse.y = (touch.clientY - rect.top) * scaleY;
                this.mouse.down = true;
                this.mouse.clicked = true;
            });
            
            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                this.mouse.x = (touch.clientX - rect.left) * scaleX;
                this.mouse.y = (touch.clientY - rect.top) * scaleY;
            });
            
            this.canvas.addEventListener('touchend', (e) => {
                this.mouse.down = false;
            });
        }

        /**
         * Check if a key is currently held down
         */
        isKeyDown(code) {
            return !!this.keys[code];
        }

        /**
         * Check if a key was just pressed this frame
         */
        isKeyPressed(code) {
            return !!this.keysPressed[code];
        }

        /**
         * Check if a key was just released this frame
         */
        isKeyReleased(code) {
            return !!this.keysReleased[code];
        }

        /**
         * Get gamepad state safely
         */
        getGamepad(index = 0) {
            if (window.gamepadManager) {
                return window.gamepadManager.getState(index);
            }
            return null;
        }

        /**
         * Get gamepad axis value safely
         */
        getGamepadAxis(index, axis) {
            const gp = this.getGamepad(index);
            if (gp && gp.axes && typeof gp.axes[axis] === 'number') {
                return gp.axes[axis];
            }
            return 0;
        }

        /**
         * Check if gamepad button is pressed
         */
        isGamepadButtonDown(index, button) {
            const gp = this.getGamepad(index);
            if (gp && gp.buttons) {
                return !!gp.buttons[button];
            }
            return false;
        }

        /**
         * Draw FPS counter
         */
        _drawFPS() {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(this.width - 60, 5, 55, 20);
            this.ctx.fillStyle = '#0f0';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${this.fps} FPS`, this.width - 10, 20);
            this.ctx.restore();
        }

        /**
         * Show error screen when game crashes
         */
        _showErrorScreen(error) {
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Error', this.width / 2, this.height / 2 - 40);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Something went wrong.', this.width / 2, this.height / 2);
            this.ctx.fillText('Please refresh the page.', this.width / 2, this.height / 2 + 30);
            
            this.ctx.fillStyle = '#888';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(error.message || 'Unknown error', this.width / 2, this.height / 2 + 70);
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    const GameUtils = {
        /**
         * Clamp a value between min and max
         */
        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },

        /**
         * Linear interpolation
         */
        lerp(a, b, t) {
            return a + (b - a) * t;
        },

        /**
         * Calculate distance between two points
         */
        distance(x1, y1, x2, y2) {
            return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        },

        /**
         * Calculate angle between two points
         */
        angle(x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1);
        },

        /**
         * Check collision between two rectangles
         */
        rectCollision(r1, r2) {
            return r1.x < r2.x + r2.width &&
                   r1.x + r1.width > r2.x &&
                   r1.y < r2.y + r2.height &&
                   r1.y + r1.height > r2.y;
        },

        /**
         * Check collision between two circles
         */
        circleCollision(c1, c2) {
            const dist = this.distance(c1.x, c1.y, c2.x, c2.y);
            return dist < (c1.radius || c1.r) + (c2.radius || c2.r);
        },

        /**
         * Check if point is inside rectangle
         */
        pointInRect(px, py, rect) {
            return px >= rect.x && px <= rect.x + rect.width &&
                   py >= rect.y && py <= rect.y + rect.height;
        },

        /**
         * Check if point is inside circle
         */
        pointInCircle(px, py, cx, cy, radius) {
            return this.distance(px, py, cx, cy) < radius;
        },

        /**
         * Generate random number between min and max
         */
        random(min, max) {
            return Math.random() * (max - min) + min;
        },

        /**
         * Generate random integer between min and max (inclusive)
         */
        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        /**
         * Pick random element from array
         */
        randomChoice(array) {
            if (!array || array.length === 0) return null;
            return array[Math.floor(Math.random() * array.length)];
        },

        /**
         * Convert degrees to radians
         */
        toRadians(degrees) {
            return degrees * (Math.PI / 180);
        },

        /**
         * Convert radians to degrees
         */
        toDegrees(radians) {
            return radians * (180 / Math.PI);
        },

        /**
         * Normalize a vector
         */
        normalize(x, y) {
            const len = Math.sqrt(x * x + y * y);
            if (len === 0) return { x: 0, y: 0 };
            return { x: x / len, y: y / len };
        },

        /**
         * Apply smooth easing
         */
        easeOutQuad(t) {
            return t * (2 - t);
        },

        /**
         * Apply smooth easing (in-out)
         */
        easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
    };

    // ==================== PARTICLE SYSTEM ====================

    class ParticleSystem {
        constructor() {
            this.particles = [];
        }

        emit(x, y, options = {}) {
            const count = options.count || 10;
            const color = options.color || '#FFD700';
            const speed = options.speed || 5;
            const life = options.life || 1;
            const size = options.size || 4;
            const spread = options.spread || Math.PI * 2;
            const direction = options.direction || 0;
            const gravity = options.gravity || 0;

            for (let i = 0; i < count; i++) {
                const angle = direction + (Math.random() - 0.5) * spread;
                const vel = (0.5 + Math.random() * 0.5) * speed;
                
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * vel,
                    vy: Math.sin(angle) * vel,
                    life: life * (0.5 + Math.random() * 0.5),
                    maxLife: life,
                    size: size * (0.5 + Math.random() * 0.5),
                    color,
                    gravity
                });
            }
        }

        update(dt) {
            this.particles = this.particles.filter(p => {
                p.x += p.vx * dt * 60; // Multiply by 60 for 60fps baseline
                p.y += p.vy * dt * 60;
                p.vy += (p.gravity || 0) * dt;
                p.life -= dt;
                return p.life > 0;
            });
        }

        render(ctx) {
            this.particles.forEach(p => {
                const alpha = GameUtils.clamp(p.life / p.maxLife, 0, 1);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }

        clear() {
            this.particles = [];
        }
    }

    // ==================== EXPORTS ====================

    // Export to window for global access
    window.GameEngine = GameEngine;
    window.GameUtils = GameUtils;
    window.ParticleSystem = ParticleSystem;

})();
