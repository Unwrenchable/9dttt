/**
 * Game Manager Module
 * Handles game creation, matchmaking, game logic, and multiplayer coordination
 * Supports timed games (5, 10, 15 min) and daily (correspondence) games
 */

const { v4: uuidv4 } = require('uuid');
const storage = require('./storage');
const auth = require('./auth');

// Time control options (in seconds)
const TIME_CONTROLS = {
    'blitz-5': { initial: 5 * 60, increment: 0, name: '5 min' },
    'rapid-10': { initial: 10 * 60, increment: 0, name: '10 min' },
    'rapid-15': { initial: 15 * 60, increment: 0, name: '15 min' },
    'daily': { initial: 24 * 60 * 60, increment: 0, name: 'Daily', isDaily: true }
};

class GameManager {
    constructor() {
        this.matchmakingQueues = new Map(); // Separate queue per time control
        this.activeChallenges = new Map();
        this.gameTimers = new Map();
        
        // Initialize queues for each time control
        Object.keys(TIME_CONTROLS).forEach(tc => {
            this.matchmakingQueues.set(tc, []);
        });
    }

    /**
     * Get available time controls
     */
    getTimeControls() {
        return TIME_CONTROLS;
    }

    // Create a new game room
    async createGame(player1, gameType = 'ultimate-tictactoe', isPrivate = false, timeControl = 'rapid-10') {
        const gameId = uuidv4();
        const tc = TIME_CONTROLS[timeControl] || TIME_CONTROLS['rapid-10'];
        
        const game = {
            id: gameId,
            type: gameType,
            status: 'waiting', // waiting, playing, finished
            isPrivate,
            timeControl: timeControl,
            timeControlName: tc.name,
            isDaily: tc.isDaily || false,
            players: {
                X: { 
                    username: player1, 
                    connected: true,
                    timeRemaining: tc.initial // Time in seconds
                },
                O: null
            },
            board: this.initializeBoard(gameType),
            currentPlayer: 'X',
            activeBoard: null, // For ultimate tic-tac-toe
            moves: [],
            winner: null,
            createdAt: new Date().toISOString(),
            startedAt: null,
            endedAt: null,
            lastMoveAt: null,
            chat: []
        };

        await storage.setGame(gameId, game);
        return game;
    }

