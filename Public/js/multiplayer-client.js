/**
 * Multiplayer Client (Enhanced)
 * Handles real-time multiplayer via Socket.io + WebRTC
 * Supports timed games (5, 10, 15 min), daily games, WebRTC P2P, mobile, and TV casting
 */

class MultiplayerClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentGame = null;
        this.listeners = new Map();
        this.timeControls = null;
        
        // WebRTC additions
        this.peers = new Map();
        this.localPlayerId = null;
        this.isHost = false;
        this.roomCode = null;
        this.castSession = null;
        this.signalingServer = 'wss://atomicfizzcaps.xyz/signaling';
        this.useWebRTC = false; // Can toggle between Socket.io and WebRTC
    }

    /**
     * Connect to the server
     */
    connect(token) {
        if (this.socket) {
            this.disconnect();
        }

        // Load Socket.io client if not already loaded
        if (typeof io === 'undefined') {
            console.error('Socket.io client not loaded');
            return false;
        }

        // Get WebSocket URL from API config
        const socketUrl = window.API_CONFIG?.wsUrl || window.API_BASE_URL || '';
        console.log('Connecting to Socket.io server:', socketUrl || '(same domain)');

        this.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        this.setupEventListeners();
        
        // Authenticate once connected
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.socket.emit('authenticate', token);
            this.emit('connection_status', { connected: true });
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.currentGame = null;
            this.emit('connection_status', { connected: false });
        });

        return true;
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.currentGame = null;
    }

    /**
     * Setup socket event listeners
     */
    setupEventListeners() {
        // Auth events
        this.socket.on('authenticated', (data) => {
            this.emit('authenticated', data);
        });

        this.socket.on('auth_error', (data) => {
            this.emit('auth_error', data);
        });

        // Matchmaking events
        this.socket.on('matchmaking_queued', (data) => {
            this.emit('matchmaking_queued', data);
        });

        this.socket.on('matchmaking_cancelled', () => {
            this.emit('matchmaking_cancelled');
        });

        this.socket.on('matchmaking_error', (data) => {
            this.emit('matchmaking_error', data);
        });

        // Game events
        this.socket.on('game_start', (game) => {
            this.currentGame = game;
            this.emit('game_start', game);
        });

        this.socket.on('game_update', (game) => {
            this.currentGame = game;
            this.emit('game_update', game);
        });

        this.socket.on('game_ended', (data) => {
            this.currentGame = data.game;
            this.emit('game_ended', data);
        });

        this.socket.on('move_error', (data) => {
            this.emit('move_error', data);
        });

        // Challenge events
        this.socket.on('challenge_sent', (data) => {
            this.emit('challenge_sent', data);
        });

        this.socket.on('challenge_received', (data) => {
            this.emit('challenge_received', data);
        });

        this.socket.on('challenge_declined', (data) => {
            this.emit('challenge_declined', data);
        });

        this.socket.on('challenge_error', (data) => {
            this.emit('challenge_error', data);
        });

        this.socket.on('pending_challenges', (data) => {
            this.emit('pending_challenges', data);
        });

        // Private game events
        this.socket.on('private_game_created', (data) => {
            this.emit('private_game_created', data);
        });

        this.socket.on('join_error', (data) => {
            this.emit('join_error', data);
        });

        // Friend events
        this.socket.on('friend_online', (data) => {
            this.emit('friend_online', data);
        });

        this.socket.on('friend_offline', (data) => {
            this.emit('friend_offline', data);
        });

        // Chat events
        this.socket.on('chat_message', (data) => {
            this.emit('chat_message', data);
        });

        this.socket.on('chat_error', (data) => {
            this.emit('chat_error', data);
        });

        // General errors
        this.socket.on('error', (data) => {
            this.emit('error', data);
        });
    }

    /**
     * Find a match (matchmaking)
     */
    findMatch(gameType = 'ultimate-tictactoe', timeControl = 'rapid-10') {
        if (!this.socket || !this.isConnected) {
            this.emit('error', { error: 'Not connected to server' });
            return;
        }
        this.socket.emit('find_match', { gameType, timeControl });
    }

    /**
     * Cancel matchmaking
     */
    cancelMatchmaking() {
        if (this.socket) {
            this.socket.emit('cancel_matchmaking');
        }
    }

    /**
     * Create a private game
     */
    createPrivateGame(gameType = 'ultimate-tictactoe', timeControl = 'rapid-10') {
        if (this.socket) {
            this.socket.emit('create_private_game', { gameType, timeControl });
        }
    }

    /**
     * Join a private game by code
     */
    joinPrivateGame(gameId) {
        if (this.socket) {
            this.socket.emit('join_private_game', { gameId });
        }
    }

    /**
     * Challenge a specific player
     */
    challengePlayer(targetUsername, gameType = 'ultimate-tictactoe', timeControl = 'rapid-10') {
        if (this.socket) {
            this.socket.emit('challenge_player', { targetUsername, gameType, timeControl });
        }
    }

    /**
     * Accept a challenge
     */
    acceptChallenge(challengeId) {
        if (this.socket) {
            this.socket.emit('accept_challenge', { challengeId });
        }
    }

    /**
     * Decline a challenge
     */
    declineChallenge(challengeId) {
        if (this.socket) {
            this.socket.emit('decline_challenge', { challengeId });
        }
    }

    /**
     * Make a move in the current game
     */
    makeMove(gameId, move) {
        if (this.socket) {
            this.socket.emit('make_move', { gameId, move });
        }
    }

    /**
     * Forfeit the current game
     */
    forfeitGame(gameId) {
        if (this.socket) {
            this.socket.emit('forfeit_game', { gameId });
        }
    }

    /**
     * Send chat message in game
     */
    sendGameChat(gameId, message) {
        if (this.socket) {
            this.socket.emit('game_chat', { gameId, message });
        }
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit event to local listeners
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    /**
     * Get current game state
     */
    getGame() {
        return this.currentGame;
    }

    /**
     * Check if in a game
     */
    isInGame() {
        return this.currentGame && this.currentGame.status === 'playing';
    }
    
    /* ============================================
       WebRTC P2P Methods
       ============================================ */
    
    async createP2PRoom(gameId) {
        this.useWebRTC = true;
        this.isHost = true;
        this.roomCode = this.generateRoomCode();
        this.localPlayerId = 'host_' + Date.now();
        
        await this.connectToSignalingServer();
        
        this.sendSignal({
            type: 'create_room',
            roomCode: this.roomCode,
            gameId: gameId,
            playerId: this.localPlayerId,
            playerName: window.universalAuth?.getUser()?.name || 'Player'
        });
        
        return this.roomCode;
    }
    
    async joinP2PRoom(roomCode, gameId) {
        this.useWebRTC = true;
        this.isHost = false;
        this.roomCode = roomCode;
        this.localPlayerId = 'player_' + Date.now();
        
        await this.connectToSignalingServer();
        
        this.sendSignal({
            type: 'join_room',
            roomCode: roomCode,
            gameId: gameId,
            playerId: this.localPlayerId,
            playerName: window.universalAuth?.getUser()?.name || 'Player'
        });
    }
    
    async connectToSignalingServer() {
        return new Promise((resolve, reject) => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }
            
            this.socket = new WebSocket(this.signalingServer);
            
            this.socket.onopen = () => {
                console.log('Connected to signaling server');
                resolve();
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };
            
            this.socket.onmessage = (event) => {
                try {
                    this.handleSignalingMessage(JSON.parse(event.data));
                } catch (e) {
                    console.error('[multiplayer] Invalid signaling message:', e.message);
                }
            };
            
            this.socket.onclose = () => {
                console.log('Disconnected from signaling server');
            };
        });
    }
    
    sendSignal(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }
    
    handleSignalingMessage(message) {
        switch (message.type) {
            case 'room_created':
                this.emit('room_created', message);
                break;
            case 'player_joined':
                this.emit('player_joined', message);
                this.createPeerConnection(message.playerId);
                break;
            case 'offer':
                this.handleWebRTCOffer(message);
                break;
            case 'answer':
                this.handleWebRTCAnswer(message);
                break;
            case 'ice_candidate':
                this.handleICECandidate(message);
                break;
        }
    }
    
    async createPeerConnection(remotePlayerId) {
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        const pc = new RTCPeerConnection(config);
        const dataChannel = pc.createDataChannel('gameData');
        
        this.setupDataChannel(dataChannel, remotePlayerId);
        
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal({
                    type: 'ice_candidate',
                    roomCode: this.roomCode,
                    toPlayerId: remotePlayerId,
                    fromPlayerId: this.localPlayerId,
                    candidate: event.candidate
                });
            }
        };
        
        pc.ondatachannel = (event) => {
            this.setupDataChannel(event.channel, remotePlayerId);
        };
        
        this.peers.set(remotePlayerId, {
            connection: pc,
            dataChannel: null
        });
        
        // Create and send offer
        if (this.isHost) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            this.sendSignal({
                type: 'offer',
                roomCode: this.roomCode,
                toPlayerId: remotePlayerId,
                fromPlayerId: this.localPlayerId,
                offer: offer
            });
        }
    }
    
    setupDataChannel(channel, remotePlayerId) {
        const peer = this.peers.get(remotePlayerId);
        if (peer) {
            peer.dataChannel = channel;
        }
        
        channel.onopen = () => {
            console.log('Data channel opened with', remotePlayerId);
            this.emit('peer_connected', { playerId: remotePlayerId });
        };
        
        channel.onmessage = (event) => {
            try {
                this.handlePeerMessage(JSON.parse(event.data), remotePlayerId);
            } catch (e) {
                console.error('[multiplayer] Invalid peer message:', e.message);
            }
        };
    }
    
    async handleWebRTCOffer(message) {
        const pc = await this.createPeerConnection(message.fromPlayerId);
        
        await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        this.sendSignal({
            type: 'answer',
            roomCode: this.roomCode,
            toPlayerId: message.fromPlayerId,
            fromPlayerId: this.localPlayerId,
            answer: answer
        });
    }
    
    async handleWebRTCAnswer(message) {
        const peer = this.peers.get(message.fromPlayerId);
        if (peer) {
            await peer.connection.setRemoteDescription(new RTCSessionDescription(message.answer));
        }
    }
    
    async handleICECandidate(message) {
        const peer = this.peers.get(message.fromPlayerId);
        if (peer && message.candidate) {
            await peer.connection.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    }
    
    sendGameUpdate(data) {
        this.peers.forEach((peer, playerId) => {
            if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
                peer.dataChannel.send(JSON.stringify({
                    type: 'game_update',
                    data: data,
                    timestamp: Date.now()
                }));
            }
        });
    }
    
    handlePeerMessage(message, fromPlayerId) {
        switch (message.type) {
            case 'game_update':
                this.emit('p2p_game_update', { data: message.data, fromPlayerId });
                break;
            case 'input':
                this.emit('p2p_player_input', { data: message.data, fromPlayerId });
                break;
        }
    }
    
    /* ============================================
       TV Casting Support
       ============================================ */
    
    async initializeCasting() {
        if (window.chrome && window.chrome.cast) {
            const sessionRequest = new chrome.cast.SessionRequest(
                chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
            );
            
            const apiConfig = new chrome.cast.ApiConfig(
                sessionRequest,
                (session) => this.onCastSessionStarted(session),
                (status) => console.log('Cast status:', status)
            );
            
            chrome.cast.initialize(apiConfig);
        }
    }
    
    async startCasting() {
        if (window.chrome && window.chrome.cast) {
            chrome.cast.requestSession(
                (session) => this.onCastSessionStarted(session),
                (error) => console.error('Cast error:', error)
            );
        } else {
            alert('Casting requires Chrome browser');
        }
    }
    
    onCastSessionStarted(session) {
        this.castSession = session;
        this.emit('cast_started', { session });
        
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const stream = canvas.captureStream(30);
            const mediaInfo = new chrome.cast.media.MediaInfo(stream, 'video/webm');
            const request = new chrome.cast.media.LoadRequest(mediaInfo);
            session.loadMedia(request);
        }
    }
    
    stopCasting() {
        if (this.castSession) {
            this.castSession.stop();
            this.castSession = null;
            this.emit('cast_stopped');
        }
    }
    
    generateRoomCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
}

