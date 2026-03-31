/**
 * Fullscreen Immersion Manager
 * Handles fullscreen mode with proper aspect ratio and controls
 */

class FullscreenManager {
    constructor(containerId = 'gameContainer') {
        this.container = document.getElementById(containerId);
        this.isFullscreen = false;
        this.beforeFullscreenStyle = null;
        this.setupFullscreenButton();
        this.setupEventListeners();
    }
    
    setupFullscreenButton() {
        // Create fullscreen button
        const button = document.createElement('button');
        button.id = 'fullscreenToggle';
        button.className = 'fullscreen-button';
        button.innerHTML = '⛶';
        button.title = 'Toggle Fullscreen (F11)';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            border: 2px solid #fff;
            border-radius: 8px;
            width: 44px;
            height: 44px;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;
        
        button.onmouseover = () => {
            button.style.background = 'rgba(255, 255, 255, 0.2)';
            button.style.transform = 'scale(1.1)';
        };
        button.onmouseout = () => {
            button.style.background = 'rgba(0, 0, 0, 0.7)';
            button.style.transform = 'scale(1)';
        };
        
        button.onclick = () => this.toggle();
        
        document.body.appendChild(button);
        this.button = button;
    }
    
    setupEventListeners() {
        // F11 key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggle();
            }
            
            // ESC to exit fullscreen
            if (e.key === 'Escape' && this.isFullscreen) {
                this.exit();
            }
        });
        
        // Fullscreen change events
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.onFullscreenChange());
        
        // Mobile orientation change
        window.addEventListener('orientationchange', () => {
            if (this.isFullscreen) {
                setTimeout(() => this.adjustLayout(), 100);
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.isFullscreen) {
                this.adjustLayout();
            }
        });
    }
    
    async toggle() {
        if (this.isFullscreen) {
            await this.exit();
        } else {
            await this.enter();
        }
    }
    
    async enter() {
        try {
            const element = this.container || document.documentElement;
            
            // Store current styles
            this.beforeFullscreenStyle = {
                width: element.style.width,
                height: element.style.height,
                position: element.style.position,
                background: element.style.background
            };
            
            // Request fullscreen
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            }
            
            this.isFullscreen = true;
            this.applyFullscreenStyles();
            this.adjustLayout();
            this.updateButton();
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('fullscreenEntered'));
            
        } catch (error) {
            console.error('Fullscreen error:', error);
            alert('Fullscreen not supported or blocked by browser');
        }
    }
    
    async exit() {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }
            
            this.isFullscreen = false;
            this.restoreStyles();
            this.updateButton();
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('fullscreenExited'));
            
        } catch (error) {
            console.error('Exit fullscreen error:', error);
        }
    }
    
    applyFullscreenStyles() {
        if (!this.container) return;
        
        const style = this.container.style;
        style.width = '100vw';
        style.height = '100vh';
        style.position = 'fixed';
        style.top = '0';
        style.left = '0';
        style.background = '#000';
        style.zIndex = '9998';
        style.display = 'flex';
        style.alignItems = 'center';
        style.justifyContent = 'center';
    }
    
    restoreStyles() {
        if (!this.container || !this.beforeFullscreenStyle) return;
        
        const style = this.container.style;
        style.width = this.beforeFullscreenStyle.width;
        style.height = this.beforeFullscreenStyle.height;
        style.position = this.beforeFullscreenStyle.position;
        style.background = this.beforeFullscreenStyle.background;
        style.top = '';
        style.left = '';
        style.zIndex = '';
    }
    
    adjustLayout() {
        // Find canvas elements and adjust them
        const canvases = this.container 
            ? this.container.querySelectorAll('canvas') 
            : document.querySelectorAll('canvas');
        
        canvases.forEach(canvas => {
            const aspectRatio = canvas.width / canvas.height;
            const windowAspect = window.innerWidth / window.innerHeight;
            
            if (windowAspect > aspectRatio) {
                // Window is wider - fit to height
                canvas.style.height = '100vh';
                canvas.style.width = (aspectRatio * window.innerHeight) + 'px';
            } else {
                // Window is taller - fit to width
                canvas.style.width = '100vw';
                canvas.style.height = (window.innerWidth / aspectRatio) + 'px';
            }
            
            canvas.style.maxWidth = '100vw';
            canvas.style.maxHeight = '100vh';
            canvas.style.objectFit = 'contain';
        });
    }
    
    updateButton() {
        if (this.button) {
            this.button.innerHTML = this.isFullscreen ? '⛶' : '⛶';
            this.button.title = this.isFullscreen 
                ? 'Exit Fullscreen (ESC)' 
                : 'Enter Fullscreen (F11)';
        }
    }
    
    onFullscreenChange() {
        const isCurrentlyFullscreen = Boolean(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        
        if (isCurrentlyFullscreen !== this.isFullscreen) {
            this.isFullscreen = isCurrentlyFullscreen;
            
            if (this.isFullscreen) {
                this.applyFullscreenStyles();
                this.adjustLayout();
            } else {
                this.restoreStyles();
            }
            
            this.updateButton();
        }
    }
    
    isSupported() {
        return document.fullscreenEnabled ||
               document.webkitFullscreenEnabled ||
               document.mozFullScreenEnabled ||
               document.msFullscreenEnabled;
    }
}

