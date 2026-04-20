/**
 * 9D Tic-Tac-Toe (9 Dimensional Tic-Tac-Toe) Game Logic
 * A strategic 9-board tic-tac-toe game
 * Part of the 9DTTT Game Library
 * Supports both local and online multiplayer modes
 */

class UltimateTicTacToe {
    constructor() {
        this.currentPlayer = 'X';
        this.activeBoard = null; // null means any board is playable
        this.boards = Array(9).fill(null).map(() => ({
            cells: Array(9).fill(null),
            winner: null
        }));
        this.ultimateWinner = null;
        this.scores = { X: 0, O: 0 };
        
        // Multiplayer properties
        this.onlineMode = false;
        this.gameId = null;
        this.playerSymbol = null; // 'X' or 'O' - which symbol this player is
        this.opponentInfo = null;

        // 3D properties
        this.is3DMode = false;
        this.renderer3D = null;
    }

    /**
     * Initialize the game board
     */
    initGame() {
        if (this.is3DMode) {
            this.init3DGame();
        } else {
            this.init2DGame();
        }
    }

    /**
     * Initialize 2D game board
     */
    init2DGame() {
        const ultimateBoard = document.getElementById('ultimate-board');
        ultimateBoard.innerHTML = '';

        for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
            const smallBoard = this.createSmallBoard(boardIndex);
            ultimateBoard.appendChild(smallBoard);
        }