// Create global multiplayer client instance
window.multiplayerClient = new MultiplayerClient();

/* ============================================
   Mobile Touch Controls
   ============================================ */

class MobileControls {
    constructor() {
        this.touchControls = null;
        this.active = false;
        this.initializeIfMobile();
    }
    
    initializeIfMobile() {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.createTouchControls();
        }
    }
    
    show() {
        if (this.touchControls) {
            this.touchControls.style.display = 'flex';
            this.active = true;
        }
    }
    
    hide() {
        if (this.touchControls) {
            this.touchControls.style.display = 'none';
            this.active = false;
        }
    }
    
    createTouchControls() {
        const controls = document.createElement('div');
        controls.id = 'mobileControls';
        controls.style.cssText = `
            display: none;
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 9998;
            pointer-events: none;
        `;
        
        controls.innerHTML = `
            <div class="mobile-dpad" style="position: relative; width: 180px; height: 180px; pointer-events: auto;">
                <button data-dir="up" class="dpad-btn" style="position: absolute; top: 0; left: 50%; transform: translateX(-50%);">↑</button>
                <button data-dir="left" class="dpad-btn" style="position: absolute; left: 0; top: 50%; transform: translateY(-50%);">←</button>
                <button data-dir="down" class="dpad-btn" style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);">↓</button>
                <button data-dir="right" class="dpad-btn" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%);">→</button>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            </div>
            
            <div class="mobile-actions" style="display: flex; gap: 15px; align-items: flex-end; pointer-events: auto;">
                <button data-action="attack" class="action-btn">🥊</button>
                <button data-action="special" class="action-btn">⚡</button>
                <button data-action="jump" class="action-btn">🦘</button>
            </div>
            
            <style>
                .dpad-btn, .action-btn {
                    width: 60px;
                    height: 60px;
                    background: rgba(102, 126, 234, 0.7);
                    border: 2px solid #fff;
                    border-radius: 50%;
                    color: #fff;
                    font-size: 24px;
                    backdrop-filter: blur(10px);
                    -webkit-tap-highlight-color: transparent;
                    user-select: none;
                }
                
                .dpad-btn:active, .action-btn:active {
                    background: rgba(102, 126, 234, 0.9);
                    transform: scale(0.95);
                }
            </style>
        `;
        
        document.body.appendChild(controls);
        this.touchControls = controls;
        this.setupTouchListeners();
    }
    
    setupTouchListeners() {
        this.touchControls.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = btn.dataset.dir || btn.dataset.action;
                window.dispatchEvent(new CustomEvent('mobileInput', { 
                    detail: { action, state: 'press' }
                }));
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                const action = btn.dataset.dir || btn.dataset.action;
                window.dispatchEvent(new CustomEvent('mobileInput', { 
                    detail: { action, state: 'release' }
                }));
            });
        });
    }
}

// Initialize mobile controls
window.mobileControls = new MobileControls();