    // Initialize board based on game type
    initializeBoard(gameType) {
        if (gameType === 'ultimate-tictactoe') {
            // 9 small boards, each with 9 cells
            // Points are awarded for each section won
            return {
                boards: Array(9).fill(null).map(() => Array(9).fill(null)),
                boardWinners: Array(9).fill(null),
                scores: { X: 0, O: 0 } // Track points for each player
            };
        }
        if (gameType === '4d-chess') {
            // 4D Chess: 2 timelines, each with an 8x8 chess board
            return {
                timelines: 2,
                boards: [this.createChessBoard(), this.createChessBoard()],
                currentTimeline: 0,
                capturedPieces: { white: [], black: [] },
                kingPositions: [
                    { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } },
                    { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } }
                ],
                kingMoved: [{ white: false, black: false }, { white: false, black: false }],
                rookMoved: [
                    { white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false } },
                    { white: { kingside: false, queenside: false }, black: { kingside: false, queenside: false } }
                ]
            };
        }
        // Classic tic-tac-toe
        return Array(9).fill(null);
    }

    // Create initial chess board for 4D Chess
    createChessBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Black pieces (top)
        board[0] = [
            { type: 'rook', color: 'black' },
            { type: 'knight', color: 'black' },
            { type: 'bishop', color: 'black' },
            { type: 'queen', color: 'black' },
            { type: 'king', color: 'black' },
            { type: 'bishop', color: 'black' },
            { type: 'knight', color: 'black' },
            { type: 'rook', color: 'black' }
        ];
        board[1] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' }));
        
        // White pieces (bottom)
        board[6] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' }));
        board[7] = [
            { type: 'rook', color: 'white' },
            { type: 'knight', color: 'white' },
            { type: 'bishop', color: 'white' },
            { type: 'queen', color: 'white' },
            { type: 'king', color: 'white' },
            { type: 'bishop', color: 'white' },
            { type: 'knight', color: 'white' },
            { type: 'rook', color: 'white' }
        ];
        
        return board;
    }

    // Join an existing game
    async joinGame(gameId, player2) {
        const game = await storage.getGame(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (game.status !== 'waiting') {
            return { success: false, error: 'Game already started or finished' };
        }

        if (game.players.X.username === player2) {
            return { success: false, error: 'Cannot join your own game' };
        }

        const tc = TIME_CONTROLS[game.timeControl] || TIME_CONTROLS['rapid-10'];
        game.players.O = { 
            username: player2, 
            connected: true,
            timeRemaining: tc.initial
        };
        game.status = 'playing';
        game.startedAt = new Date().toISOString();
        game.lastMoveAt = new Date().toISOString();

        await storage.setGame(gameId, game);
        return { success: true, game };
    }

    // Make a move
    async makeMove(gameId, username, moveData) {
        const game = await storage.getGame(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (game.status !== 'playing') {
            return { success: false, error: 'Game is not in progress' };
        }

        // Verify it's the player's turn
        const playerSymbol = game.players.X.username === username ? 'X' : 
                            game.players.O?.username === username ? 'O' : null;

        if (!playerSymbol) {
            return { success: false, error: 'You are not in this game' };
        }

        if (game.currentPlayer !== playerSymbol) {
            return { success: false, error: 'Not your turn' };
        }

        // Process move based on game type
        let result;
        if (game.type === 'ultimate-tictactoe') {
            result = this.processUltimateTTTMove(game, moveData, playerSymbol);
        } else {
            result = this.processClassicTTTMove(game, moveData, playerSymbol);
        }

        if (!result.success) {
            return result;
        }

        // Record the move
        game.moves.push({
            player: playerSymbol,
            move: moveData,
            timestamp: new Date().toISOString()
        });

        // Check for game end
        if (result.winner) {
            game.winner = result.winner;
            game.status = 'finished';
            game.endedAt = new Date().toISOString();

            // Update player stats
            const winnerUsername = game.players[result.winner].username;
            const loserSymbol = result.winner === 'X' ? 'O' : 'X';
            const loserUsername = game.players[loserSymbol].username;

            await auth.updateStats(winnerUsername, 'win');
            await auth.updateStats(loserUsername, 'loss');
        } else if (result.draw) {
            game.winner = 'draw';
            game.status = 'finished';
            game.endedAt = new Date().toISOString();

            await auth.updateStats(game.players.X.username, 'draw');
            await auth.updateStats(game.players.O.username, 'draw');
        } else {
            // Update time tracking for timed games
            if (!game.isDaily && game.lastMoveAt) {
                const now = new Date();
                const lastMove = new Date(game.lastMoveAt);
                const elapsedSeconds = Math.floor((now - lastMove) / 1000);
                game.players[playerSymbol].timeRemaining -= elapsedSeconds;
                
                // Check for timeout
                if (game.players[playerSymbol].timeRemaining <= 0) {
                    game.players[playerSymbol].timeRemaining = 0;
                    const winnerSymbol = playerSymbol === 'X' ? 'O' : 'X';
                    game.winner = winnerSymbol;
                    game.status = 'finished';
                    game.endedAt = new Date().toISOString();
                    game.timeoutBy = playerSymbol;
                    
                    await auth.updateStats(game.players[winnerSymbol].username, 'win');
                    await auth.updateStats(username, 'loss');
                    
                    await storage.setGame(gameId, game);
                    return { success: true, game, result: { ...result, timeout: true } };
                }
            }
            
            game.lastMoveAt = new Date().toISOString();
            
            // Switch turns
            game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
            if (game.type === 'ultimate-tictactoe') {
                game.activeBoard = result.nextBoard;
            }
        }

        await storage.setGame(gameId, game);
        return { success: true, game, result };
    }

    // Process Ultimate Tic-Tac-Toe move
    processUltimateTTTMove(game, moveData, playerSymbol) {
        const { boardIndex, cellIndex } = moveData;

        // Validate board selection
        if (game.activeBoard !== null && game.activeBoard !== boardIndex) {
            if (game.board.boardWinners[game.activeBoard] === null) {
                return { success: false, error: 'Must play in the designated board' };
            }
        }

        // Check if board is already won
        if (game.board.boardWinners[boardIndex] !== null) {
            return { success: false, error: 'This board is already won' };
        }

        // Check if cell is already taken
        if (game.board.boards[boardIndex][cellIndex] !== null) {
            return { success: false, error: 'Cell is already taken' };
        }

        // Make the move
        game.board.boards[boardIndex][cellIndex] = playerSymbol;

        // Check if this board/section is won - award points based on moves made!
        const boardWinner = this.checkWinner(game.board.boards[boardIndex]);
        if (boardWinner) {
            game.board.boardWinners[boardIndex] = boardWinner;
            // Award points = number of moves made in this section (max 9 per section)
            const movesInSection = game.board.boards[boardIndex].filter(cell => cell !== null).length;
            game.board.scores[boardWinner] += movesInSection;
        } else if (game.board.boards[boardIndex].every(cell => cell !== null)) {
            // Draw - no points awarded, all 9 cells filled but no winner
            game.board.boardWinners[boardIndex] = 'draw';
        }

        // Check if overall game is won (3 in a row on the meta-board)
        const gameWinner = this.checkUltimateWinner(game.board.boardWinners);
        if (gameWinner) {
            return { success: true, winner: gameWinner, scores: game.board.scores };
        }

        // Check if all boards are complete - winner determined by points
        if (game.board.boardWinners.every(w => w !== null)) {
            // Determine winner by total points
            if (game.board.scores.X > game.board.scores.O) {
                return { success: true, winner: 'X', scores: game.board.scores };
            } else if (game.board.scores.O > game.board.scores.X) {
                return { success: true, winner: 'O', scores: game.board.scores };
            } else {
                return { success: true, draw: true, scores: game.board.scores };
            }
        }

        // Determine next board
        let nextBoard = cellIndex;
        if (game.board.boardWinners[nextBoard] !== null) {
            nextBoard = null; // Free choice
        }

        return { success: true, nextBoard, scores: game.board.scores };
    }

    // Process Classic Tic-Tac-Toe move
    processClassicTTTMove(game, moveData, playerSymbol) {
        const { cellIndex } = moveData;

        if (game.board[cellIndex] !== null) {
            return { success: false, error: 'Cell is already taken' };
        }

        game.board[cellIndex] = playerSymbol;

        const winner = this.checkWinner(game.board);
        if (winner) {
            return { success: true, winner };
        }

        if (game.board.every(cell => cell !== null)) {
            return { success: true, draw: true };
        }

        return { success: true };
    }

    // Check for winner in a 3x3 board
    checkWinner(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]              // Diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                if (board[a] !== 'draw') {
                    return board[a];
                }
            }
        }
        return null;
    }

    // Check for winner in Ultimate TTT
    checkUltimateWinner(boardWinners) {
        const validWinners = boardWinners.map(w => w === 'draw' ? null : w);
        return this.checkWinner(validWinners);
    }

    // Matchmaking - find or create a game
    async findMatch(username, gameType = 'ultimate-tictactoe', timeControl = 'rapid-10') {
        // Validate time control
        if (!TIME_CONTROLS[timeControl]) {
            timeControl = 'rapid-10';
        }
        
        const queue = this.matchmakingQueues.get(timeControl) || [];
        
        // Check if already in any queue
        for (const [tc, q] of this.matchmakingQueues) {
            const existingIndex = q.findIndex(entry => entry.username === username);
            if (existingIndex !== -1) {
                return { success: false, error: 'Already in matchmaking queue' };
            }
        }

        // Look for an available player in the same time control queue
        const matchIndex = queue.findIndex(
            q => q.gameType === gameType && q.username !== username
        );

        if (matchIndex !== -1) {
            // Found a match!
            const opponent = queue.splice(matchIndex, 1)[0];
            if (opponent.timeoutId) {
                clearTimeout(opponent.timeoutId);
            }
            
            // Create game with opponent as player 1
            const game = await this.createGame(opponent.username, gameType, false, timeControl);
            const joinResult = await this.joinGame(game.id, username);

            if (joinResult.success) {
                // Notify opponent through their callback
                if (opponent.callback) {
                    opponent.callback({ matched: true, game: joinResult.game });
                }
                return { success: true, matched: true, game: joinResult.game };
            }
        }

        // No match found, add to queue
        // Return immediately with queued status - callback will be used when match is found
        const queueEntry = {
            username,
            gameType,
            timeControl,
            joinedAt: Date.now(),
            callback: null, // Will be set by socket handler
            timeoutId: null
        };
        
        queue.push(queueEntry);
        this.matchmakingQueues.set(timeControl, queue);
        
        // Auto-remove from queue after timeout (longer for daily games)
        const timeout = TIME_CONTROLS[timeControl].isDaily ? 120000 : 60000;
        queueEntry.timeoutId = setTimeout(() => {
            const q = this.matchmakingQueues.get(timeControl) || [];
            const index = q.findIndex(entry => entry.username === username);
            if (index !== -1) {
                q.splice(index, 1);
                if (queueEntry.callback) {
                    queueEntry.callback({ timeout: true, error: 'Matchmaking timed out' });
                }
            }
        }, timeout);
        
        return { success: true, queued: true };
    }

    // Cancel matchmaking
    cancelMatchmaking(username) {
        // Check all queues
        for (const [tc, queue] of this.matchmakingQueues) {
            const index = queue.findIndex(q => q.username === username);
            if (index !== -1) {
                const entry = queue[index];
                if (entry.timeoutId) {
                    clearTimeout(entry.timeoutId);
                }
                queue.splice(index, 1);
                return { success: true };
            }
        }
        return { success: false, error: 'Not in queue' };
    }

    // Challenge a specific player
    async challengePlayer(challengerUsername, targetUsername, gameType = 'ultimate-tictactoe', timeControl = 'rapid-10') {
        if (challengerUsername === targetUsername) {
            return { success: false, error: 'Cannot challenge yourself' };
        }

        const targetUser = await storage.getUser(targetUsername);
        if (!targetUser) {
            return { success: false, error: 'Player not found' };
        }

        // For non-daily games, require online status
        const tc = TIME_CONTROLS[timeControl] || TIME_CONTROLS['rapid-10'];
        if (!tc.isDaily) {
            const isOnline = await storage.isPlayerOnline(targetUsername);
            if (!isOnline) {
                return { success: false, error: 'Player is not online' };
            }
        }

        const challengeId = uuidv4();
        const challenge = {
            id: challengeId,
            challenger: challengerUsername,
            target: targetUsername,
            gameType,
            timeControl,
            timeControlName: tc.name,
            isDaily: tc.isDaily || false,
            createdAt: Date.now(),
            status: 'pending'
        };

        this.activeChallenges.set(challengeId, challenge);

        // Auto-expire challenge (longer for daily challenges)
        const expireTime = tc.isDaily ? 24 * 60 * 60 * 1000 : 60000;
        const challengeTimeout = setTimeout(() => {
            const c = this.activeChallenges.get(challengeId);
            if (c && c.status === 'pending') {
                c.status = 'expired';
                this.activeChallenges.delete(challengeId);
            }
        }, expireTime);
        challenge.timeoutId = challengeTimeout;

        return { success: true, challenge };
    }

    // Accept a challenge
    async acceptChallenge(challengeId, username) {
        const challenge = this.activeChallenges.get(challengeId);
        if (!challenge) {
            return { success: false, error: 'Challenge not found or expired' };
        }

        if (challenge.target !== username) {
            return { success: false, error: 'This challenge is not for you' };
        }

        if (challenge.status !== 'pending') {
            return { success: false, error: 'Challenge already processed' };
        }

        challenge.status = 'accepted';

        // Create the game with the time control from the challenge
        const game = await this.createGame(challenge.challenger, challenge.gameType, true, challenge.timeControl);
        const joinResult = await this.joinGame(game.id, username);

        if (challenge.timeoutId) clearTimeout(challenge.timeoutId);
        this.activeChallenges.delete(challengeId);

        if (joinResult.success) {
            return { success: true, game: joinResult.game };
        }
        return joinResult;
    }

    // Decline a challenge
    declineChallenge(challengeId, username) {
        const challenge = this.activeChallenges.get(challengeId);
        if (!challenge || challenge.target !== username) {
            return { success: false, error: 'Challenge not found' };
        }

        challenge.status = 'declined';
        if (challenge.timeoutId) clearTimeout(challenge.timeoutId);
        this.activeChallenges.delete(challengeId);
        return { success: true };
    }

    // Get pending challenges for a user
    getPendingChallenges(username) {
        const challenges = [];
        for (const challenge of this.activeChallenges.values()) {
            if (challenge.target === username && challenge.status === 'pending') {
                challenges.push(challenge);
            }
        }
        return challenges;
    }

    // Forfeit a game
    async forfeitGame(gameId, username) {
        const game = await storage.getGame(gameId);
        if (!game || game.status !== 'playing') {
            return { success: false, error: 'Game not found or not in progress' };
        }

        const playerSymbol = game.players.X.username === username ? 'X' :
                            game.players.O?.username === username ? 'O' : null;

        if (!playerSymbol) {
            return { success: false, error: 'You are not in this game' };
        }

        const winnerSymbol = playerSymbol === 'X' ? 'O' : 'X';
        game.winner = winnerSymbol;
        game.status = 'finished';
        game.endedAt = new Date().toISOString();
        game.forfeitedBy = username;

        await storage.setGame(gameId, game);

        // Update stats
        await auth.updateStats(game.players[winnerSymbol].username, 'win');
        await auth.updateStats(username, 'loss');

        return { success: true, game };
    }

    // Get game state
    async getGame(gameId) {
        return await storage.getGame(gameId);
    }

    // Get active games for a user
    async getActiveGames(username) {
        const allGames = await storage.getAllActiveGames();
        return allGames.filter(game => 
            (game.players.X?.username === username || game.players.O?.username === username) &&
            game.status !== 'finished'
        );
    }

    // Get recent games for a user
    async getRecentGames(username, limit = 10) {
        const allGames = await storage.getAllActiveGames();
        return allGames
            .filter(game => 
                game.players.X?.username === username || game.players.O?.username === username
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }
}

module.exports = new GameManager();
