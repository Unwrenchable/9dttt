/**
 * Game Launcher Module
 * Opens games in a dedicated new browser window/tab for a clean, scroll-free experience.
 *
 * Features:
 * - Opens each game in its own window/tab (no iframe scroll glitches)
 * - Tracks open game windows and re-focuses them on repeat clicks
 * - Provides window.launchGame() / window.closeGame() API
 *
 * Part of the 9DTTT Game Library
 */

(function () {
    'use strict';

    class GameLauncher {
        constructor() {
            // Map of url -> WindowProxy so re-clicking focuses the open window
            this._openWindows = new Map();
        }

        /**
         * Open a game in a new browser window (or tab).
         * If the game is already open in a window, re-focus it instead of opening again.
         * @param {string} url   - Relative or absolute URL of the game page
         * @param {string} title - Display name of the game (used for window name)
         */
        open(url, title = 'Game') {
            // Resolve to an absolute URL so window.open gets a clean target
            const absUrl = new URL(url, window.location.href).href;

            // Re-focus existing window if still alive
            const existing = this._openWindows.get(absUrl);
            if (existing && !existing.closed) {
                existing.focus();
                return existing;
            }

            // Open in a new tab/window.
            // Using '_blank' lets the browser decide tab vs window per user preference.
            // The window name is sanitised to a valid identifier so the browser can
            // reuse the same named window if the user clicks the card again quickly.
            const winName = 'game_' + title.replace(/[^a-zA-Z0-9]/g, '_');
            const gameWin = window.open(absUrl, winName);

            if (gameWin) {
                this._openWindows.set(absUrl, gameWin);
                // Clean up map entry when game window closes
                const cleanup = setInterval(() => {
                    if (gameWin.closed) {
                        this._openWindows.delete(absUrl);
                        clearInterval(cleanup);
                    }
                }, 1000);
            } else {
                // Popup was blocked — fall back to same-tab navigation
                window.location.href = absUrl;
            }

            this._announce(`Opening ${title}`);
            return gameWin;
        }

        /**
         * Close the game window for the given URL (if tracked).
         * @param {string} [url] - URL of the game; omit to close all tracked windows.
         */
        close(url) {
            if (url) {
                const absUrl = new URL(url, window.location.href).href;
                const win = this._openWindows.get(absUrl);
                if (win && !win.closed) win.close();
                this._openWindows.delete(absUrl);
            } else {
                this._openWindows.forEach((win) => { if (!win.closed) win.close(); });
                this._openWindows.clear();
            }
        }

        /** Announce message to screen readers */
        _announce(message) {
            const el = document.createElement('div');
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            el.setAttribute('aria-atomic', 'true');
            el.style.cssText = 'position:absolute;left:-9999px;';
            el.textContent = message;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1000);
        }
    }

    // -------------------------------------------------------------------------
    // Global instance & API
    // -------------------------------------------------------------------------
    const launcher = new GameLauncher();

    /**
     * Launch a game in a new window/tab.
     * @param {string} url   - Game URL (relative or absolute)
     * @param {string} title - Human-readable game title
     */
    window.launchGame = function (url, title) {
        return launcher.open(url, title);
    };

    /**
     * Close a tracked game window.
     * @param {string} [url] - Game URL; omit to close all tracked windows.
     */
    window.closeGame = function (url) {
        launcher.close(url);
    };

    // -------------------------------------------------------------------------
    // Auto-intercept game card clicks on DOMContentLoaded
    // -------------------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        const gameCards = document.querySelectorAll('.game-card[href^="games/"]');

        gameCards.forEach(function (card) {
            const href = card.getAttribute('href');
            const title = card.querySelector('.game-title')?.textContent?.trim() || 'Game';

            // Override the default link navigation with our launcher
            card.addEventListener('click', function (e) {
                e.preventDefault();
                window.launchGame(href, title);
            });

            // Keyboard accessibility – Enter / Space activates the card
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.launchGame(href, title);
                }
            });
        });
    });

    // Export class for advanced use
    window.GameLauncher = GameLauncher;

})();
