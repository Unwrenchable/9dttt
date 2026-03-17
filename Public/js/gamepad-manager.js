/**
 * Gamepad Controller Support
 * Handles Bluetooth/USB gamepad connections for all games
 * Part of the 9DTTT Game Library
 * 
 * Supports: Xbox, PlayStation, Nintendo Switch Pro, and generic controllers
 */

class GamepadManager {
    constructor() {
        this.gamepads = {};
        this.listeners = new Map();
        this.polling = false;
        this.pollInterval = null;
        this.deadzone = 0.15;
        this.previousStates = {};
        
        // Standard button mappings (Xbox layout as reference)
        this.buttonNames = {
            0: 'a',           // A / Cross
            1: 'b',           // B / Circle
            2: 'x',           // X / Square
            3: 'y',           // Y / Triangle
            4: 'lb',          // Left Bumper
            5: 'rb',          // Right Bumper
            6: 'lt',          // Left Trigger
            7: 'rt',          // Right Trigger
            8: 'back',        // Back / Select
            9: 'start',       // Start
            10: 'ls',         // Left Stick Press
            11: 'rs',         // Right Stick Press
            12: 'up',         // D-pad Up
            13: 'down',       // D-pad Down
            14: 'left',       // D-pad Left
            15: 'right'       // D-pad Right
        };
        
        // Axis mappings
        this.axisNames = {
            0: 'leftX',       // Left Stick X
            1: 'leftY',       // Left Stick Y
            2: 'rightX',      // Right Stick X
            3: 'rightY'       // Right Stick Y
        };
        
        this.init();
    }

    init() {
        window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));
        
        // Check for already connected gamepads and start polling immediately
        // (some browsers don't fire gamepadconnected for pre-connected devices)
        this.scanGamepads();
        if (!this.polling) {
            this.startPolling();
        }
    }

    scanGamepads() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let found = false;
        for (const gp of gamepads) {
            if (gp) {
                this.gamepads[gp.index] = gp;
                if (!this.previousStates[gp.index]) {
                    this.previousStates[gp.index] = this.captureState(gp);
                    this.emit('connected', { gamepad: gp, playerIndex: gp.index });
                    console.log(`🎮 Gamepad detected: ${gp.id} (Player ${gp.index + 1})`);
                }
                found = true;
            }
        }
        return found;
    }

    onGamepadConnected(event) {
        const gp = event.gamepad;
        this.gamepads[gp.index] = gp;
        this.previousStates[gp.index] = this.captureState(gp);
        
        console.log(`🎮 Gamepad connected: ${gp.id} (Player ${gp.index + 1})`);
        this.emit('connected', { gamepad: gp, playerIndex: gp.index });
        // polling is always running so no need to start it here
    }

    onGamepadDisconnected(event) {
        const gp = event.gamepad;
        delete this.gamepads[gp.index];
        delete this.previousStates[gp.index];
        
        console.log(`🎮 Gamepad disconnected: ${gp.id}`);
        this.emit('disconnected', { gamepad: gp, playerIndex: gp.index });
        
        // Keep polling alive even with no gamepads — allows hot-plug detection
        // without relying solely on the gamepadconnected event
    }

    startPolling() {
        this.polling = true;
        this.poll();
    }

    stopPolling() {
        this.polling = false;
        if (this.pollInterval) {
            cancelAnimationFrame(this.pollInterval);
            this.pollInterval = null;
        }
    }

    poll() {
        if (!this.polling) return;
        
        this.scanGamepads();
        
        for (const index in this.gamepads) {
            const gp = navigator.getGamepads()[index];
            if (!gp) continue;
            
            const prevState = this.previousStates[index];
            const currentState = this.captureState(gp);
            
            // Check button changes
            for (let i = 0; i < gp.buttons.length; i++) {
                const buttonName = this.buttonNames[i] || `button${i}`;
                const wasPressed = prevState.buttons[i];
                const isPressed = currentState.buttons[i];
                
                if (isPressed && !wasPressed) {
                    this.emit('buttondown', { 
                        playerIndex: parseInt(index), 
                        button: buttonName, 
                        buttonIndex: i 
                    });
                } else if (!isPressed && wasPressed) {
                    this.emit('buttonup', { 
                        playerIndex: parseInt(index), 
                        button: buttonName, 
                        buttonIndex: i 
                    });
                }
            }
            
            // Check axis changes (with deadzone)
            for (let i = 0; i < gp.axes.length; i++) {
                const axisName = this.axisNames[i] || `axis${i}`;
                const value = this.applyDeadzone(gp.axes[i]);
                const prevValue = this.applyDeadzone(prevState.axes[i] || 0);
                
                if (Math.abs(value - prevValue) > 0.01) {
                    this.emit('axismove', { 
                        playerIndex: parseInt(index), 
                        axis: axisName, 
                        axisIndex: i, 
                        value 
                    });
                }
            }
            
            this.previousStates[index] = currentState;
        }
        
        this.pollInterval = requestAnimationFrame(() => this.poll());
    }

    captureState(gamepad) {
        return {
            buttons: gamepad.buttons.map(b => b.pressed),
            axes: [...gamepad.axes]
        };
    }

    applyDeadzone(value) {
        if (Math.abs(value) < this.deadzone) return 0;
        return value;
    }

    /**
     * Get current state of a gamepad
     */
    getState(playerIndex = 0) {
        const gp = navigator.getGamepads()[playerIndex];
        if (!gp) return null;
        
        const state = {
            connected: true,
            id: gp.id,
            buttons: {},
            axes: {}
        };
        
        // Map buttons
        for (let i = 0; i < gp.buttons.length; i++) {
            const name = this.buttonNames[i] || `button${i}`;
            state.buttons[name] = gp.buttons[i].pressed;
        }
        
        // Map axes
        for (let i = 0; i < gp.axes.length; i++) {
            const name = this.axisNames[i] || `axis${i}`;
            state.axes[name] = this.applyDeadzone(gp.axes[i]);
        }
        
        return state;
    }

    /**
     * Check if a button is currently pressed
     */
    isPressed(playerIndex, button) {
        const state = this.getState(playerIndex);
        if (!state) return false;
        return state.buttons[button] || false;
    }

    /**
     * Get axis value
     */
    getAxis(playerIndex, axis) {
        const state = this.getState(playerIndex);
        if (!state) return 0;
        return state.axes[axis] || 0;
    }

    /**
     * Get number of connected gamepads
     */
    getConnectedCount() {
        return Object.keys(this.gamepads).length;
    }

    /**
     * Vibrate gamepad (if supported)
     */
    vibrate(playerIndex, duration = 200, weakMagnitude = 0.5, strongMagnitude = 0.5) {
        const gp = navigator.getGamepads()[playerIndex];
        if (gp && gp.vibrationActuator) {
            gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration,
                weakMagnitude,
                strongMagnitude
            });
        }
    }

    /**
     * Event handling
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(data));
        }
    }
}

// Create global gamepad manager
window.gamepadManager = new GamepadManager();

/**
 * Gamepad UI Widget - Shows connected controllers
 */
