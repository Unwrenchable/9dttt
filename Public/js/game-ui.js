/**
 * Game UI Components
 * Auth modals, multiplayer controls, and profile display
 */

class GameUI {
    constructor() {
        this.authModal = null;
        this.profileModal = null;
        this.multiplayerModal = null;
        this.onlineMode = false;
    }

    /**
     * Initialize UI components
     */
    async init() {
        this.createAuthModal();
        this.createProfileModal();
        this.createMultiplayerModal();
        this.createHeaderUI();
        
        // Initialize auth client (unified auth provides compatibility layer)
        if (window.authClient) {
            await window.authClient.init();
            this.updateAuthUI();
            
            // Listen for auth state changes
            window.authClient.onAuthStateChanged(() => this.updateAuthUI());
        }
        
        // Check URL params for auth callbacks (legacy)
        this.handleAuthCallback();
    }

    /**
     * Handle OAuth callback from URL params
     */
    handleAuthCallback() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth_success') === 'true') {
            const token = params.get('token');
            if (token) {
                localStorage.setItem('auth_token', token);
                window.authClient.token = token;
                window.authClient.init();
            }
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.get('auth_error')) {
            this.showNotification('Login failed: ' + params.get('auth_error'), 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    /**
     * Create header UI with auth buttons
     */
    createHeaderUI() {
        const header = document.querySelector('header');
        if (!header) return;

        // Create user info section
        const userSection = document.createElement('div');
        userSection.id = 'user-section';
        userSection.className = 'user-section';
        userSection.innerHTML = `
            <div class="auth-buttons" id="auth-buttons">
                <button id="signin-btn" class="auth-btn signin-unified">
                    <span class="signin-icon">👤</span>
                    <span class="signin-text">Sign In</span>
                </button>
            </div>
            <div class="user-info" id="user-info" style="display: none;">
                <div class="user-avatar" id="user-avatar"></div>
                <span class="user-name" id="user-name"></span>
                <button id="profile-btn" class="auth-btn secondary small">Profile</button>
                <button id="logout-btn" class="auth-btn secondary small">Logout</button>
            </div>
        `;
        header.appendChild(userSection);

        // Create multiplayer button
        const controls = document.querySelector('.controls');
        if (controls) {
            const multiplayerBtn = document.createElement('button');
            multiplayerBtn.id = 'multiplayer-btn';
            multiplayerBtn.className = 'secondary';
            multiplayerBtn.textContent = '🌐 Play Online';
            multiplayerBtn.setAttribute('aria-label', 'Play online multiplayer');
            controls.insertBefore(multiplayerBtn, controls.firstChild);
            
            multiplayerBtn.addEventListener('click', () => this.showMultiplayerModal());
        }

        // Event listeners
        document.getElementById('signin-btn')?.addEventListener('click', () => {
            if (window.authUI) {
                window.authUI.show();
            } else {
                this.showAuthModal('login');
            }
        });
        document.getElementById('profile-btn')?.addEventListener('click', () => this.showProfileModal());
        document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
    }

    /**
     * Create auth modal
     */
    createAuthModal() {
        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'auth-modal-title');
        modal.setAttribute('aria-modal', 'true');
        
        modal.innerHTML = `
            <div class="modal-content auth-modal-content">
                <button class="modal-close" id="auth-modal-close" aria-label="Close">&times;</button>
                <h2 id="auth-modal-title">Login</h2>
                
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Login</button>
                    <button class="auth-tab" data-tab="register">Register</button>
                </div>
                
                <div class="auth-form-container">
                    <!-- Login Form -->
                    <form id="login-form" class="auth-form">
                        <div class="form-group">
                            <label for="login-username">Username or Email</label>
                            <input type="text" id="login-username" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label for="login-password">Password</label>
                            <input type="password" id="login-password" required autocomplete="current-password">
                        </div>
                        <div class="form-error" id="login-error"></div>
                        <button type="submit" class="auth-submit">Login</button>
                    </form>
                    
                    <!-- Register Form -->
                    <form id="register-form" class="auth-form" style="display: none;">
                        <div class="form-group">
                            <label for="register-username">Username</label>
                            <input type="text" id="register-username" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+" autocomplete="username">
                            <small>3-20 characters, letters, numbers, and underscores only</small>
                        </div>
                        <div class="form-group">
                            <label for="register-email">Email</label>
                            <input type="email" id="register-email" required autocomplete="email">
                        </div>
                        <div class="form-group">
                            <label for="register-password">Password</label>
                            <input type="password" id="register-password" required minlength="6" autocomplete="new-password">
                            <small>At least 6 characters</small>
                        </div>
                        <div class="form-group">
                            <label for="register-confirm">Confirm Password</label>
                            <input type="password" id="register-confirm" required autocomplete="new-password">
                        </div>
                        <div class="form-error" id="register-error"></div>
                        <button type="submit" class="auth-submit">Create Account</button>
                    </form>
                </div>
                
                <div class="auth-divider">
                    <span>or continue with</span>
                </div>
                
                <div class="oauth-buttons" id="oauth-buttons">
                    <button class="oauth-btn browser-credential-btn" data-provider="browser" title="Use saved password from your browser">
                        <span class="oauth-icon">🔐</span> Saved Password
                    </button>
                </div>
                <p class="oauth-note" style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin-top: 8px;">
                    Use your browser's saved passwords for quick sign-in
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.authModal = modal;
        
        // Event listeners
        modal.querySelector('#auth-modal-close').addEventListener('click', () => this.hideAuthModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideAuthModal();
        });
        
        // Tab switching
        modal.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.tab));
        });
        
        // Form submissions
        modal.querySelector('#login-form').addEventListener('submit', (e) => this.handleLogin(e));
        modal.querySelector('#register-form').addEventListener('submit', (e) => this.handleRegister(e));
        
        // Browser credential button
        modal.querySelector('.browser-credential-btn')?.addEventListener('click', () => this.handleBrowserCredentialAuth());
    }

    /**
     * Create profile modal
     */
    createProfileModal() {
        const modal = document.createElement('div');
        modal.id = 'profile-modal';
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'profile-modal-title');
        modal.setAttribute('aria-modal', 'true');
        
        modal.innerHTML = `
            <div class="modal-content profile-modal-content">
                <button class="modal-close" id="profile-modal-close" aria-label="Close">&times;</button>
                <h2 id="profile-modal-title">Your Profile</h2>
                
                <div class="profile-header">
                    <div class="profile-avatar" id="profile-avatar"></div>
                    <div class="profile-info">
                        <h3 id="profile-username"></h3>
                        <p id="profile-email"></p>
                    </div>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value" id="stat-wins">0</span>
                        <span class="stat-label">Wins</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-losses">0</span>
                        <span class="stat-label">Losses</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-draws">0</span>
                        <span class="stat-label">Draws</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-streak">0</span>
                        <span class="stat-label">Best Streak</span>
                    </div>
                </div>
                
                <form id="profile-form" class="profile-form">
                    <div class="form-group">
                        <label for="profile-displayname">Display Name</label>
                        <input type="text" id="profile-displayname" maxlength="30">
                    </div>
                    <div class="form-group">
                        <label for="profile-bio">Bio</label>
                        <textarea id="profile-bio" maxlength="200" rows="3"></textarea>
                    </div>
                    <button type="submit" class="auth-submit">Save Changes</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.profileModal = modal;
        
        // Event listeners
        modal.querySelector('#profile-modal-close').addEventListener('click', () => this.hideProfileModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideProfileModal();
        });
        modal.querySelector('#profile-form').addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }

    /**
     * Create multiplayer modal
     */
    createMultiplayerModal() {
        const modal = document.createElement('div');
        modal.id = 'multiplayer-modal';
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'multiplayer-modal-title');
        modal.setAttribute('aria-modal', 'true');
        
        modal.innerHTML = `
            <div class="modal-content multiplayer-modal-content">
                <button class="modal-close" id="multiplayer-modal-close" aria-label="Close">&times;</button>
                <h2 id="multiplayer-modal-title">🌐 Play Online</h2>
                
                <div class="multiplayer-options" id="multiplayer-options">
                    <div class="mp-option" id="mp-not-logged-in">
                        <p>Please log in to play online multiplayer!</p>
                        <button id="mp-login-btn" class="auth-submit">Login / Register</button>
                    </div>
                    
                    <div class="mp-option mp-logged-in" style="display: none;">
                        <!-- Time Control Selection -->
                        <div class="time-control-section">
                            <label>Select Time Control:</label>
                            <div class="time-control-buttons" id="time-control-buttons">
                                <button class="tc-btn active" data-tc="blitz-5">⚡ 5 min</button>
                                <button class="tc-btn" data-tc="rapid-10">🕐 10 min</button>
                                <button class="tc-btn" data-tc="rapid-15">🕑 15 min</button>
                                <button class="tc-btn" data-tc="daily">📅 Daily</button>
                            </div>
                        </div>
                        
                        <!-- Tabs for different modes -->
                        <div class="mp-tabs">
                            <button class="mp-tab active" data-tab="quick">Quick Play</button>
                            <button class="mp-tab" data-tab="friends">Friends</button>
                            <button class="mp-tab" data-tab="private">Private</button>
                        </div>
                        
                        <!-- Quick Play Tab -->
                        <div class="mp-tab-content" id="mp-tab-quick">
                            <button class="mp-btn" id="mp-find-match">
                                <span class="mp-icon">🔍</span>
                                <span class="mp-text">
                                    <strong>Find Match</strong>
                                    <small>Play against a random opponent</small>
                                </span>
                            </button>
                        </div>
                        
                        <!-- Friends Tab -->
                        <div class="mp-tab-content" id="mp-tab-friends" style="display: none;">
                            <div class="friends-search">
                                <input type="text" id="friend-search-input" placeholder="Search players...">
                                <button id="friend-search-btn" class="secondary small">Search</button>
                            </div>
                            <div class="friends-list" id="friends-list">
                                <p class="loading-text">Loading friends...</p>
                            </div>
                            <div class="search-results" id="search-results" style="display: none;"></div>
                        </div>
                        
                        <!-- Private Game Tab -->
                        <div class="mp-tab-content" id="mp-tab-private" style="display: none;">
                            <button class="mp-btn" id="mp-create-private">
                                <span class="mp-icon">🔒</span>
                                <span class="mp-text">
                                    <strong>Create Private Game</strong>
                                    <small>Get a code to share with a friend</small>
                                </span>
                            </button>
                            
                            <div class="mp-join-section">
                                <input type="text" id="mp-join-code" placeholder="Enter game code">
                                <button id="mp-join-btn" class="auth-submit">Join</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mp-status" id="mp-status" style="display: none;">
                        <div class="mp-loading"></div>
                        <p id="mp-status-text">Connecting...</p>
                        <button id="mp-cancel-btn" class="secondary">Cancel</button>
                    </div>
                    
                    <div class="mp-game-code" id="mp-game-code" style="display: none;">
                        <p>Share this code with your friend:</p>
                        <div class="game-code-display" id="game-code-display"></div>
                        <button id="mp-copy-code" class="secondary">Copy Code</button>
                        <p class="waiting-text">Waiting for opponent to join...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.multiplayerModal = modal;
        this.selectedTimeControl = 'blitz-5';
        
        // Event listeners
        modal.querySelector('#multiplayer-modal-close').addEventListener('click', () => this.hideMultiplayerModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideMultiplayerModal();
        });
        
        modal.querySelector('#mp-login-btn')?.addEventListener('click', () => {
            this.hideMultiplayerModal();
            this.showAuthModal('login');
        });
        
        // Time control selection
        modal.querySelectorAll('.tc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.tc-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTimeControl = btn.dataset.tc;
            });
        });
        
        // Tab switching
        modal.querySelectorAll('.mp-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchMultiplayerTab(tab.dataset.tab));
        });
        
        modal.querySelector('#mp-find-match')?.addEventListener('click', () => this.handleFindMatch());
        modal.querySelector('#mp-create-private')?.addEventListener('click', () => this.handleCreatePrivate());
        modal.querySelector('#mp-join-btn')?.addEventListener('click', () => this.handleJoinPrivate());
        modal.querySelector('#mp-cancel-btn')?.addEventListener('click', () => this.handleCancelMatchmaking());
        modal.querySelector('#mp-copy-code')?.addEventListener('click', () => this.handleCopyCode());
        
        // Friends search
        modal.querySelector('#friend-search-btn')?.addEventListener('click', () => this.handleFriendSearch());
        modal.querySelector('#friend-search-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleFriendSearch();
        });
    }

    /**
     * Switch multiplayer tab
     */
    switchMultiplayerTab(tab) {
        const modal = this.multiplayerModal;
        modal.querySelectorAll('.mp-tab').forEach(t => t.classList.remove('active'));
        modal.querySelector(`.mp-tab[data-tab="${tab}"]`).classList.add('active');
        
        modal.querySelectorAll('.mp-tab-content').forEach(c => c.style.display = 'none');
        modal.querySelector(`#mp-tab-${tab}`).style.display = 'block';
        
        // Load friends when friends tab is selected
        if (tab === 'friends') {
            this.loadFriendsList();
        }
    }

    /**
     * Load friends list
     */
    async loadFriendsList() {
        const listEl = this.multiplayerModal.querySelector('#friends-list');
        listEl.innerHTML = '<p class="loading-text">Loading friends...</p>';
        
        const result = await window.authClient.getFollowing();
        
        if (result.success && result.following.length > 0) {
            listEl.innerHTML = result.following.map(friend => `
                <div class="friend-item">
                    <div class="friend-avatar">
                        ${friend.avatar?.type === 'custom' 
                            ? `<img src="${friend.avatar.data}" alt="">` 
                            : `<div class="avatar-initial" style="background: ${friend.avatar?.color || '#4a90e2'}">${friend.avatar?.initial || friend.username[0].toUpperCase()}</div>`
                        }
                    </div>
                    <div class="friend-info">
                        <span class="friend-name">${friend.displayName || friend.username}</span>
                        <span class="friend-status ${friend.isOnline ? 'online' : 'offline'}">
                            ${friend.isOnline ? '● Online' : '○ Offline'}
                        </span>
                    </div>
                    <button class="challenge-btn ${friend.isOnline ? '' : 'disabled'}" 
                            data-username="${friend.username}"
                            ${friend.isOnline ? '' : 'disabled'}>
                        Challenge
                    </button>
                </div>
            `).join('');
            
            // Add challenge button listeners
            listEl.querySelectorAll('.challenge-btn:not(.disabled)').forEach(btn => {
                btn.addEventListener('click', () => this.handleChallengeFriend(btn.dataset.username));
            });
        } else if (result.success) {
            listEl.innerHTML = `
                <p class="empty-text">No friends yet!</p>
                <p class="empty-hint">Search for players above to add friends.</p>
            `;
        } else {
            listEl.innerHTML = '<p class="error-text">Failed to load friends</p>';
        }
    }

    /**
     * Handle friend search
     */
    async handleFriendSearch() {
        const input = this.multiplayerModal.querySelector('#friend-search-input');
        const query = input.value.trim();
        
        if (query.length < 2) {
            this.showNotification('Enter at least 2 characters to search', 'error');
            return;
        }
        
        const resultsEl = this.multiplayerModal.querySelector('#search-results');
        resultsEl.style.display = 'block';
        resultsEl.innerHTML = '<p class="loading-text">Searching...</p>';
        
        const result = await window.authClient.searchUsers(query);
        
        if (result.success && result.users.length > 0) {
            resultsEl.innerHTML = `
                <h4>Search Results</h4>
                ${result.users.map(user => `
                    <div class="friend-item">
                        <div class="friend-avatar">
                            ${user.avatar?.type === 'custom' 
                                ? `<img src="${user.avatar.data}" alt="">` 
                                : `<div class="avatar-initial" style="background: ${user.avatar?.color || '#4a90e2'}">${user.avatar?.initial || user.username[0].toUpperCase()}</div>`
                            }
                        </div>
                        <div class="friend-info">
                            <span class="friend-name">${user.displayName || user.username}</span>
                            <span class="friend-status ${user.isOnline ? 'online' : 'offline'}">
                                ${user.isOnline ? '● Online' : '○ Offline'}
                            </span>
                        </div>
                        <div class="friend-actions">
                            ${user.isFollowing 
                                ? '<span class="following-badge">Following</span>' 
                                : `<button class="follow-btn small" data-username="${user.username}">Follow</button>`
                            }
                            ${user.isOnline 
                                ? `<button class="challenge-btn small" data-username="${user.username}">Challenge</button>` 
                                : ''
                            }
                        </div>
                    </div>
                `).join('')}
            `;
            
            // Add event listeners
            resultsEl.querySelectorAll('.follow-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const result = await window.authClient.followUser(btn.dataset.username);
                    if (result.success) {
                        btn.outerHTML = '<span class="following-badge">Following</span>';
                        this.showNotification('Now following ' + btn.dataset.username, 'success');
                    }
                });
            });
            
            resultsEl.querySelectorAll('.challenge-btn').forEach(btn => {
                btn.addEventListener('click', () => this.handleChallengeFriend(btn.dataset.username));
            });
        } else if (result.success) {
            resultsEl.innerHTML = '<p class="empty-text">No players found</p>';
        } else {
            resultsEl.innerHTML = '<p class="error-text">Search failed</p>';
        }
    }

    /**
     * Handle challenge friend
     */
    handleChallengeFriend(username) {
        if (!window.authClient.isLoggedIn()) {
            this.showNotification('Please login first', 'error');
            return;
        }
        
        if (!window.multiplayerClient.isConnected) {
            window.multiplayerClient.connect(window.authClient.token);
        }
        
        this.setupMultiplayerListeners();
        this.showMatchmakingStatus(`Sending challenge to ${username}...`);
        
        const sendChallenge = () => {
            window.multiplayerClient.challengePlayer(username, 'ultimate-tictactoe', this.selectedTimeControl);
        };
        
        if (window.multiplayerClient.isConnected) {
            sendChallenge();
        } else {
            window.multiplayerClient.on('authenticated', sendChallenge);
        }
    }

    /**
     * Show auth modal
     */
    async showAuthModal(tab = 'login') {
        this.authModal.classList.add('show');
        this.switchAuthTab(tab);
        this.authModal.querySelector(`#${tab}-username, #${tab}-email`)?.focus();
        
        // Check Firebase and browser auth availability and update OAuth buttons
        await this.updateOAuthButtons();
    }

    /**
     * Update OAuth buttons based on browser auth availability
     */
    async updateOAuthButtons() {
        const oauthButtons = this.authModal.querySelector('#oauth-buttons');
        const oauthNote = this.authModal.querySelector('.oauth-note');
        const divider = this.authModal.querySelector('.auth-divider');
        const browserCredBtn = this.authModal.querySelector('.browser-credential-btn');
        
        // Check browser credential API support
        const browserAuthSupported = window.browserAuth && window.browserAuth.isSupported();
        
        // Update browser credential button visibility
        if (browserCredBtn) {
            browserCredBtn.style.display = browserAuthSupported ? 'flex' : 'none';
        }
        
        if (browserAuthSupported) {
            // Show OAuth section
            if (oauthButtons) oauthButtons.style.display = 'flex';
            if (divider) divider.style.display = 'flex';
            
            // Update note
            if (oauthNote) {
                oauthNote.textContent = '🔐 Use passwords saved in your browser (Chrome, Edge, Safari)';
                oauthNote.style.display = 'block';
            }
        } else {
            // No OAuth options available
            if (oauthButtons) oauthButtons.style.display = 'none';
            if (divider) divider.style.display = 'none';
        }
    }

    /**
     * Hide auth modal
     */
    hideAuthModal() {
        this.authModal.classList.remove('show');
        this.clearAuthErrors();
    }

    /**
     * Switch auth tab
     */
    switchAuthTab(tab) {
        const modal = this.authModal;
        modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        modal.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        modal.querySelector('#login-form').style.display = tab === 'login' ? 'block' : 'none';
        modal.querySelector('#register-form').style.display = tab === 'register' ? 'block' : 'none';
        modal.querySelector('#auth-modal-title').textContent = tab === 'login' ? 'Login' : 'Create Account';
    }

    /**
     * Clear auth errors
     */
    clearAuthErrors() {
        this.authModal.querySelector('#login-error').textContent = '';
        this.authModal.querySelector('#register-error').textContent = '';
    }

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const username = form.querySelector('#login-username').value;
        const password = form.querySelector('#login-password').value;
        const errorEl = form.querySelector('#login-error');
        const submitBtn = form.querySelector('.auth-submit');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        const result = await window.authClient.login(username, password);
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
        
        if (result.success) {
            this.hideAuthModal();
            this.showNotification('Welcome back, ' + result.user.username + '!', 'success');
        } else {
            errorEl.textContent = result.error;
        }
    }

    /**
     * Handle register form submission
     */
    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const username = form.querySelector('#register-username').value;
        const email = form.querySelector('#register-email').value;
        const password = form.querySelector('#register-password').value;
        const confirm = form.querySelector('#register-confirm').value;
        const errorEl = form.querySelector('#register-error');
        const submitBtn = form.querySelector('.auth-submit');
        
        if (password !== confirm) {
            errorEl.textContent = 'Passwords do not match';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        const result = await window.authClient.register(username, email, password);
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        
        if (result.success) {
            this.hideAuthModal();
            let message = 'Welcome, ' + result.user.username + '!';
            if (result.bonus) {
                message += ' ' + result.bonus.description;
            }
            this.showNotification(message, 'success');
        } else {
            errorEl.textContent = result.error;
        }
    }

    /**
     * Handle browser credential authentication (Saved Password)
     */
    async handleBrowserCredentialAuth() {
        if (!window.browserAuth || !window.browserAuth.isSupported()) {
            this.showNotification('Browser credential storage is not supported in this browser.', 'error');
            return;
        }

        try {
            const result = await window.browserAuth.requestCredential();
            
            if (result.success) {
                this.hideAuthModal();
                const message = `Welcome back, ${result.user.displayName || result.user.username}!`;
                this.showNotification(message, 'success');
            } else if (result.error !== 'No credential selected') {
                // Only show error if it's not just the user cancelling
                this.showNotification(result.error || 'Authentication failed', 'error');
            }
        } catch (error) {
            console.error('Browser credential auth error:', error);
            this.showNotification('Failed to retrieve saved credentials', 'error');
        }
    }
    /**
     * Handle OAuth login (Legacy - kept for backwards compatibility)
     */
    handleOAuth(provider) {
        window.location.href = `/api/auth/oauth/${provider}`;
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        window.authClient.logout();
        if (window.multiplayerClient.isConnected) {
            window.multiplayerClient.disconnect();
        }
        this.showNotification('Logged out successfully', 'success');
    }

    /**
     * Show profile modal
     */
    showProfileModal() {
        const user = window.authClient.user;
        if (!user) return;
        
        const modal = this.profileModal;
        
        // Update avatar
        const avatarEl = modal.querySelector('#profile-avatar');
        if (user.profile.avatar.type === 'custom') {
            avatarEl.innerHTML = `<img src="${user.profile.avatar.data}" alt="Avatar">`;
        } else {
            avatarEl.innerHTML = `<div class="avatar-initial" style="background: ${user.profile.avatar.color}">${user.profile.avatar.initial}</div>`;
        }
        
        // Update info
        modal.querySelector('#profile-username').textContent = user.displayName || user.username;
        modal.querySelector('#profile-email').textContent = user.email;
        
        // Update stats
        modal.querySelector('#stat-wins').textContent = user.stats.wins;
        modal.querySelector('#stat-losses').textContent = user.stats.losses;
        modal.querySelector('#stat-draws').textContent = user.stats.draws;
        modal.querySelector('#stat-streak').textContent = user.stats.bestWinStreak;
        
        // Update form
        modal.querySelector('#profile-displayname').value = user.displayName || '';
        modal.querySelector('#profile-bio').value = user.profile.bio || '';
        
        modal.classList.add('show');
    }

    /**
     * Hide profile modal
     */
    hideProfileModal() {
        this.profileModal.classList.remove('show');
    }

    /**
     * Handle profile update
     */
    async handleProfileUpdate(e) {
        e.preventDefault();
        const form = e.target;
        const displayName = form.querySelector('#profile-displayname').value;
        const bio = form.querySelector('#profile-bio').value;
        const submitBtn = form.querySelector('.auth-submit');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        const result = await window.authClient.updateProfile({ displayName, bio });
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
        
        if (result.success) {
            this.showNotification('Profile updated!', 'success');
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    /**
     * Show multiplayer modal
     */
    showMultiplayerModal() {
        const modal = this.multiplayerModal;
        const isLoggedIn = window.authClient.isLoggedIn();
        
        modal.querySelector('#mp-not-logged-in').style.display = isLoggedIn ? 'none' : 'block';
        modal.querySelectorAll('.mp-logged-in').forEach(el => {
            el.style.display = isLoggedIn ? 'block' : 'none';
        });
        modal.querySelector('#mp-status').style.display = 'none';
        modal.querySelector('#mp-game-code').style.display = 'none';
        
        modal.classList.add('show');
    }

    /**
     * Hide multiplayer modal
     */
    hideMultiplayerModal() {
        this.multiplayerModal.classList.remove('show');
    }

    /**
     * Handle find match
     */
    handleFindMatch() {
        if (!window.authClient.isLoggedIn()) {
            this.showNotification('Please login first', 'error');
            return;
        }
        
        // Connect to multiplayer if not connected
        if (!window.multiplayerClient.isConnected) {
            window.multiplayerClient.connect(window.authClient.token);
        }
        
        // Setup listeners
        this.setupMultiplayerListeners();
        
        // Get time control name for display
        const tcNames = { 'blitz-5': '5 min', 'rapid-10': '10 min', 'rapid-15': '15 min', 'daily': 'Daily' };
        const tcName = tcNames[this.selectedTimeControl] || '10 min';
        
        // Show loading state
        this.showMatchmakingStatus(`Looking for ${tcName} opponent...`);
        
        // Start matchmaking once authenticated
        const startMatchmaking = () => {
            window.multiplayerClient.findMatch('ultimate-tictactoe', this.selectedTimeControl);
        };
        
        if (window.multiplayerClient.isConnected) {
            startMatchmaking();
        } else {
            window.multiplayerClient.on('authenticated', startMatchmaking);
        }
    }

    /**
     * Handle create private game
     */
    handleCreatePrivate() {
        if (!window.authClient.isLoggedIn()) {
            this.showNotification('Please login first', 'error');
            return;
        }
        
        if (!window.multiplayerClient.isConnected) {
            window.multiplayerClient.connect(window.authClient.token);
        }
        
        this.setupMultiplayerListeners();
        
        const tcNames = { 'blitz-5': '5 min', 'rapid-10': '10 min', 'rapid-15': '15 min', 'daily': 'Daily' };
        const tcName = tcNames[this.selectedTimeControl] || '10 min';
        this.showMatchmakingStatus(`Creating ${tcName} game...`);
        
        const createGame = () => {
            window.multiplayerClient.createPrivateGame('ultimate-tictactoe', this.selectedTimeControl);
        };
        
        if (window.multiplayerClient.isConnected) {
            createGame();
        } else {
            window.multiplayerClient.on('authenticated', createGame);
        }
    }

    /**
     * Handle join private game
     */
    handleJoinPrivate() {
        const code = this.multiplayerModal.querySelector('#mp-join-code').value.trim();
        if (!code) {
            this.showNotification('Please enter a game code', 'error');
            return;
        }
        
        if (!window.authClient.isLoggedIn()) {
            this.showNotification('Please login first', 'error');
            return;
        }
        
        if (!window.multiplayerClient.isConnected) {
            window.multiplayerClient.connect(window.authClient.token);
        }
        
        this.setupMultiplayerListeners();
        this.showMatchmakingStatus('Joining game...');
        
        window.multiplayerClient.on('authenticated', () => {
            window.multiplayerClient.joinPrivateGame(code);
        });
    }

    /**
     * Handle cancel matchmaking
     */
    handleCancelMatchmaking() {
        window.multiplayerClient.cancelMatchmaking();
        this.hideMatchmakingStatus();
    }

    /**
     * Handle copy game code
     */
    handleCopyCode() {
        const code = this.multiplayerModal.querySelector('#game-code-display').textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showNotification('Code copied!', 'success');
        });
    }

    /**
     * Setup multiplayer event listeners
     */
    setupMultiplayerListeners() {
        const mp = window.multiplayerClient;
        
        mp.on('matchmaking_queued', (data) => {
            const tcNames = { 'blitz-5': '5 min', 'rapid-10': '10 min', 'rapid-15': '15 min', 'daily': 'Daily' };
            const tcName = tcNames[data?.timeControl] || '';
            this.showMatchmakingStatus(`Looking for ${tcName} opponent...`);
        });
        
        mp.on('private_game_created', (data) => {
            this.showGameCode(data.inviteCode);
        });
        
        mp.on('game_start', (game) => {
            this.hideMultiplayerModal();
            this.onlineMode = true;
            // Dispatch event for game to handle
            window.dispatchEvent(new CustomEvent('multiplayer_game_start', { detail: game }));
        });
        
        mp.on('game_update', (game) => {
            window.dispatchEvent(new CustomEvent('multiplayer_game_update', { detail: game }));
        });
        
        mp.on('game_ended', (data) => {
            window.dispatchEvent(new CustomEvent('multiplayer_game_ended', { detail: data }));
        });
        
        mp.on('challenge_sent', (data) => {
            this.showMatchmakingStatus(`Challenge sent! Waiting for ${data.target} to respond...`);
        });
        
        mp.on('challenge_received', (data) => {
            this.showChallengeReceived(data);
        });
        
        mp.on('challenge_declined', (data) => {
            this.hideMatchmakingStatus();
            this.showNotification(`${data.declinedBy} declined your challenge`, 'info');
        });
        
        mp.on('challenge_error', (data) => {
            this.hideMatchmakingStatus();
            this.showNotification(data.error, 'error');
        });
        
        mp.on('join_error', (data) => {
            this.hideMatchmakingStatus();
            this.showNotification(data.error, 'error');
        });
        
        mp.on('error', (data) => {
            this.hideMatchmakingStatus();
            this.showNotification(data.error, 'error');
        });
    }

    /**
     * Show challenge received notification
     */
    showChallengeReceived(challenge) {
        // Create a challenge notification modal
        let challengeModal = document.getElementById('challenge-received-modal');
        if (!challengeModal) {
            challengeModal = document.createElement('div');
            challengeModal.id = 'challenge-received-modal';
            challengeModal.className = 'modal';
            challengeModal.innerHTML = `
                <div class="modal-content" style="max-width: 350px;">
                    <h2>⚔️ Challenge!</h2>
                    <p id="challenge-text"></p>
                    <div class="challenge-actions" style="display: flex; gap: 10px; margin-top: 15px;">
                        <button id="accept-challenge-btn" class="auth-submit" style="flex: 1;">Accept</button>
                        <button id="decline-challenge-btn" class="secondary" style="flex: 1;">Decline</button>
                    </div>
                </div>
            `;
            document.body.appendChild(challengeModal);
        }
        
        const tcName = challenge.timeControlName || '10 min';
        challengeModal.querySelector('#challenge-text').innerHTML = 
            `<strong>${challenge.challenger}</strong> challenges you to a <strong>${tcName}</strong> game!`;
        
        challengeModal.classList.add('show');
        
        // Set up button handlers
        const acceptBtn = challengeModal.querySelector('#accept-challenge-btn');
        const declineBtn = challengeModal.querySelector('#decline-challenge-btn');
        
        acceptBtn.onclick = () => {
            window.multiplayerClient.acceptChallenge(challenge.id);
            challengeModal.classList.remove('show');
        };
        
        declineBtn.onclick = () => {
            window.multiplayerClient.declineChallenge(challenge.id);
            challengeModal.classList.remove('show');
        };
    }

    /**
     * Show matchmaking status
     */
    showMatchmakingStatus(text) {
        const modal = this.multiplayerModal;
        modal.querySelector('#multiplayer-options .mp-option').style.display = 'none';
        modal.querySelectorAll('.mp-logged-in').forEach(el => el.style.display = 'none');
        modal.querySelector('#mp-game-code').style.display = 'none';
        
        modal.querySelector('#mp-status').style.display = 'block';
        modal.querySelector('#mp-status-text').textContent = text;
    }

    /**
     * Hide matchmaking status
     */
    hideMatchmakingStatus() {
        const modal = this.multiplayerModal;
        const isLoggedIn = window.authClient.isLoggedIn();
        
        modal.querySelector('#mp-status').style.display = 'none';
        modal.querySelector('#mp-game-code').style.display = 'none';
        modal.querySelector('#mp-not-logged-in').style.display = isLoggedIn ? 'none' : 'block';
        modal.querySelectorAll('.mp-logged-in').forEach(el => {
            el.style.display = isLoggedIn ? 'block' : 'none';
        });
    }

    /**
     * Show game code for private games
     */
    showGameCode(code) {
        const modal = this.multiplayerModal;
        modal.querySelector('#multiplayer-options .mp-option').style.display = 'none';
        modal.querySelectorAll('.mp-logged-in').forEach(el => el.style.display = 'none');
        modal.querySelector('#mp-status').style.display = 'none';
        
        modal.querySelector('#mp-game-code').style.display = 'block';
        modal.querySelector('#game-code-display').textContent = code;
    }

    /**
     * Update auth UI based on login state
     */
    updateAuthUI() {
        const user = window.authClient.user;
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        
        if (!authButtons || !userInfo) return;
        
        if (user) {
            authButtons.style.display = 'none';
            userInfo.style.display = 'flex';
            
            // Update avatar
            const avatarEl = document.getElementById('user-avatar');
            if (user.profile.avatar.type === 'custom') {
                avatarEl.innerHTML = `<img src="${user.profile.avatar.data}" alt="Avatar">`;
            } else {
                avatarEl.innerHTML = `<div class="avatar-initial" style="background: ${user.profile.avatar.color}">${user.profile.avatar.initial}</div>`;
            }
            
            // Update name
            document.getElementById('user-name').textContent = user.displayName || user.username;
        } else {
            authButtons.style.display = 'flex';
            userInfo.style.display = 'none';
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.game-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Export GameUI class globally
window.GameUI = GameUI;

// Create global UI instance
window.gameUI = new GameUI();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameUI.init();
});
