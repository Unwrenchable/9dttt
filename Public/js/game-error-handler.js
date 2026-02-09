/**
 * Game Error Handler
 * Provides user-friendly error messages and recovery options
 * Prevents games from silently failing
 */

class GameErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 10;
        this.errorModal = null;
        this.init();
    }

    init() {
        // Create error modal
        this.createErrorModal();
        
        // Catch global errors
        window.addEventListener('error', (event) => {
            this.handleError({
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                type: 'javascript'
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                message: event.reason?.message || 'Promise rejection',
                error: event.reason,
                type: 'promise'
            });
        });

        // Catch canvas errors
        this.monitorCanvas();
    }

    createErrorModal() {
        const modal = document.createElement('div');
        modal.id = 'game-error-modal';
        modal.className = 'game-error-modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <style>
                .game-error-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 99999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    backdrop-filter: blur(10px);
                }
                
                .error-container {
                    max-width: 600px;
                    width: 90%;
                    background: linear-gradient(135deg, #2c1515 0%, #1a0a0a 100%);
                    border: 3px solid #ff4444;
                    border-radius: 15px;
                    padding: 30px;
                    color: #fff;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8),
                                0 0 40px rgba(255, 68, 68, 0.3);
                    animation: errorSlideIn 0.3s ease-out;
                }
                
                @keyframes errorSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .error-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid rgba(255, 68, 68, 0.3);
                }
                
                .error-icon {
                    font-size: 3rem;
                    animation: pulse 2s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                .error-title {
                    font-size: 1.5rem;
                    color: #ff4444;
                    margin: 0;
                }
                
                .error-message {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9rem;
                    color: #ffcccc;
                    line-height: 1.6;
                    border-left: 4px solid #ff4444;
                }
                
                .error-details {
                    font-size: 0.8rem;
                    color: #999;
                    margin: 10px 0;
                }
                
                .error-suggestions {
                    margin: 20px 0;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                
                .error-suggestions h4 {
                    color: #ff8844;
                    margin: 0 0 10px 0;
                    font-size: 1rem;
                }
                
                .error-suggestions ul {
                    margin: 0;
                    padding-left: 20px;
                    color: #ccc;
                    line-height: 1.8;
                }
                
                .error-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                
                .error-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 0.9rem;
                }
                
                .error-btn-primary {
                    background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
                    color: #fff;
                }
                
                .error-btn-primary:hover {
                    background: linear-gradient(135deg, #ff6666 0%, #ff0000 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 68, 68, 0.5);
                }
                
                .error-btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                }
                
                .error-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.5);
                }
                
                .error-history {
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 5px;
                    max-height: 150px;
                    overflow-y: auto;
                    font-size: 0.75rem;
                }
                
                .error-count {
                    color: #ff8844;
                    font-weight: bold;
                }
            </style>
            
            <div class="error-container">
                <div class="error-header">
                    <div class="error-icon">⚠️</div>
                    <h2 class="error-title">Game Error</h2>
                </div>
                
                <div class="error-message" id="errorMessage">
                    An error occurred while running the game.
                </div>
                
                <div class="error-details" id="errorDetails"></div>
                
                <div class="error-suggestions">
                    <h4>💡 Suggested Solutions:</h4>
                    <ul id="errorSuggestions">
                        <li>Refresh the page to restart the game</li>
                        <li>Clear your browser cache and try again</li>
                        <li>Check your internet connection</li>
                        <li>Try a different browser</li>
                    </ul>
                </div>
                
                <div class="error-actions">
                    <button class="error-btn error-btn-primary" onclick="window.gameErrorHandler.retryGame()">
                        🔄 Retry Game
                    </button>
                    <button class="error-btn error-btn-secondary" onclick="window.gameErrorHandler.goToLibrary()">
                        🏠 Game Library
                    </button>
                    <button class="error-btn error-btn-secondary" onclick="window.gameErrorHandler.reportError()">
                        📧 Report Issue
                    </button>
                    <button class="error-btn error-btn-secondary" onclick="window.gameErrorHandler.hideError()">
                        ✕ Close
                    </button>
                </div>
                
                <div class="error-history" id="errorHistory" style="display: none;">
                    <strong>Recent Errors:</strong>
                    <div id="errorHistoryList"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.errorModal = modal;
    }

    handleError(errorInfo) {
        console.error('Game Error:', errorInfo);
        
        // Add to error history
        this.errors.push({
            ...errorInfo,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last N errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Show error modal
        this.showError(errorInfo);
    }

    showError(errorInfo) {
        const messageEl = document.getElementById('errorMessage');
        const detailsEl = document.getElementById('errorDetails');
        const suggestionsEl = document.getElementById('errorSuggestions');
        
        // Format error message
        let message = this.getUserFriendlyMessage(errorInfo);
        messageEl.textContent = message;
        
        // Add technical details
        if (errorInfo.source || errorInfo.line) {
            detailsEl.textContent = `Location: ${errorInfo.source || 'Unknown'} (Line ${errorInfo.line || '?'})`;
        } else {
            detailsEl.textContent = '';
        }
        
        // Provide context-specific suggestions
        const suggestions = this.getSuggestions(errorInfo);
        suggestionsEl.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
        
        // Show error history if multiple errors
        const historyEl = document.getElementById('errorHistory');
        if (this.errors.length > 1) {
            historyEl.style.display = 'block';
            const historyListEl = document.getElementById('errorHistoryList');
            historyListEl.innerHTML = this.errors
                .slice(-5)
                .reverse()
                .map(e => `<div>${new Date(e.timestamp).toLocaleTimeString()}: ${e.message}</div>`)
                .join('');
        } else {
            historyEl.style.display = 'none';
        }
        
        // Show modal
        this.errorModal.style.display = 'flex';
    }

    hideError() {
        this.errorModal.style.display = 'none';
    }

    getUserFriendlyMessage(errorInfo) {
        const message = errorInfo.message || 'Unknown error';
        
        // Canvas errors
        if (message.includes('canvas') || message.includes('getContext')) {
            return '❌ Unable to initialize game graphics. Your browser may not support canvas rendering.';
        }
        
        // Gamepad errors
        if (message.includes('gamepad') || message.includes('controller')) {
            return '🎮 Controller error detected. Try disconnecting and reconnecting your controller.';
        }
        
        // Network errors
        if (message.includes('fetch') || message.includes('network') || message.includes('Failed to load')) {
            return '🌐 Network error. Check your internet connection and try again.';
        }
        
        // Audio errors
        if (message.includes('audio') || message.includes('sound')) {
            return '🔇 Audio system error. The game will continue without sound.';
        }
        
        // Permission errors
        if (message.includes('permission') || message.includes('blocked')) {
            return '🚫 Permission denied. Please check your browser settings.';
        }
        
        // Memory errors
        if (message.includes('memory') || message.includes('out of')) {
            return '💾 Memory error. Try closing other tabs and reloading the page.';
        }
        
        // Generic fallback
        return `❌ ${message}`;
    }

    getSuggestions(errorInfo) {
        const suggestions = [];
        const message = errorInfo.message?.toLowerCase() || '';
        
        if (message.includes('canvas') || message.includes('getcontext')) {
            suggestions.push('Try updating your browser to the latest version');
            suggestions.push('Enable hardware acceleration in your browser settings');
            suggestions.push('Try using Chrome, Firefox, or Edge browser');
        } else if (message.includes('gamepad') || message.includes('controller')) {
            suggestions.push('Disconnect and reconnect your controller');
            suggestions.push('Make sure your controller is supported (Xbox, PlayStation, Switch Pro)');
            suggestions.push('Try pressing a button on your controller to wake it up');
        } else if (message.includes('network') || message.includes('fetch')) {
            suggestions.push('Check your internet connection');
            suggestions.push('Disable any VPN or proxy');
            suggestions.push('Try refreshing the page');
        } else if (message.includes('audio') || message.includes('sound')) {
            suggestions.push('Check your system audio settings');
            suggestions.push('Make sure the game tab is not muted');
            suggestions.push('The game will work without audio');
        } else {
            suggestions.push('Refresh the page to restart the game');
            suggestions.push('Clear your browser cache (Ctrl+Shift+Delete)');
            suggestions.push('Try in an incognito/private window');
            suggestions.push('Update your browser to the latest version');
        }
        
        return suggestions;
    }

    monitorCanvas() {
        // Check for canvas initialization errors
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(...args) {
            try {
                const context = originalGetContext.apply(this, args);
                if (!context) {
                    window.gameErrorHandler?.handleError({
                        message: 'Failed to get canvas context. Canvas rendering may not be supported.',
                        type: 'canvas',
                        canvas: this
                    });
                }
                return context;
            } catch (error) {
                window.gameErrorHandler?.handleError({
                    message: error.message,
                    error: error,
                    type: 'canvas'
                });
                throw error;
            }
        };
    }

    retryGame() {
        this.hideError();
        location.reload();
    }

    goToLibrary() {
        // Navigate to game library
        if (window.location.pathname.includes('/games/')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
    }

    reportError() {
        // Create error report
        const errorReport = {
            errors: this.errors,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        // Copy to clipboard
        const reportText = JSON.stringify(errorReport, null, 2);
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(reportText).then(() => {
                alert('Error report copied to clipboard! Please paste it in a GitHub issue at:\nhttps://github.com/Unwrenchable/9dttt/issues');
            }).catch(() => {
                this.showReportDialog(reportText);
            });
        } else {
            this.showReportDialog(reportText);
        }
    }

    showReportDialog(reportText) {
        const textarea = document.createElement('textarea');
        textarea.value = reportText;
        textarea.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:60%;z-index:100000;background:#000;color:#fff;border:3px solid #ff4444;padding:20px;font-family:monospace;';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:100001;padding:10px 20px;background:#ff4444;color:#fff;border:none;cursor:pointer;';
        closeBtn.onclick = () => {
            textarea.remove();
            closeBtn.remove();
        };
        
        document.body.appendChild(textarea);
        document.body.appendChild(closeBtn);
        textarea.select();
    }

    // Helper method for games to wrap risky operations
    wrapGameFunction(fn, errorContext = '') {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handleError({
                    message: error.message,
                    error: error,
                    type: 'game',
                    context: errorContext
                });
                return null;
            }
        };
    }

    // Safe initialization wrapper for games
    static safeInit(initFunction, gameName = 'Game') {
        try {
            initFunction();
        } catch (error) {
            if (window.gameErrorHandler) {
                window.gameErrorHandler.handleError({
                    message: `Failed to initialize ${gameName}: ${error.message}`,
                    error: error,
                    type: 'initialization'
                });
            } else {
                console.error(`Failed to initialize ${gameName}:`, error);
                alert(`Failed to start ${gameName}. Please refresh the page and try again.\n\nError: ${error.message}`);
            }
        }
    }
}

// Initialize global error handler
window.gameErrorHandler = new GameErrorHandler();

// Export for use in game initialization
window.GameErrorHandler = GameErrorHandler;