class GamepadWidget {
    constructor(containerId = 'gamepad-status') {
        this.containerId = containerId;
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        this.render();
        
        window.gamepadManager.on('connected', () => this.render());
        window.gamepadManager.on('disconnected', () => this.render());
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const count = window.gamepadManager.getConnectedCount();
        
        if (count === 0) {
            container.innerHTML = `
                <div class="gamepad-widget no-controller">
                    <span class="gamepad-icon">🎮</span>
                    <span class="gamepad-text">No controller - Press a button to connect</span>
                </div>
            `;
        } else {
            let controllersHtml = '';
            for (let i = 0; i < 4; i++) {
                const state = window.gamepadManager.getState(i);
                if (state) {
                    controllersHtml += `
                        <div class="gamepad-player active">
                            <span class="player-num">P${i + 1}</span>
                            <span class="gamepad-icon">🎮</span>
                        </div>
                    `;
                } else {
                    controllersHtml += `
                        <div class="gamepad-player inactive">
                            <span class="player-num">P${i + 1}</span>
                            <span class="gamepad-icon">○</span>
                        </div>
                    `;
                }
            }
            
            container.innerHTML = `
                <div class="gamepad-widget connected">
                    ${controllersHtml}
                </div>
            `;
        }
    }
}

window.GamepadWidget = GamepadWidget;

/**
 * Gamepad UI Navigator - Global UI navigation with controller
 * Handles menus, modals, buttons, and game navigation
 */
class GamepadUINavigator {
    constructor() {
        this.enabled = true;
        this.focusableSelectors = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), .game-card, .col-btn, .cell[tabindex], .memory-card';
        this.currentFocusIndex = 0;
        this.repeatDelay = 200; // ms between repeated navigation
        this.lastNavigationTime = 0;
        this.axisRepeatDelay = 250;
        this.lastAxisNavigationTime = { x: 0, y: 0 };
        