// Initialize global fullscreen manager
window.fullscreenManager = new FullscreenManager();

// Auto-hide cursor in fullscreen after 3 seconds of inactivity
let cursorTimeout;
document.addEventListener('mousemove', () => {
    if (window.fullscreenManager?.isFullscreen) {
        document.body.style.cursor = 'default';
        clearTimeout(cursorTimeout);
        cursorTimeout = setTimeout(() => {
            if (window.fullscreenManager?.isFullscreen) {
                document.body.style.cursor = 'none';
            }
        }, 3000);
    } else {
        document.body.style.cursor = 'default';
    }
});

// Desktop: auto-enter fullscreen on first user interaction (click or keydown)
(function() {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 1);
    if (isMobile) return;

    let triggered = false;
    function tryAutoFullscreen() {
        if (triggered) return;
        triggered = true;
        document.removeEventListener('click', tryAutoFullscreen, true);
        document.removeEventListener('keydown', tryAutoFullscreen, true);
        if (window.fullscreenManager && !window.fullscreenManager.isFullscreen) {
            window.fullscreenManager.enter().catch(function() { /* silently ignore if blocked */ });
        }
    }

    document.addEventListener('click', tryAutoFullscreen, true);
    document.addEventListener('keydown', tryAutoFullscreen, true);
})();

// Mobile: show a "Tap to go fullscreen" prompt on first interaction
(function() {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 1);
    if (!isMobile) return;

    function showMobileFullscreenPrompt() {
        if (document.getElementById('fsm-mobile-prompt')) return;

        const overlay = document.createElement('div');
        overlay.id = 'fsm-mobile-prompt';
        overlay.setAttribute('role', 'button');
        overlay.setAttribute('aria-label', 'Tap to enter fullscreen and start game');
        overlay.style.cssText = [
            'position:fixed', 'bottom:0', 'left:0', 'right:0',
            'background:linear-gradient(transparent,rgba(0,0,0,0.85) 30%)',
            'color:#fff', 'text-align:center', 'padding:24px 16px 32px',
            'z-index:99998', 'cursor:pointer', 'pointer-events:auto',
            'font-family:sans-serif', 'transition:opacity 0.3s ease',
            'display:flex', 'flex-direction:column', 'align-items:center',
            'gap:8px', 'user-select:none', '-webkit-user-select:none'
        ].join(';');

        overlay.innerHTML =
            '<span style="font-size:2rem;">⛶</span>' +
            '<span style="font-size:1.1rem;font-weight:bold;">Tap for Fullscreen</span>' +
            '<span style="font-size:0.85rem;opacity:0.75;">Best experience in fullscreen mode</span>';

        function dismiss() {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 350);
            if (window.fullscreenManager) {
                window.fullscreenManager.enter().catch((err) => {
                    console.warn('Fullscreen request failed:', err && err.message || err);
                });
            }
        }

        overlay.addEventListener('touchstart', function(e) {
            e.preventDefault();
            dismiss();
        }, { passive: false });
        overlay.addEventListener('click', dismiss);

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 350);
            }
        }, 8000);

        document.body.appendChild(overlay);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showMobileFullscreenPrompt);
    } else {
        showMobileFullscreenPrompt();
    }
})();