        this.updateBoard();
    }

    /**
     * Initialize 3D game board
     */
    async init3DGame() {
        if (!this.renderer3D) {
            this.renderer3D = new UltimateTicTacToe3D(this);
        }
        await this.renderer3D.init();
        this.updateBoard();
    }

    /**
     * Create a small 3x3 board
     */
    createSmallBoard(boardIndex) {
        const smallBoard = document.createElement('div');
        smallBoard.className = 'small-board';
        smallBoard.setAttribute('data-board', boardIndex);
        smallBoard.setAttribute('role', 'grid');
        smallBoard.setAttribute('aria-label', `Board ${boardIndex + 1}`);

        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            const cell = this.createCell(boardIndex, cellIndex);
            smallBoard.appendChild(cell);
        }

        return smallBoard;
    }

    /**
     * Create a cell element
     */
    createCell(boardIndex, cellIndex) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-board', boardIndex);
        cell.setAttribute('data-cell', cellIndex);
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('tabindex', '-1');
        cell.setAttribute('aria-label', `Board ${boardIndex + 1}, Cell ${cellIndex + 1}`);
        
        cell.addEventListener('click', () => this.handleCellClick(boardIndex, cellIndex));
        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleCellClick(boardIndex, cellIndex);
            }
        });

        return cell;
    }

    /**
     * Handle cell click
     */
    handleCellClick(boardIndex, cellIndex) {
        // Check if game is over
        if (this.ultimateWinner) return;

        // In online mode, check if it's our turn
        if (this.onlineMode) {
            if (this.currentPlayer !== this.playerSymbol) {
                this.showNotification("It's not your turn!");
                return;
            }
        }

        // Check if this board is active
        if (this.activeBoard !== null && this.activeBoard !== boardIndex) {
            this.showNotification('You must play on the highlighted board!');
            return;
        }

        // Check if cell is already taken
        if (this.boards[boardIndex].cells[cellIndex]) {
            this.showNotification('This cell is already taken!');
            return;
        }

        // Check if board is already won
        if (this.boards[boardIndex].winner) {
            this.showNotification('This board is already complete!');
            return;
        }

        // In online mode, send move to server
        if (this.onlineMode && window.multiplayerClient) {
            window.multiplayerClient.makeMove(this.gameId, { boardIndex, cellIndex });
            return; // Server will update game state
        }

        // Local mode - make the move directly
        this.makeLocalMove(boardIndex, cellIndex);
    }

    /**
     * Make a local move (for local play or when receiving from server)
     */
    makeLocalMove(boardIndex, cellIndex) {
        // Make the move
        this.boards[boardIndex].cells[cellIndex] = this.currentPlayer;

        // Check if this board is won
        const boardWinner = this.checkWinner(this.boards[boardIndex].cells);
        if (boardWinner) {
            this.boards[boardIndex].winner = boardWinner;
            // Award points = number of moves made in this section (max 9 per section)
            const movesInSection = this.boards[boardIndex].cells.filter(cell => cell !== null).length;
            this.scores[boardWinner] += movesInSection;
            this.announceToScreenReader(`Board ${boardIndex + 1} won by ${boardWinner}! +${movesInSection} points!`);

            // 3D win effect
            if (this.is3DMode && this.renderer3D) {
                this.renderer3D.showWinEffect(boardIndex);
            }
        } else if (this.boards[boardIndex].cells.every(cell => cell !== null)) {
            this.boards[boardIndex].winner = 'draw';
            this.announceToScreenReader(`Board ${boardIndex + 1} is a draw!`);
        }

        // Determine next active board
        const targetBoard = cellIndex;
        if (this.boards[targetBoard].winner === null) {
            this.activeBoard = targetBoard;
            // 3D camera focus and send effect
            if (this.is3DMode && this.renderer3D) {
                this.renderer3D.showSendToBoardEffect(boardIndex, targetBoard);
                setTimeout(() => this.renderer3D.focusOnBoard(targetBoard), 500);
            }
        } else {
            // If target board is complete, player can choose any available board
            this.activeBoard = null;
        }

        // Check for ultimate winner
        const ultimateWinner = this.checkUltimateWinner();
        if (ultimateWinner) {
            this.ultimateWinner = ultimateWinner;
            // No bonus points - winner determined by total points from all sections
            this.showGameOver(ultimateWinner);
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

        // Update the board
        this.updateBoard();
    }

    /**
     * Check winner for a board (array of 9 cells)
     */
    checkWinner(cells) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
                return cells[a];
            }
        }

        return null;
    }

    /**
     * Check ultimate winner
     */
    checkUltimateWinner() {
        const boardWinners = this.boards.map(board => board.winner);
        const winner = this.checkWinner(boardWinners);
        
        if (winner && winner !== 'draw') {
            return winner;
        }

        // Check if all boards are complete
        if (boardWinners.every(w => w !== null)) {
            // Determine winner by score
            if (this.scores.X > this.scores.O) {
                return 'X';
            } else if (this.scores.O > this.scores.X) {
                return 'O';
            } else {
                return 'draw';
            }
        }

        return null;
    }

    /**
     * Update the board display
     */
    updateBoard() {
        if (this.is3DMode && this.renderer3D) {
            this.renderer3D.updateBoard();
        } else {
            this.update2DBoard();
        }
    }

    /**
     * Update the 2D board display
     */
    update2DBoard() {
        // Update cells
        this.boards.forEach((board, boardIndex) => {
            const boardElement = document.querySelector(`[data-board="${boardIndex}"].small-board`);
            
            // Update board status classes
            boardElement.className = 'small-board';
            
            // In online mode, only highlight if it's our turn
            const canPlay = !this.onlineMode || this.currentPlayer === this.playerSymbol;
            
            if (canPlay && this.activeBoard === boardIndex) {
                boardElement.classList.add('active');
            } else if (canPlay && this.activeBoard === null && !board.winner) {
                boardElement.classList.add('active');
            }

            if (board.winner === 'X') {
                boardElement.classList.add('won-x');
            } else if (board.winner === 'O') {
                boardElement.classList.add('won-o');
            } else if (board.winner === 'draw') {
                boardElement.classList.add('draw');
            }

            // Add overlay for won boards
            let overlay = boardElement.querySelector('.board-overlay');
            if (board.winner && !overlay) {
                overlay = document.createElement('div');
                overlay.className = `board-overlay ${board.winner === 'draw' ? 'draw' : board.winner.toLowerCase()}`;
                overlay.textContent = board.winner === 'draw' ? 'DRAW' : board.winner;
                overlay.setAttribute('aria-hidden', 'true');
                boardElement.appendChild(overlay);
            }

            // Update cells
            board.cells.forEach((cell, cellIndex) => {
                const cellElement = boardElement.querySelector(`[data-board="${boardIndex}"][data-cell="${cellIndex}"]`);
                cellElement.textContent = cell || '';
                cellElement.className = 'cell';
                
                if (cell) {
                    cellElement.classList.add('taken', cell.toLowerCase());
                    cellElement.setAttribute('aria-label', `Board ${boardIndex + 1}, Cell ${cellIndex + 1}: ${cell}`);
                } else {
                    cellElement.setAttribute('aria-label', `Board ${boardIndex + 1}, Cell ${cellIndex + 1}: Empty`);
                }

                // Set tabindex for keyboard navigation
                const isPlayable = !cell && !board.winner && 
                                 (this.activeBoard === null || this.activeBoard === boardIndex) &&
                                 !this.ultimateWinner &&
                                 (!this.onlineMode || this.currentPlayer === this.playerSymbol);
                cellElement.setAttribute('tabindex', isPlayable ? '0' : '-1');
            });
        });

        // Update turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        if (this.ultimateWinner) {
            turnIndicator.innerHTML = 'Game Over!';
        } else if (this.onlineMode) {
            const isMyTurn = this.currentPlayer === this.playerSymbol;
            const playerClass = this.currentPlayer === 'X' ? 'player-x' : 'player-o';
            if (isMyTurn) {
                turnIndicator.innerHTML = `Your Turn (<span class="${playerClass}">${this.currentPlayer}</span>)`;
            } else {
                turnIndicator.innerHTML = `Opponent's Turn (<span class="${playerClass}">${this.currentPlayer}</span>)`;
            }
        } else {
            const playerClass = this.currentPlayer === 'X' ? 'player-x' : 'player-o';
            turnIndicator.innerHTML = `Current Player: <span class="${playerClass}">${this.currentPlayer}</span>`;
        }

        // Update scores
        document.getElementById('score-x').textContent = this.scores.X;
        document.getElementById('score-o').textContent = this.scores.O;
    }

    /**
     * Toggle between 2D and 3D modes
     */
    async toggle3DMode() {
        this.is3DMode = !this.is3DMode;
        const toggleBtn = document.getElementById('toggle-3d-btn');

        if (this.is3DMode) {
            toggleBtn.textContent = 'Switch to 2D';
            await this.init3DGame();
            this.renderer3D.show3D();
        } else {
            toggleBtn.textContent = 'Switch to 3D';
            this.renderer3D.show2D();
        }
    }

    /**
     * Show game over modal
     */
    showGameOver(winner) {
        const modal = document.getElementById('game-over-modal');
        const message = document.getElementById('modal-message');
        
        if (winner === 'draw') {
            message.textContent = `It's a draw! Final Score - X: ${this.scores.X}, O: ${this.scores.O}`;
        } else if (this.onlineMode) {
            const isWinner = winner === this.playerSymbol;
            if (isWinner) {
                message.textContent = `🎉 You win! Final Score - X: ${this.scores.X}, O: ${this.scores.O}`;
            } else {
                message.textContent = `You lost. Final Score - X: ${this.scores.X}, O: ${this.scores.O}`;
            }
        } else {
            message.textContent = `Player ${winner} wins! Final Score - X: ${this.scores.X}, O: ${this.scores.O}`;
        }

        modal.classList.add('show');
        this.announceToScreenReader(message.textContent);
        
        // Focus on the play again button
        setTimeout(() => {
            document.getElementById('modal-new-game-btn').focus();
        }, 100);
    }

    /**
     * Show notification
     */
    showNotification(message) {
        this.announceToScreenReader(message);
    }

    /**
     * Screen reader announcement
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    /**
     * Reset game
     * Note: Scores are preserved across games in the same session
     * This allows players to track their performance over multiple games
     */
    resetGame() {
        this.currentPlayer = 'X';
        this.activeBoard = null;
        this.boards = Array(9).fill(null).map(() => ({
            cells: Array(9).fill(null),
            winner: null
        }));
        this.ultimateWinner = null;
        // Scores are intentionally kept across games for session tracking
        
        // Exit online mode on reset
        this.onlineMode = false;
        this.gameId = null;
        this.playerSymbol = null;
        this.opponentInfo = null;
        this.removeOnlineModeIndicator();
        
        document.getElementById('game-over-modal').classList.remove('show');
        this.initGame();
        this.announceToScreenReader('New game started!');
    }

    /**
     * Start an online multiplayer game
     */
    startOnlineGame(gameData) {
        // Reset game state
        this.currentPlayer = 'X';
        this.activeBoard = null;
        this.boards = Array(9).fill(null).map(() => ({
            cells: Array(9).fill(null),
            winner: null
        }));
        this.ultimateWinner = null;
        this.scores = { X: 0, O: 0 };
        
        // Set online mode
        this.onlineMode = true;
        this.gameId = gameData.id;
        
        // Determine which player we are
        const currentUsername = window.authClient?.user?.username;
        if (gameData.players.X.username === currentUsername) {
            this.playerSymbol = 'X';
            this.opponentInfo = gameData.players.O;
        } else {
            this.playerSymbol = 'O';
            this.opponentInfo = gameData.players.X;
        }
        
        // Show online mode indicator
        this.showOnlineModeIndicator();
        
        document.getElementById('game-over-modal').classList.remove('show');
        this.initGame();
        this.announceToScreenReader(`Online game started! You are playing as ${this.playerSymbol}`);
        
        // Show notification
        if (window.gameUI) {
            window.gameUI.showNotification(`Game started! You are ${this.playerSymbol}`, 'success');
        }
    }

    /**
     * Update game state from server
     */
    updateFromServer(gameData) {
        // Update boards from server data
        if (gameData.board && gameData.board.boards) {
            for (let i = 0; i < 9; i++) {
                this.boards[i].cells = [...gameData.board.boards[i]];
                this.boards[i].winner = gameData.board.boardWinners[i];
            }
            this.scores = { ...gameData.board.scores };
        }
        
        this.currentPlayer = gameData.currentPlayer;
        this.activeBoard = gameData.activeBoard;
        
        if (gameData.status === 'finished') {
            this.ultimateWinner = gameData.winner;
            this.showGameOver(gameData.winner);
        }
        
        this.updateBoard();
    }

    /**
     * Show online mode indicator
     */
    showOnlineModeIndicator() {
        let indicator = document.getElementById('online-mode-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'online-mode-indicator';
            indicator.className = 'online-mode-indicator';
            
            const gameInfo = document.querySelector('.game-info');
            gameInfo.parentNode.insertBefore(indicator, gameInfo);
        }
        
        const opponentName = this.opponentInfo?.username || 'Opponent';
        indicator.innerHTML = `
            <span class="status-dot"></span>
            <span>🌐 Online Game vs ${opponentName}</span>
            <span>You: ${this.playerSymbol}</span>
        `;
    }

    /**
     * Remove online mode indicator
     */
    removeOnlineModeIndicator() {
        const indicator = document.getElementById('online-mode-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * Setup gamepad controls for Ultimate Tic-Tac-Toe
     */
    setupGamepadControls() {
        if (!window.gamepadManager) return;
        
        this.selectedBoard = 0;
        this.selectedCell = 0;
        
        window.gamepadManager.on('buttondown', (data) => this.handleGamepadInput(data));
    }
    
    handleGamepadInput(data) {
        const { button, playerIndex } = data;
        
        // In local mode, both gamepads can play
        // In online mode, only player 1 gamepad works
        if (this.onlineMode && playerIndex !== 0) return;
        
        switch (button) {
            case 'up':
                this.navigateCell(-3, playerIndex); // Move up in 3x3 grid
                break;
            case 'down':
                this.navigateCell(3, playerIndex); // Move down in 3x3 grid
                break;
            case 'left':
                this.navigateCell(-1, playerIndex);
                break;
            case 'right':
                this.navigateCell(1, playerIndex);
                break;
            case 'a': // Make move
                this.handleCellClick(this.selectedBoard, this.selectedCell);
                window.gamepadManager.vibrate(playerIndex, 50, 0.3, 0.1);
                break;
            case 'y': // New game
                this.resetGame();
                this.selectedBoard = 0;
                this.selectedCell = 0;
                this.highlightSelection();
                break;
            case 'lb': // Previous board
                this.navigateBoard(-1, playerIndex);
                break;
            case 'rb': // Next board
                this.navigateBoard(1, playerIndex);
                break;
        }
    }
    
    navigateCell(offset, playerIndex = 0) {
        // Calculate new cell position within current board
        const currentRow = Math.floor(this.selectedCell / 3);
        const currentCol = this.selectedCell % 3;
        
        if (offset === -1 && currentCol > 0) {
            this.selectedCell--;
        } else if (offset === 1 && currentCol < 2) {
            this.selectedCell++;
        } else if (offset === -3 && currentRow > 0) {
            this.selectedCell -= 3;
        } else if (offset === 3 && currentRow < 2) {
            this.selectedCell += 3;
        }
        
        this.highlightSelection();
        window.gamepadManager.vibrate(playerIndex, 20, 0.1, 0);
    }
    
    navigateBoard(direction, playerIndex = 0) {
        // Find next valid board
        let newBoard = this.selectedBoard;
        
        // If there's an active board requirement, stay on it
        if (this.activeBoard !== null && !this.boards[this.activeBoard].winner) {
            newBoard = this.activeBoard;
        } else {
            // Navigate to next available board
            if (direction === -1 && this.selectedBoard > 0) {
                newBoard = this.selectedBoard - 1;
            } else if (direction === 1 && this.selectedBoard < 8) {
                newBoard = this.selectedBoard + 1;
            }
            
            // Skip won boards, but stop if all boards are completed
            let attempts = 0;
            const startBoard = newBoard;
            while (this.boards[newBoard].winner && attempts < 9) {
                newBoard = (newBoard + direction + 9) % 9;
                attempts++;
                // If we've looped back to start, all boards are complete
                if (newBoard === startBoard) break;
            }
            
            // If all boards have winners, stay on current valid selection
            if (this.boards[newBoard].winner) {
                newBoard = this.selectedBoard;
            }
        }
        
        this.selectedBoard = newBoard;
        this.selectedCell = 4; // Center of new board
        this.highlightSelection();
        window.gamepadManager.vibrate(playerIndex, 30, 0.15, 0);
    }
    
    highlightSelection() {
        // Remove all gamepad highlights
        document.querySelectorAll('.cell.gamepad-selected').forEach(el => {
            el.classList.remove('gamepad-selected');
        });
        document.querySelectorAll('.small-board.gamepad-board-selected').forEach(el => {
            el.classList.remove('gamepad-board-selected');
        });
        
        // Highlight selected board
        const boardEl = document.querySelector(`.small-board[data-board="${this.selectedBoard}"]`);
        if (boardEl) {
            boardEl.classList.add('gamepad-board-selected');
        }
        
        // Highlight selected cell
        const cellEl = document.querySelector(`[data-board="${this.selectedBoard}"][data-cell="${this.selectedCell}"]`);
        if (cellEl) {
            cellEl.classList.add('gamepad-selected');
            cellEl.focus();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new UltimateTicTacToe();
    game.initGame();
    game.setupGamepadControls();
    
    // Make game instance globally accessible for multiplayer events
    window.currentGame = game;

    // Event listeners
    document.getElementById('new-game-btn').addEventListener('click', () => game.resetGame());
    document.getElementById('modal-new-game-btn').addEventListener('click', () => game.resetGame());
    
    document.getElementById('toggle-3d-btn').addEventListener('click', async () => {
        await game.toggle3DMode();
    });
    
    document.getElementById('toggle-instructions-btn').addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        const isHidden = instructions.style.display === 'none';
        instructions.style.display = isHidden ? 'block' : 'none';
        document.getElementById('toggle-instructions-btn').textContent = 
            isHidden ? 'Hide Instructions' : 'How to Play';
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('game-over-modal').classList.remove('show');
        }
    });
    
    // Listen for multiplayer events
    window.addEventListener('multiplayer_game_start', (e) => {
        game.startOnlineGame(e.detail);
    });
    
    window.addEventListener('multiplayer_game_update', (e) => {
        game.updateFromServer(e.detail);
    });
    
    window.addEventListener('multiplayer_game_ended', (e) => {
        game.updateFromServer(e.detail.game);
    });
    
    // Initialize gamepad widget
    if (window.GamepadWidget) {
        const header = document.querySelector('header');
        if (header) {
            const container = document.createElement('div');
            container.id = 'gamepad-status';
            header.after(container);
            new GamepadWidget('gamepad-status');
        }
    }
});
