/**
 * Mobile Game Adapter - 9DTTT
 * Provides universal mobile support for all games:
 * - Canvas auto-scaling to fit any screen
 * - Touch-to-keyboard event mapping
 * - On-screen D-pad and action buttons for touch devices
 * - Device orientation change handling
 */

(function() {
    'use strict';

    const MobileGameAdapter = {
        isTouch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
        canvas: null,
        container: null,
        dpadActive: {},
        resizeTimeout: null,

        init() {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        },

        setup() {
            this.canvas = document.getElementById('gameCanvas') || document.getElementById('game-canvas');
            this.container = document.querySelector('.game-canvas-wrapper') ||
                             document.querySelector('#game-container') ||
                             document.querySelector('.game-area') ||
                             (this.canvas && this.canvas.parentElement);

            this.applyCanvasScaling();

            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => this.applyCanvasScaling(), 150);
            });

            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.applyCanvasScaling(), 300);
            });

            if (this.isTouch) {
                this.setupTouchControls();
            }
        },

        applyCanvasScaling() {
            if (!this.canvas) return;

            // Reset any inline size first
            this.canvas.style.removeProperty('width');
            this.canvas.style.removeProperty('height');

            const nativeW = this.canvas.width;
            const nativeH = this.canvas.height;
            if (!nativeW || !nativeH) return;

            // Available viewport space (minus safe areas)
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // On mobile, limit height to leave room for mobile controls
            const controlsHeight = this.isTouch ? 180 : 0;
            const headerHeight = 100; // Space for header/nav
            const maxH = vh - controlsHeight - headerHeight;
            const maxW = vw - 32; // margins on both sides

            if (maxW <= 0 || maxH <= 0) return;

            // Compute a single scale factor that preserves aspect ratio while
            // respecting viewport constraints and only applying the minimum
            // playable size when it can fit without overflowing.
            const fitScale = Math.min(maxW / nativeW, maxH / nativeH);

            // Ensure minimum playable size on very small screens when possible.
            const minSize = 300;
            const minScale = Math.min(
                Math.max(minSize / nativeW, minSize / nativeH),
                fitScale
            );

            const scale = Math.max(fitScale, minScale);
            const displayW = nativeW * scale;
            const displayH = nativeH * scale;

            // Apply CSS scaling (preserves internal canvas resolution)
            this.canvas.style.width = Math.floor(displayW) + 'px';
            this.canvas.style.height = Math.floor(displayH) + 'px';
            this.canvas.style.display = 'block';
            this.canvas.style.margin = '10px auto';
            this.canvas.style.maxWidth = '100%';
            this.canvas.style.objectFit = 'contain';
            this.canvas.classList.add('mga-scaled');
        },

        setupTouchControls() {
            if (!this.canvas) return;

            const controlType = this.canvas.dataset.mobileControls ||
                                (this.container && this.container.dataset.mobileControls) ||
                                this.autoDetectControlType();

            if (controlType === 'dpad') {
                this.createDpadOverlay();
            } else if (controlType === 'swipe') {
                this.setupSwipeControls();
            } else if (controlType === 'tap' || controlType === 'none') {
                // Nothing extra needed
            } else {
                // Default: create dpad for canvas games that likely use keyboard
                this.createDpadOverlay();
            }
        },

        autoDetectControlType() {
            // Detect based on URL path
            const url = window.location.pathname;
            const boardGames = [
                'connect-four', 'chess', 'backgammon', 'checkers', 'tictactoe',
                'ultimate-tictactoe', 'crystal-connect', 'farkle', 'hangman',
                'memory', 'sudoku', 'thirteen', 'tide-turner', 'recursive-maze',
                'quantum-sudoku', 'dimensional-dice', 'crypto-quest',
                'brain-academy', 'brain-age'
            ];
            for (const name of boardGames) {
                if (url.includes(name)) return 'tap';
            }
            // Canvas games that use keyboard → show dpad
            if (this.canvas) return 'dpad';
            return 'tap';
        },

        createDpadOverlay() {
            const overlay = document.createElement('div');
            overlay.id = 'mga-dpad-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.innerHTML = `
                <div id="mga-dpad">
                    <button class="mga-dpad-btn" data-key="ArrowUp" aria-label="Up">&#9650;</button>
                    <div class="mga-dpad-row">
                        <button class="mga-dpad-btn" data-key="ArrowLeft" aria-label="Left">&#9664;</button>
                        <div class="mga-dpad-center"></div>
                        <button class="mga-dpad-btn" data-key="ArrowRight" aria-label="Right">&#9654;</button>
                    </div>
                    <button class="mga-dpad-btn" data-key="ArrowDown" aria-label="Down">&#9660;</button>
                </div>
                <div id="mga-actions">
                    <button class="mga-action-btn" data-key="Space" aria-label="Action / Jump">A</button>
                    <button class="mga-action-btn" data-key="KeyZ" aria-label="Attack">B</button>
                    <button class="mga-action-btn" data-key="Enter" aria-label="Start / Confirm">S</button>
                    <button class="mga-action-btn" data-key="KeyX" aria-label="Special">X</button>
                </div>
            `;

            const style = document.createElement('style');
            style.textContent = `
                #mga-dpad-overlay {
                    position: fixed;
                    bottom: env(safe-area-inset-bottom, 10px);
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 0 16px 10px;
                    z-index: 9999;
                    pointer-events: none;
                    user-select: none;
                    -webkit-user-select: none;
                }
                #mga-dpad {
                    display: grid;
                    grid-template-rows: 1fr 1fr 1fr;
                    align-items: center;
                    justify-items: center;
                    gap: 4px;
                    pointer-events: auto;
                }
                .mga-dpad-row {
                    display: flex;
                    gap: 4px;
                    align-items: center;
                }
                .mga-dpad-center {
                    width: 44px;
                    height: 44px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                }
                .mga-dpad-btn {
                    width: 54px;
                    height: 54px;
                    background: rgba(30,40,80,0.85);
                    border: 2px solid rgba(102,126,234,0.6);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                    backdrop-filter: blur(8px);
                    touch-action: none;
                }
                .mga-dpad-btn:active, .mga-dpad-btn.pressed {
                    background: rgba(102,126,234,0.75);
                    transform: scale(0.93);
                }
                #mga-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    pointer-events: auto;
                }
                .mga-action-btn {
                    width: 58px;
                    height: 58px;
                    background: rgba(30,40,80,0.85);
                    border: 2px solid rgba(102,126,234,0.6);
                    border-radius: 50%;
                    color: #fff;
                    font-size: 16px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                    backdrop-filter: blur(8px);
                    touch-action: none;
                }
                .mga-action-btn:active, .mga-action-btn.pressed {
                    background: rgba(102,126,234,0.75);
                    transform: scale(0.93);
                }
                @media (min-width: 769px) {
                    #mga-dpad-overlay { display: none !important; }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(overlay);
            document.body.classList.add('mga-dpad-active');

            // Wire up touch events → keyboard events (arrow functions preserve lexical this)
            overlay.querySelectorAll('[data-key]').forEach(btn => {
                const key = btn.dataset.key;

                const press = (e) => {
                    e.preventDefault();
                    btn.classList.add('pressed');
                    this.dispatchKeyboardEvent('keydown', key);
                };
                const release = (e) => {
                    e.preventDefault();
                    btn.classList.remove('pressed');
                    this.dispatchKeyboardEvent('keyup', key);
                };

                btn.addEventListener('touchstart', press, { passive: false });
                btn.addEventListener('touchend', release, { passive: false });
                btn.addEventListener('touchcancel', release, { passive: false });
                // Mouse fallback for testing on desktop
                btn.addEventListener('mousedown', press);
                btn.addEventListener('mouseup', release);
                btn.addEventListener('mouseleave', release);
            });
        },

        setupSwipeControls() {
            if (!this.canvas) return;

            let startY = 0;
            // Track which keys are currently held to avoid redundant events
            const held = new Set();
            const SWIPE_THRESHOLD = 10;

            const setKey = (type, code) => {
                if (type === 'keydown' && held.has(code)) return;
                if (type === 'keyup' && !held.has(code)) return;
                type === 'keydown' ? held.add(code) : held.delete(code);
                this.dispatchKeyboardEvent(type, code);
            };

            const touchStart = (e) => {
                startY = e.touches[0].clientY;
            };

            const touchMove = (e) => {
                e.preventDefault();
                const t = e.touches[0];
                const dy = t.clientY - startY;

                // Left half → W/S (player 1 paddle), right half → Arrow Up/Down (player 2)
                const rect = this.canvas.getBoundingClientRect();
                const isLeftSide = t.clientX < rect.left + rect.width / 2;
                const upKey   = isLeftSide ? 'KeyW'      : 'ArrowUp';
                const downKey = isLeftSide ? 'KeyS'      : 'ArrowDown';

                if (Math.abs(dy) > SWIPE_THRESHOLD) {
                    if (dy < 0) {
                        setKey('keydown', upKey);
                        setKey('keyup',   downKey);
                    } else {
                        setKey('keydown', downKey);
                        setKey('keyup',   upKey);
                    }
                } else {
                    setKey('keyup', upKey);
                    setKey('keyup', downKey);
                }
            };

            const touchEnd = () => {
                held.forEach(k => this.dispatchKeyboardEvent('keyup', k));
                held.clear();
            };

            this.canvas.addEventListener('touchstart', touchStart, { passive: true });
            this.canvas.addEventListener('touchmove', touchMove, { passive: false });
            this.canvas.addEventListener('touchend', touchEnd, { passive: true });
        },

        dispatchKeyboardEvent(type, code) {
            // keyCode/which are deprecated but included for backward compatibility
            // with game input handlers that still read these legacy properties.
            const keyMap = {
                'ArrowUp':    { key: 'ArrowUp',    keyCode: 38 },
                'ArrowDown':  { key: 'ArrowDown',  keyCode: 40 },
                'ArrowLeft':  { key: 'ArrowLeft',  keyCode: 37 },
                'ArrowRight': { key: 'ArrowRight', keyCode: 39 },
                'Space':      { key: ' ',           keyCode: 32 },
                'KeyW':       { key: 'w',           keyCode: 87 },
                'KeyS':       { key: 's',           keyCode: 83 },
                'KeyZ':       { key: 'z',           keyCode: 90 },
                'KeyX':       { key: 'x',           keyCode: 88 },
                'Enter':      { key: 'Enter',       keyCode: 13 }
            };
            const info = keyMap[code] || { key: code, keyCode: 0 };
            const event = new KeyboardEvent(type, {
                key: info.key,
                code,
                keyCode: info.keyCode,
                which: info.keyCode,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(event);
        }

        // Legacy alias kept for external callers
        , fireKeyEvent(type, code) { this.dispatchKeyboardEvent(type, code); }
    };

    MobileGameAdapter.init();
    window.MobileGameAdapter = MobileGameAdapter;
})();