        // Track if we're in a grid-based context
        this.gridMode = false;
        this.gridColumns = 1;
        
        this.init();
    }
    
    init() {
        if (!window.gamepadManager) {
            console.warn('GamepadManager not found, UI Navigator disabled');
            return;
        }
        
        // Listen for button events
        window.gamepadManager.on('buttondown', (data) => this.handleButtonDown(data));
        
        // Listen for axis events (for stick navigation)
        window.gamepadManager.on('axismove', (data) => this.handleAxisMove(data));
        
        // Show controller hint on connection
        window.gamepadManager.on('connected', () => this.showControllerHint());
        
        // Focus tracking
        document.addEventListener('focusin', () => this.updateFocusIndex());
    }
    
    /**
     * Handle button press for UI navigation
     */
    handleButtonDown(data) {
        if (!this.enabled) return;
        
        const { button, playerIndex } = data;
        const now = Date.now();
        
        // Store current player for vibration feedback
        this.currentPlayerIndex = playerIndex;
        
        // Navigation with D-pad
        if (['up', 'down', 'left', 'right'].includes(button)) {
            if (now - this.lastNavigationTime < this.repeatDelay) return;
            this.lastNavigationTime = now;
            this.navigate(button, playerIndex);
            return;
        }
        
        // Action buttons
        switch (button) {
            case 'a': // Select/Confirm
                this.confirmAction(playerIndex);
                break;
            case 'b': // Back/Cancel
                this.cancelAction(playerIndex);
                break;
            case 'x': // Secondary action (e.g., toggle instructions)
                this.secondaryAction(playerIndex);
                break;
            case 'y': // Tertiary action (e.g., new game)
                this.tertiaryAction(playerIndex);
                break;
            case 'start': // Pause/Menu
                this.toggleMenu(playerIndex);
                break;
            case 'back': // Quick toggle instructions
                this.toggleInstructions();
                break;
            case 'lb': // Previous tab/section
                this.previousTab(playerIndex);
                break;
            case 'rb': // Next tab/section
                this.nextTab(playerIndex);
                break;
            case 'lt': // Quick action left (e.g., undo)
                this.quickActionLeft(playerIndex);
                break;
            case 'rt': // Quick action right (e.g., hint)
                this.quickActionRight(playerIndex);
                break;
        }
    }
    
    /**
     * Handle analog stick movement for navigation
     */
    handleAxisMove(data) {
        if (!this.enabled) return;
        
        const { axis, value, playerIndex } = data;
        const now = Date.now();
        const threshold = 0.5;
        
        // Left stick navigation
        if (axis === 'leftY') {
            if (now - this.lastAxisNavigationTime.y < this.axisRepeatDelay) return;
            if (value < -threshold) {
                this.lastAxisNavigationTime.y = now;
                this.navigate('up');
            } else if (value > threshold) {
                this.lastAxisNavigationTime.y = now;
                this.navigate('down');
            }
        }
        
        if (axis === 'leftX') {
            if (now - this.lastAxisNavigationTime.x < this.axisRepeatDelay) return;
            if (value < -threshold) {
                this.lastAxisNavigationTime.x = now;
                this.navigate('left');
            } else if (value > threshold) {
                this.lastAxisNavigationTime.x = now;
                this.navigate('right');
            }
        }
    }
    
    /**
     * Get all focusable elements
     */
    getFocusableElements() {
        // Check for open modals first
        const openModal = document.querySelector('.modal.show');
        const container = openModal || document;
        
        return Array.from(container.querySelectorAll(this.focusableSelectors))
            .filter(el => {
                // Filter out hidden elements
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       el.offsetParent !== null;
            });
    }
    
    /**
     * Navigate through UI elements
     */
    navigate(direction) {
        const elements = this.getFocusableElements();
        if (elements.length === 0) return;
        
        const currentElement = document.activeElement;
        let currentIndex = elements.indexOf(currentElement);
        
        // If nothing focused, start from the beginning
        if (currentIndex === -1) {
            currentIndex = 0;
        }
        
        // Detect grid mode (game boards, card grids, etc.)
        this.detectGridMode(elements, currentElement);
        
        let newIndex = currentIndex;
        
        if (this.gridMode && this.gridColumns > 1) {
            // Grid navigation
            switch (direction) {
                case 'up':
                    newIndex = Math.max(0, currentIndex - this.gridColumns);
                    break;
                case 'down':
                    newIndex = Math.min(elements.length - 1, currentIndex + this.gridColumns);
                    break;
                case 'left':
                    newIndex = Math.max(0, currentIndex - 1);
                    break;
                case 'right':
                    newIndex = Math.min(elements.length - 1, currentIndex + 1);
                    break;
            }
        } else {
            // Linear navigation
            switch (direction) {
                case 'up':
                case 'left':
                    newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
                    break;
                case 'down':
                case 'right':
                    newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
                    break;
            }
        }
        
        // Focus the new element
        if (elements[newIndex]) {
            elements[newIndex].focus();
            this.currentFocusIndex = newIndex;
            
            // Vibrate for feedback (use stored playerIndex or default to 0)
            const playerIdx = this.currentPlayerIndex !== undefined ? this.currentPlayerIndex : 0;
            window.gamepadManager.vibrate(playerIdx, 30, 0.1, 0);
        }
    }
    
    /**
     * Detect if we're navigating a grid layout
     */
    detectGridMode(elements, currentElement) {
        // Check for common grid containers
        const gridContainers = [
            '.board-grid', '.memory-grid', '.ultimate-board', 
            '.game-grid', '.column-buttons'
        ];
        
        for (const selector of gridContainers) {
            const grid = document.querySelector(selector);
            if (grid && grid.contains(currentElement)) {
                this.gridMode = true;
                // Try to determine columns from CSS grid or element count
                const style = window.getComputedStyle(grid);
                const templateColumns = style.gridTemplateColumns;
                if (templateColumns && templateColumns !== 'none') {
                    this.gridColumns = templateColumns.split(' ').length;
                } else {
                    // Fallback: estimate from element positions
                    if (elements.length > 0) {
                        const firstRow = elements.filter(el => {
                            const rect1 = elements[0].getBoundingClientRect();
                            const rect2 = el.getBoundingClientRect();
                            return Math.abs(rect1.top - rect2.top) < 10;
                        });
                        this.gridColumns = firstRow.length || 1;
                    } else {
                        this.gridColumns = 1;
                    }
                }
                return;
            }
        }
        
        this.gridMode = false;
        this.gridColumns = 1;
    }
    
    /**
     * Confirm/Select action (A button)
     */
    confirmAction(playerIndex = 0) {
        const activeElement = document.activeElement;
        
        if (activeElement && (activeElement.tagName === 'BUTTON' || 
            activeElement.tagName === 'A' || 
            activeElement.classList.contains('game-card') ||
            activeElement.classList.contains('cell') ||
            activeElement.classList.contains('memory-card') ||
            activeElement.classList.contains('col-btn'))) {
            activeElement.click();
            window.gamepadManager.vibrate(playerIndex, 50, 0.3, 0.1);
        }
    }
    
    /**
     * Cancel/Back action (B button)
     */
    cancelAction(playerIndex = 0) {
        // Close any open modal
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            const closeBtn = openModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.click();
                window.gamepadManager.vibrate(playerIndex, 30, 0.1, 0);
                return;
            }
            openModal.classList.remove('show');
            window.gamepadManager.vibrate(playerIndex, 30, 0.1, 0);
            return;
        }
        
        // Check for game over modal or other modals (use classList or computed style)
        const gameOverModal = document.getElementById('game-over-modal');
        if (gameOverModal) {
            const computedStyle = window.getComputedStyle(gameOverModal);
            if (computedStyle.display !== 'none' && !gameOverModal.classList.contains('hidden')) {
                const closeBtn = gameOverModal.querySelector('.modal-close, button');
                if (closeBtn) {
                    closeBtn.click();
                    window.gamepadManager.vibrate(playerIndex, 30, 0.1, 0);
                    return;
                }
            }
        }
        
        // Check if we're on a game page (not the main index)
        const isGamePage = window.location.pathname.includes('/games/');
        if (isGamePage) {
            // Navigate back to game library
            window.gamepadManager.vibrate(playerIndex, 50, 0.2, 0.1);
            window.location.href = '../index.html';
            return;
        }
        
        // On main page, focus the back link if present
        const backLink = document.querySelector('a[href*="index.html"]');
        if (backLink) {
            backLink.focus();
        }
    }
    
    /**
     * Secondary action (X button) - Toggle instructions
     */
    secondaryAction(playerIndex = 0) {
        const instructionsBtn = document.getElementById('toggle-instructions-btn');
        if (instructionsBtn) {
            instructionsBtn.click();
            window.gamepadManager.vibrate(playerIndex, 30, 0.2, 0);
        }
    }
    
    /**
     * Tertiary action (Y button) - New game
     */
    tertiaryAction(playerIndex = 0) {
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.click();
            window.gamepadManager.vibrate(playerIndex, 50, 0.3, 0.1);
        }
    }
    
    /**
     * Toggle menu/pause (Start button)
     */
    toggleMenu(playerIndex = 0) {
        // Try multiplayer button first
        const multiplayerBtn = document.getElementById('multiplayer-btn');
        if (multiplayerBtn) {
            multiplayerBtn.click();
            window.gamepadManager.vibrate(playerIndex, 50, 0.2, 0.1);
            return;
        }
        
        // Try login if not logged in
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn && window.getComputedStyle(loginBtn.parentElement).display !== 'none') {
            loginBtn.click();
            window.gamepadManager.vibrate(playerIndex, 50, 0.2, 0.1);
        }
    }
    
    /**
     * Toggle instructions (Back/Select button)
     */
    toggleInstructions() {
        const instructionsBtn = document.getElementById('toggle-instructions-btn');
        if (instructionsBtn) {
            instructionsBtn.click();
        }
    }
    
    /**
     * Previous tab (LB button)
     */
    previousTab(playerIndex = 0) {
        const tabs = document.querySelectorAll('.auth-tab, .mp-tab, .mode-btn, .filter-btn');
        const activeTab = document.querySelector('.auth-tab.active, .mp-tab.active, .mode-btn.active, .filter-btn.active');
        
        if (tabs.length > 0 && activeTab) {
            const tabArray = Array.from(tabs);
            const currentIndex = tabArray.indexOf(activeTab);
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabArray.length - 1;
            tabArray[prevIndex].click();
            tabArray[prevIndex].focus();
            window.gamepadManager.vibrate(playerIndex, 30, 0.1, 0);
        }
    }
    
    /**
     * Next tab (RB button)
     */
    nextTab(playerIndex = 0) {
        const tabs = document.querySelectorAll('.auth-tab, .mp-tab, .mode-btn, .filter-btn');
        const activeTab = document.querySelector('.auth-tab.active, .mp-tab.active, .mode-btn.active, .filter-btn.active');
        
        if (tabs.length > 0 && activeTab) {
            const tabArray = Array.from(tabs);
            const currentIndex = tabArray.indexOf(activeTab);
            const nextIndex = currentIndex < tabArray.length - 1 ? currentIndex + 1 : 0;
            tabArray[nextIndex].click();
            tabArray[nextIndex].focus();
            window.gamepadManager.vibrate(playerIndex, 30, 0.1, 0);
        }
    }
    
    /**
     * Quick action left (LT) - Could be undo or mode toggle
     */
    quickActionLeft(playerIndex = 0) {
        // Try AI mode button
        const aiBtn = document.getElementById('mode-ai');
        if (aiBtn) {
            aiBtn.click();
            window.gamepadManager.vibrate(playerIndex, 30, 0.1, 0);
        }
    }
    
    /**
     * Quick action right (RT) - Could be hint or local mode
     */
    quickActionRight(playerIndex = 0) {
        // Try local mode button
        const localBtn = document.getElementById('mode-local');
        if (localBtn) {
            localBtn.click();
            window.gamepadManager.vibrate(playerIndex, 30, 0.1, 0);
        }
    }
    
    /**
     * Update focus index when focus changes
     */
    updateFocusIndex() {
        const elements = this.getFocusableElements();
        const currentElement = document.activeElement;
        this.currentFocusIndex = elements.indexOf(currentElement);
    }
    
    /**
     * Show controller hint on connection
     */
    showControllerHint() {
        // Only show if not already shown this session
        if (sessionStorage.getItem('controllerHintShown')) return;
        
        const hint = document.createElement('div');
        hint.className = 'controller-hint';
        hint.innerHTML = `
            <div class="controller-hint-content">
                <span class="hint-icon">🎮</span>
                <div class="hint-text">
                    <strong>Controller Connected!</strong>
                    <small>D-pad/Stick: Navigate • A: Select • B: Back • Start: Menu</small>
                </div>
            </div>
        `;
        document.body.appendChild(hint);
        
        // Animate in
        setTimeout(() => hint.classList.add('show'), 10);
        
        // Remove after 4 seconds
        setTimeout(() => {
            hint.classList.remove('show');
            setTimeout(() => hint.remove(), 300);
        }, 4000);
        
        sessionStorage.setItem('controllerHintShown', 'true');
    }
    
    /**
     * Enable/disable navigation
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Create global UI navigator
window.gamepadUINavigator = new GamepadUINavigator();
