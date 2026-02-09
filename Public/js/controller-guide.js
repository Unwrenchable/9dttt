/**
 * Controller Guide System
 * Provides an always-accessible overlay showing controller button mappings
 * for any game - native support without extra configuration
 */

class ControllerGuide {
    constructor() {
        this.visible = false;
        this.gameType = 'default';
        this.buttonMappings = this.createButtonMappings();
        this.init();
    }

    createButtonMappings() {
        return {
            'default': {
                title: 'Universal Controls',
                mappings: {
                    'A': 'Select / Confirm',
                    'B': 'Back / Cancel',
                    'X': 'Toggle Instructions',
                    'Y': 'New Game',
                    'D-Pad / Left Stick': 'Navigate Menu',
                    'Start': 'Pause / Menu',
                    'Back': 'Quick Help',
                    'LB': 'Previous Tab',
                    'RB': 'Next Tab'
                }
            },
            'fighting': {
                title: 'Fighting Game Controls',
                mappings: {
                    'X': 'Light Attack',
                    'Y': 'Heavy Attack',
                    'A': 'Jump',
                    'B': 'Special Move',
                    'LB': 'Grab / Throw',
                    'RB': 'Block',
                    'LT': 'Dodge',
                    'RT': 'Super Move',
                    'Left Stick': 'Move Character',
                    'Start': 'Pause'
                }
            },
            'beat-em-up': {
                title: 'Beat \'Em Up Controls',
                mappings: {
                    'X': 'Punch',
                    'Y': 'Kick',
                    'A': 'Jump',
                    'B': 'Special Attack',
                    'LB': 'Grab',
                    'RB': 'Weapon Pickup',
                    'LT': 'Dodge Roll',
                    'RT': 'Super Move',
                    'Left Stick': 'Move',
                    'Start': 'Pause'
                }
            },
            'shooter': {
                title: 'Shooter Controls',
                mappings: {
                    'A': 'Jump',
                    'X': 'Shoot',
                    'Y': 'Grenade',
                    'B': 'Switch Weapon',
                    'LB': 'Strafe Left',
                    'RB': 'Strafe Right',
                    'LT': 'Aim',
                    'RT': 'Rapid Fire',
                    'Left Stick': 'Move',
                    'Right Stick': 'Aim',
                    'Start': 'Pause'
                }
            },
            'racing': {
                title: 'Racing Controls',
                mappings: {
                    'A': 'Accelerate',
                    'B': 'Brake / Reverse',
                    'X': 'Drift',
                    'Y': 'Boost',
                    'LB': 'Look Back',
                    'RB': 'Use Item',
                    'LT': 'Brake (Analog)',
                    'RT': 'Accelerate (Analog)',
                    'Left Stick': 'Steer',
                    'Start': 'Pause'
                }
            },
            'puzzle': {
                title: 'Puzzle Game Controls',
                mappings: {
                    'A': 'Select / Confirm',
                    'B': 'Cancel / Back',
                    'X': 'Rotate Left',
                    'Y': 'Rotate Right',
                    'LB': 'Undo Move',
                    'RB': 'Hint',
                    'LT': 'Pause',
                    'RT': 'Fast Forward',
                    'D-Pad': 'Navigate',
                    'Start': 'Menu'
                }
            },
            'platformer': {
                title: 'Platformer Controls',
                mappings: {
                    'A': 'Jump',
                    'B': 'Attack / Shoot',
                    'X': 'Slide',
                    'Y': 'Special Weapon',
                    'LB': 'Previous Weapon',
                    'RB': 'Next Weapon',
                    'LT': 'Charge Attack',
                    'RT': 'Dash',
                    'Left Stick': 'Move',
                    'Start': 'Pause'
                }
            }
        };
    }

