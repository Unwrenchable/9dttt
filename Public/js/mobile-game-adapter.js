/**
 * Mobile Game Adapter - 9DTTT
 * Provides universal mobile support for all games:
 * - Canvas auto-scaling to fit any screen
 * - Touch-to-keyboard event mapping
 * - On-screen D-pad and action buttons for touch devices
 * - Device orientation change handling
 */

// Note: pages are NOT scroll-locked globally (that made long pages unscrollable).
// Only the game surface (canvas / d-pad) blocks touch scrolling; see lockPageScroll().

(function() {
    'use strict';

    const MobileGameAdapter = {
        isTouch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
        canvas: null,
        container: null,
        dpadActive: {},
        resizeTimeout: null,
        _rafSnapped: false,

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

            // Lock page scrolling on game pages so arrow keys / touch / wheel
            // don't pull the viewport away from the game.
            this.lockPageScroll();

            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => this.applyCanvasScaling(), 150);
            });

            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.applyCanvasScaling(), 300);
            });

            // Re-scale when fullscreen state changes so the canvas
            // fills the entire viewport (or restores normal sizing).
            window.addEventListener('fullscreenEntered', () => this.applyCanvasScaling());
            window.addEventListener('fullscreenExited', () => this.applyCanvasScaling());

            if (this.isTouch) {
                this.setupTouchControls();
            }
        },

        /**
         * Lock the page so it cannot be scrolled while playing.
         * Prevents arrow keys / Space / Page keys from scrolling the browser chrome,
         * and stops touch-based page scroll (swipe-to-scroll) from pulling the
         * viewport away from the canvas.
         * Safe to call multiple times – listeners are registered only once.
         */
        lockPageScroll() {
            if (this._scrollLocked) return;
            this._scrollLocked = true;

            // Mark canvas games so CSS can apply arcade-only "game mode" rules.
            if (this.canvas) document.body.classList.add('mga-canvas-game');

            // Keys that normally scroll the page: only swallow them on canvas
            // (arcade) games, where they drive the game. DOM/board games keep
            // normal keyboard scrolling.
            const SCROLL_KEYS = new Set([
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                'Space', 'PageUp', 'PageDown', 'Home', 'End'
            ]);
            const hasCanvas = () => !!this.canvas;

            window.addEventListener('keydown', function (e) {
                if (!hasCanvas() || !SCROLL_KEYS.has(e.code)) return;
                // Don't interfere with text inputs / selects
                const el = document.activeElement;
                if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
                e.preventDefault();
            }, { passive: false });

            // Block touch scrolling only when the gesture is on the game surface
            // (canvas, on-screen d-pad, or anything marked data-no-scroll).
            // Everywhere else the page scrolls normally.
            document.addEventListener('touchmove', function (e) {
                const t = e.target;
                if (!t || !t.closest) return;
                if (t.closest('[data-scrollable]')) return;
                if (t.closest('canvas, #mga-dpad-overlay, [data-no-scroll]')) e.preventDefault();
            }, { passive: false });
        },

        applyCanvasScaling() {
            if (!this.canvas) {
                // For DOM-based games (no canvas), ensure container fills viewport
                // DOM-based games (no canvas) lay out normally and the page
                // scrolls; don't clamp/clip the container to the viewport.
                return;
            }

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
            // Only reserve dpad space when the control type is not tap/none
            const controlType = this.canvas.dataset.mobileControls ||
                                 (this.container && this.container.dataset.mobileControls) ||
                                 this.autoDetectControlType();
            const needsDpad = this.isTouch && controlType !== 'tap' && controlType !== 'none';
            const controlsHeight = needsDpad ? 140 : 0;
            const inFullscreen = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            const headerH = inFullscreen ? 0 : 56; // hide header reservation in fullscreen
            const maxH = vh - controlsHeight - headerH - (inFullscreen ? 4 : 24); // margin + border
            const maxW = vw - (inFullscreen ? 0 : 12); // edge margin only outside fullscreen

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
            this.canvas.style.margin = inFullscreen ? '0 auto' : '10px auto';
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
                /* Semi-transparent, outline-style controls: no panel behind them,
                   and only the buttons themselves take pointer events, so the
                   game stays visible and the canvas is never blocked. */
                #mga-dpad-overlay {
                    --mga-idle-opacity: 0.35;
                    --mga-active-opacity: 0.7;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 0 calc(12px + env(safe-area-inset-right, 0px)) calc(10px + env(safe-area-inset-bottom, 0px)) calc(12px + env(safe-area-inset-left, 0px));
                    background: transparent;
                    z-index: 9999;
                    pointer-events: none;
                    user-select: none;
                    -webkit-user-select: none;
                }
                #mga-dpad-overlay.mga-opacity-low { --mga-idle-opacity: 0.2; --mga-active-opacity: 0.5; }
                #mga-dpad-overlay.mga-opacity-high { --mga-idle-opacity: 0.6; --mga-active-opacity: 0.9; }
                #mga-dpad, #mga-actions, .mga-dpad-row { pointer-events: none; background: transparent; }
                #mga-dpad {
                    display: grid;
                    grid-template-rows: auto auto auto;
                    align-items: center;
                    justify-items: center;
                    gap: 2px;
                }
                .mga-dpad-row { display: flex; gap: 2px; align-items: center; }
                .mga-dpad-center { width: 44px; height: 44px; }
                .mga-dpad-btn, .mga-action-btn {
                    pointer-events: auto;
                    min-width: 48px;
                    min-height: 48px;
                    width: 50px;
                    height: 50px;
                    padding: 0;
                    background: transparent;
                    border: 2px solid rgba(255,255,255,0.85);
                    color: #fff;
                    text-shadow: 0 0 3px #000, 0 0 2px #000;
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(0,0,0,0.25);
                    opacity: var(--mga-idle-opacity);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: none;
                    transition: opacity 0.08s, transform 0.08s;
                }
                .mga-dpad-btn { border-radius: 10px; font-size: 18px; }
                .mga-action-btn { border-radius: 50%; font-size: 16px; font-weight: bold; }
                .mga-dpad-btn:active, .mga-dpad-btn.pressed,
                .mga-action-btn:active, .mga-action-btn.pressed {
                    opacity: var(--mga-active-opacity);
                    background: rgba(255,255,255,0.18);
                    transform: scale(0.93);
                }
                #mga-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                #mga-opacity-toggle {
                    position: fixed;
                    top: calc(6px + env(safe-area-inset-top, 0px));
                    right: calc(54px + env(safe-area-inset-right, 0px));
                    width: 44px; height: 44px;
                    pointer-events: auto;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.6);
                    border-radius: 50%;
                    color: #fff;
                    font-size: 15px;
                    opacity: 0.45;
                    z-index: 10000;
                    -webkit-tap-highlight-color: transparent;
                }
                /* Keep the accessibility widget clear of the touch controls:
                   move it to the top-right row, next to the opacity toggle. */
                @media (max-width: 768px) {
                    body.mga-dpad-active:not(.mga-controls-hidden) .accessibility-btn {
                        top: calc(6px + env(safe-area-inset-top, 0px)) !important;
                        bottom: auto !important;
                        right: calc(102px + env(safe-area-inset-right, 0px)) !important;
                        left: auto !important;
                        width: 44px !important; height: 44px !important;
                        font-size: 20px !important;
                        z-index: 10000 !important;
                    }
                    body.mga-dpad-active:not(.mga-controls-hidden) .accessibility-panel {
                        top: calc(56px + env(safe-area-inset-top, 0px)) !important;
                        bottom: auto !important;
                        right: calc(10px + env(safe-area-inset-right, 0px)) !important;
                        max-height: calc(100vh - 66px) !important;
                        overflow-y: auto !important;
                        z-index: 10001 !important;
                    }
                }
                body:not(.mga-dpad-active) #mga-opacity-toggle,
                body.mga-controls-hidden #mga-opacity-toggle { display: none; }
                @media (min-width: 769px) { #mga-opacity-toggle { display: none !important; } }
                @media (min-width: 769px) {
                    #mga-dpad-overlay { display: none !important; }
                }
                /* Games hide the pad on menu / select screens via body.mga-controls-hidden */
                body.mga-controls-hidden #mga-dpad-overlay { display: none !important; }
            `;
            document.head.appendChild(style);
            document.body.appendChild(overlay);
            document.body.classList.add('mga-dpad-active');

            // Opacity setting (low / normal / high), remembered across games
            const levels = ['normal', 'low', 'high'];
            const applyLevel = (lvl) => {
                overlay.classList.remove('mga-opacity-low', 'mga-opacity-high');
                if (lvl !== 'normal') overlay.classList.add('mga-opacity-' + lvl);
            };
            let level = 'normal';
            try { level = localStorage.getItem('9dttt.controlsOpacity') || 'normal'; } catch (e) {}
            if (!levels.includes(level)) level = 'normal';
            applyLevel(level);
            const opBtn = document.createElement('button');
            opBtn.id = 'mga-opacity-toggle';
            opBtn.type = 'button';
            opBtn.textContent = '\u25D0';
            const label = () => 'Touch controls opacity: ' + level + ' (tap to change)';
            opBtn.setAttribute('aria-label', label());
            opBtn.title = label();
            opBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                level = levels[(levels.indexOf(level) + 1) % levels.length];
                applyLevel(level);
                try { localStorage.setItem('9dttt.controlsOpacity', level); } catch (err) {}
                opBtn.setAttribute('aria-label', label());
                opBtn.title = label();
            });
            document.body.appendChild(opBtn);
            // Only one set of touch controls: hide the legacy MobileControls if it was shown.
            if (window.mobileControls && typeof window.mobileControls.hide === 'function') {
                window.mobileControls.hide();
            }

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
        },

        detectDevice() {
            const ua = navigator.userAgent;
            // iPad is a tablet, not a mobile phone — exclude it from isMobile
            const isMobile = /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
            const isIOS = /iPhone|iPad|iPod/i.test(ua);
            const isAndroid = /Android/i.test(ua);
            // Safari: has Version/x.x and Safari in UA, but not Chrome/Chromium
            const isSafari = /Version\/[\d.]+.*Safari/i.test(ua) && !/Chrome|Chromium/i.test(ua);
            const isChrome = /Chrome/i.test(ua) && !/Edge/i.test(ua);
            const isFirefox = /Firefox/i.test(ua);
            const isEdge = /Edge|Edg\//i.test(ua);
            const pixelRatio = window.devicePixelRatio || 1;
            const screenW = window.screen.width;
            const screenH = window.screen.height;

            return {
                isMobile: isMobile && !isTablet,
                isTablet,
                isDesktop: !isMobile && !isTablet,
                isIOS,
                isAndroid,
                isSafari,
                isChrome,
                isFirefox,
                isEdge,
                pixelRatio,
                screenW,
                screenH,
                isTouch: this.isTouch,
                browserName: isEdge ? 'Edge' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Unknown'
            };
        },

        snapToViewport() {
            // Apply game-active class to body (hides footer, locks layout)
            document.body.classList.add('game-active');
            this._rafSnapped = true;

            // Force canvas scaling update
            this.applyCanvasScaling();

            // On mobile/tablet, try requesting fullscreen for immersive play
            const device = this.detectDevice();
            if (device.isMobile || device.isTablet) {
                const el = document.documentElement;
                const requestFullscreenFn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
                if (requestFullscreenFn) {
                    requestFullscreenFn.call(el).catch(() => {}); // Silently fail if not permitted
                }
            }
        },

        exitGameMode() {
            document.body.classList.remove('game-active');
            this._rafSnapped = false;
        },

        // Legacy alias kept for external callers
        fireKeyEvent(type, code) { this.dispatchKeyboardEvent(type, code); }
    };

    MobileGameAdapter.init();
    window.MobileGameAdapter = MobileGameAdapter;
    window.snapGameToViewport = () => MobileGameAdapter.snapToViewport();
    window.exitGameViewport = () => MobileGameAdapter.exitGameMode();
    window.detectGameDevice = () => MobileGameAdapter.detectDevice();

    // Auto-snap to viewport when game starts its RAF loop
    (function patchGameStart() {
        const origRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(cb) {
            if (!MobileGameAdapter._rafSnapped) {
                MobileGameAdapter._rafSnapped = true;
                // Tiny delay so game can initialize before we resize
                setTimeout(function() { MobileGameAdapter.snapToViewport(); }, 80);
            }
            return origRAF.call(window, cb);
        };
    })();
})();