    init() {
        // Create the guide overlay
        this.createOverlay();
        
        // Listen for keyboard shortcut (Ctrl + G)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'g' && e.ctrlKey) {
                e.preventDefault();
                this.toggle();
            }
        });

        // Listen for gamepad back button hold (2 seconds)
        if (window.gamepadManager) {
            let backHoldStart = 0;
            window.gamepadManager.on('buttondown', (data) => {
                if (data.button === 'back') {
                    backHoldStart = Date.now();
                    this.checkBackHold(backHoldStart);
                }
            });
            window.gamepadManager.on('buttonup', (data) => {
                if (data.button === 'back') {
                    backHoldStart = 0;
                }
            });
        }

        // Detect game type from page
        this.detectGameType();
    }

    checkBackHold(startTime) {
        setTimeout(() => {
            if (startTime && Date.now() - startTime >= 2000) {
                this.toggle();
            }
        }, 2000);
    }

    detectGameType() {
        const pathname = window.location.pathname.toLowerCase();
        
        if (pathname.includes('dragon-fist') || pathname.includes('street-brawlers') || 
            pathname.includes('tournament-fighters')) {
            this.gameType = 'fighting';
        } else if (pathname.includes('contra') || pathname.includes('fps-arena') || 
                   pathname.includes('carnival-shooter')) {
            this.gameType = 'shooter';
        } else if (pathname.includes('motogp')) {
            this.gameType = 'racing';
        } else if (pathname.includes('sudoku') || pathname.includes('connect') || 
                   pathname.includes('tictactoe') || pathname.includes('farkle')) {
            this.gameType = 'puzzle';
        } else if (pathname.includes('mega-heroes') || pathname.includes('contra')) {
            this.gameType = 'platformer';
        } else if (pathname.includes('beat') || pathname.includes('rampage')) {
            this.gameType = 'beat-em-up';
        }
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'controller-guide-overlay';
        overlay.className = 'controller-guide-overlay';
        overlay.style.display = 'none';
        
        overlay.innerHTML = `
            <style>
                .controller-guide-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    backdrop-filter: blur(10px);
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .controller-guide-container {
                    max-width: 900px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    background: linear-gradient(135deg, #1a1a3a 0%, #2a2a4a 100%);
                    border: 3px solid #4a90e2;
                    border-radius: 20px;
                    padding: 40px;
                    color: #fff;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8),
                                0 0 40px rgba(74, 144, 226, 0.3);
                }
                
                .guide-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                }
                
                .guide-header h2 {
                    margin: 0;
                    font-size: 2rem;
                    color: #4a90e2;
                    text-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
                }
                
                .close-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    color: #fff;
                    padding: 10px 20px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: bold;
                    transition: all 0.3s;
                }
                
                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: #4a90e2;
                    transform: scale(1.05);
                }
                
                .controller-diagram {
                    display: flex;
                    justify-content: center;
                    margin: 30px 0;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 15px;
                }
                
                .controller-svg {
                    width: 100%;
                    max-width: 500px;
                    height: auto;
                }
                
                .button-mappings {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin-top: 30px;
                }
                
                .button-mapping {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px 20px;
                    border-radius: 10px;
                    border-left: 4px solid #4a90e2;
                    transition: all 0.3s;
                }
                
                .button-mapping:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateX(5px);
                }
                
                .button-name {
                    font-weight: bold;
                    color: #4a90e2;
                    font-size: 1.1rem;
                    margin-bottom: 5px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .button-icon {
                    display: inline-block;
                    width: 28px;
                    height: 28px;
                    background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
                    border-radius: 50%;
                    text-align: center;
                    line-height: 28px;
                    font-size: 0.9rem;
                    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.4);
                }
                
                .button-action {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.95rem;
                }
                
                .game-type-selector {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                
                .game-type-btn {
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 0.9rem;
                }
                
                .game-type-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .game-type-btn.active {
                    background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
                    border-color: #4a90e2;
                    box-shadow: 0 0 15px rgba(74, 144, 226, 0.5);
                }
                
                .help-text {
                    text-align: center;
                    margin-top: 20px;
                    padding: 15px;
                    background: rgba(74, 144, 226, 0.1);
                    border-radius: 10px;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.7);
                }
            </style>
            
            <div class="controller-guide-container">
                <div class="guide-header">
                    <h2>🎮 Controller Guide</h2>
                    <button class="close-btn" onclick="window.controllerGuide.hide()">Close [B]</button>
                </div>
                
                <div class="game-type-selector" id="gameTypeSelector"></div>
                
                <div class="controller-diagram">
                    <svg class="controller-svg" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
                        <!-- Controller body -->
                        <rect x="100" y="80" width="300" height="140" rx="70" fill="url(#controllerGrad)" stroke="#4a90e2" stroke-width="3"/>
                        
                        <!-- Gradients -->
                        <defs>
                            <linearGradient id="controllerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#2a2a4a;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#1a1a3a;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        
                        <!-- D-Pad -->
                        <g transform="translate(160, 140)">
                            <circle cx="0" cy="0" r="35" fill="rgba(255,255,255,0.05)" stroke="#4a90e2" stroke-width="2"/>
                            <path d="M -15,-10 L -15,10 L -10,10 L -10,-10 Z" fill="#4a90e2" opacity="0.7"/>
                            <path d="M 15,-10 L 15,10 L 10,10 L 10,-10 Z" fill="#4a90e2" opacity="0.7"/>
                            <path d="M -10,-15 L 10,-15 L 10,-10 L -10,-10 Z" fill="#4a90e2" opacity="0.7"/>
                            <path d="M -10,15 L 10,15 L 10,10 L -10,10 Z" fill="#4a90e2" opacity="0.7"/>
                        </g>
                        
                        <!-- Face Buttons (ABXY) -->
                        <g transform="translate(340, 140)">
                            <circle cx="0" cy="-25" r="15" fill="#e74c3c" stroke="#fff" stroke-width="2"/>
                            <text x="0" y="-20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Y</text>
                            
                            <circle cx="0" cy="25" r="15" fill="#3498db" stroke="#fff" stroke-width="2"/>
                            <text x="0" y="30" text-anchor="middle" fill="white" font-size="12" font-weight="bold">A</text>
                            
                            <circle cx="-25" cy="0" r="15" fill="#9b59b6" stroke="#fff" stroke-width="2"/>
                            <text x="-25" y="5" text-anchor="middle" fill="white" font-size="12" font-weight="bold">X</text>
                            
                            <circle cx="25" cy="0" r="15" fill="#2ecc71" stroke="#fff" stroke-width="2"/>
                            <text x="25" y="5" text-anchor="middle" fill="white" font-size="12" font-weight="bold">B</text>
                        </g>
                        
                        <!-- Bumpers -->
                        <rect x="120" y="60" width="60" height="15" rx="7" fill="#4a90e2" opacity="0.7"/>
                        <text x="150" y="71" text-anchor="middle" fill="white" font-size="10" font-weight="bold">LB</text>
                        
                        <rect x="320" y="60" width="60" height="15" rx="7" fill="#4a90e2" opacity="0.7"/>
                        <text x="350" y="71" text-anchor="middle" fill="white" font-size="10" font-weight="bold">RB</text>
                        
                        <!-- Triggers -->
                        <rect x="120" y="40" width="60" height="15" rx="7" fill="#e67e22" opacity="0.6"/>
                        <text x="150" y="51" text-anchor="middle" fill="white" font-size="10" font-weight="bold">LT</text>
                        
                        <rect x="320" y="40" width="60" height="15" rx="7" fill="#e67e22" opacity="0.6"/>
                        <text x="350" y="51" text-anchor="middle" fill="white" font-size="10" font-weight="bold">RT</text>
                        
                        <!-- Start/Back -->
                        <rect x="220" y="120" width="30" height="12" rx="6" fill="rgba(255,255,255,0.2)"/>
                        <text x="235" y="129" text-anchor="middle" fill="white" font-size="8">BACK</text>
                        
                        <rect x="250" y="120" width="30" height="12" rx="6" fill="rgba(255,255,255,0.2)"/>
                        <text x="265" y="129" text-anchor="middle" fill="white" font-size="8">START</text>
                    </svg>
                </div>
                
                <div id="buttonMappingsContainer"></div>
                
                <div class="help-text">
                    💡 <strong>Pro Tip:</strong> Press <kbd>Ctrl + G</kbd> or hold the Back button for 2 seconds to toggle this guide anytime!
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.overlay = overlay;
        
        // Render game type selector
        this.renderGameTypeSelector();
        
        // Render current mappings
        this.renderMappings();
        
        // Allow B button to close
        if (window.gamepadManager) {
            window.gamepadManager.on('buttondown', (data) => {
                if (data.button === 'b' && this.visible) {
                    this.hide();
                }
            });
        }
    }

    renderGameTypeSelector() {
        const container = document.getElementById('gameTypeSelector');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const [type, config] of Object.entries(this.buttonMappings)) {
            const btn = document.createElement('button');
            btn.className = 'game-type-btn';
            btn.textContent = config.title;
            if (type === this.gameType) {
                btn.classList.add('active');
            }
            btn.onclick = () => {
                this.gameType = type;
                this.renderGameTypeSelector();
                this.renderMappings();
            };
            container.appendChild(btn);
        }
    }

    renderMappings() {
        const container = document.getElementById('buttonMappingsContainer');
        if (!container) return;
        
        const config = this.buttonMappings[this.gameType];
        
        let html = '<div class="button-mappings">';
        for (const [button, action] of Object.entries(config.mappings)) {
            const icon = this.getButtonIcon(button);
            html += `
                <div class="button-mapping">
                    <div class="button-name">
                        <span class="button-icon">${icon}</span>
                        ${button}
                    </div>
                    <div class="button-action">${action}</div>
                </div>
            `;
        }
        html += '</div>';
        
        container.innerHTML = html;
    }

    getButtonIcon(button) {
        const icons = {
            'A': 'A',
            'B': 'B',
            'X': 'X',
            'Y': 'Y',
            'LB': 'L',
            'RB': 'R',
            'LT': 'L',
            'RT': 'R',
            'Start': '▶',
            'Back': '⏸',
            'D-Pad / Left Stick': '✛',
            'Left Stick': '◎',
            'Right Stick': '◎',
            'D-Pad': '✛'
        };
        return icons[button] || '●';
    }

    show() {
        this.visible = true;
        this.overlay.style.display = 'flex';
        
        // Vibrate for feedback
        if (window.gamepadManager) {
            window.gamepadManager.vibrate(0, 30, 0.2, 0);
        }
    }

    hide() {
        this.visible = false;
        this.overlay.style.display = 'none';
        
        // Vibrate for feedback
        if (window.gamepadManager) {
            window.gamepadManager.vibrate(0, 30, 0.1, 0);
        }
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Initialize global controller guide
window.controllerGuide = new ControllerGuide();

// Show guide on first controller connection (once per session)
if (window.gamepadManager && !sessionStorage.getItem('controllerGuideShown')) {
    window.gamepadManager.on('connected', () => {
        setTimeout(() => {
            if (!sessionStorage.getItem('controllerGuideShown')) {
                window.controllerGuide.show();
                sessionStorage.setItem('controllerGuideShown', 'true');
                
                // Auto-hide after 10 seconds
                setTimeout(() => {
                    window.controllerGuide.hide();
                }, 10000);
            }
        }, 2000);
    });
}
