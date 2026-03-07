/**
 * Connect Four Game Logic
 * Classic strategy game - connect 4 in a row to win
 * Part of the 9DTTT Game Library
 */

class ConnectFour {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = [];
        this.currentPlayer = 1; // 1 or 2
        this.gameOver = false;
        this.gameMode = 'ai'; // 'ai' or 'local'
        this.scores = [0, 0];
        this.winningCells = [];
    }

    initGame() {
        if (this._aiTimer) clearTimeout(this._aiTimer);
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winningCells = [];
        
        this.render();
        this.updateUI();
    }

    render() {
        const boardEl = document.getElementById('board');
        if (!boardEl) return;
        
        // Clear and rebuild
        boardEl.innerHTML = '';
        
        // Column buttons
        const colButtons = document.createElement('div');
        colButtons.className = 'column-buttons';
        colButtons.id = 'column-buttons';
        
        for (let col = 0; col < this.cols; col++) {
            const btn = document.createElement('button');
            btn.className = 'col-btn';
            btn.dataset.col = col;
            btn.innerHTML = '<span class="arrow">▼</span>';
            btn.setAttribute('aria-label', `Drop disc in column ${col + 1}`);
            btn.disabled = this.gameOver || this.isColumnFull(col);
            
            btn.addEventListener('click', () => this.dropDisc(col));
            colButtons.appendChild(btn);
        }
        
        boardEl.appendChild(colButtons);
        
        // Board grid
        const grid = document.createElement('div');
        grid.className = 'board-grid';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const value = this.board[row][col];
                if (value === 1) {
                    cell.classList.add('player-1');
                } else if (value === 2) {
                    cell.classList.add('player-2');
                }
                
                // Highlight winning cells
                if (this.winningCells.some(c => c.row === row && c.col === col)) {
                    cell.classList.add('winning');
                }
                
                grid.appendChild(cell);
            }
        }
        
        boardEl.appendChild(grid);
    }

    isColumnFull(col) {
        return this.board[0][col] !== 0;
    }

    getLowestEmptyRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                return row;
            }
        }
        return -1;
    }

    dropDisc(col) {
        if (this.gameOver) return;
        if (this.isColumnFull(col)) return;
        
        const row = this.getLowestEmptyRow(col);
        if (row === -1) return;
        
        this.board[row][col] = this.currentPlayer;
        
        // Add drop animation
        this.render();
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('drop-animation');
        }
        
        // Check for win
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.scores[this.currentPlayer - 1]++;
            this.render();
            this.updateUI();
            this.showWinModal();
            return;
        }
        
        // Check for draw
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.render();
            this.updateUI();
            this.showDrawModal();
            return;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateUI();
        this.render();
        
        // AI move
        if (this.gameMode === 'ai' && this.currentPlayer === 2 && !this.gameOver) {
            this.disableBoard();
            this._aiTimer = setTimeout(() => this.aiMove(), 500);
        }
    }

    disableBoard() {
        document.querySelectorAll('.col-btn').forEach(btn => btn.disabled = true);
    }

    enableBoard() {
        document.querySelectorAll('.col-btn').forEach((btn, col) => {
            btn.disabled = this.isColumnFull(col);
        });
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [[0, 1], [0, -1]],   // Horizontal
            [[1, 0], [-1, 0]],   // Vertical
            [[1, 1], [-1, -1]],  // Diagonal /
            [[1, -1], [-1, 1]]   // Diagonal \
        ];
        
        for (const [dir1, dir2] of directions) {
            const cells = [{ row, col }];
            
            // Check in first direction
            let r = row + dir1[0];
            let c = col + dir1[1];
            while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                cells.push({ row: r, col: c });
                r += dir1[0];
                c += dir1[1];
            }
            
            // Check in opposite direction
            r = row + dir2[0];
            c = col + dir2[1];
            while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                cells.push({ row: r, col: c });
                r += dir2[0];
                c += dir2[1];
            }
            
            if (cells.length >= 4) {
                this.winningCells = cells;
                return true;
            }
        }
        
        return false;
    }

    isBoardFull() {
        return this.board[0].every(cell => cell !== 0);
    }

    aiMove() {
        if (this.gameOver) return;
        
        // Simple AI: Try to win, then block, then random
        let bestCol = this.findWinningMove(2);  // Try to win
        
        if (bestCol === -1) {
            bestCol = this.findWinningMove(1);  // Block opponent
        }
        
        if (bestCol === -1) {
            // Prefer center columns
            const centerCols = [3, 2, 4, 1, 5, 0, 6];
            for (const col of centerCols) {
                if (!this.isColumnFull(col)) {
                    bestCol = col;
                    break;
                }
            }
        }
        
        if (bestCol !== -1) {
            this.dropDisc(bestCol);
        }
    }

    findWinningMove(player) {
        for (let col = 0; col < this.cols; col++) {
            if (this.isColumnFull(col)) continue;
            
            const row = this.getLowestEmptyRow(col);
            this.board[row][col] = player;
            
            const wins = this.checkWinWithoutSaving(row, col, player);
            this.board[row][col] = 0;
            
            if (wins) return col;
        }
        return -1;
    }

    checkWinWithoutSaving(row, col, player) {
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];
        
        for (const [dir1, dir2] of directions) {
            let count = 1;
            
            let r = row + dir1[0];
            let c = col + dir1[1];
            while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                count++;
                r += dir1[0];
                c += dir1[1];
            }
            
            r = row + dir2[0];
            c = col + dir2[1];
            while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
                count++;
                r += dir2[0];
                c += dir2[1];
            }
            
            if (count >= 4) return true;
        }
        
        return false;
    }

    showWinModal() {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        const winner = this.currentPlayer;
        const emoji = winner === 1 ? '🔴' : '🟡';
        const name = this.gameMode === 'ai' 
            ? (winner === 1 ? 'You' : 'Computer')
            : `Player ${winner}`;
        
        title.textContent = `${emoji} ${name} Win${this.gameMode === 'ai' && winner === 1 ? '' : 's'}!`;
        message.innerHTML = `
            Congratulations! ${name} connected 4 in a row!<br><br>
            Score: 🔴 ${this.scores[0]} - ${this.scores[1]} 🟡
        `;
        
        modal.classList.add('show');
    }

    showDrawModal() {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        title.textContent = "🤝 It's a Draw!";
        message.innerHTML = `
            The board is full with no winner!<br><br>
            Score: 🔴 ${this.scores[0]} - ${this.scores[1]} 🟡
        `;
        
        modal.classList.add('show');
    }

    updateUI() {
        const currentTurn = document.getElementById('current-turn');
        const score1 = document.getElementById('score-1');
        const score2 = document.getElementById('score-2');
        
        if (currentTurn) {
            const emoji = this.currentPlayer === 1 ? '🔴' : '🟡';
            const name = this.gameMode === 'ai'
                ? (this.currentPlayer === 1 ? 'Your Turn' : "Computer's Turn")
                : `Player ${this.currentPlayer}`;
            currentTurn.textContent = `${name} (${emoji})`;
            currentTurn.className = `player-${this.currentPlayer}`;
        }
        
        if (score1) score1.textContent = this.scores[0];
        if (score2) score2.textContent = this.scores[1];
    }
    
    /**
     * Setup gamepad controls for column selection
     */
    setupGamepadControls() {
        if (!window.gamepadManager) return;
        
        this.selectedColumn = 3; // Start in middle
        this.highlightColumn(this.selectedColumn);
        
        // Listen for gamepad button events
        window.gamepadManager.on('buttondown', (data) => this.handleGamepadInput(data));
    }
    
    handleGamepadInput(data) {
        if (this.gameOver) return;
        
        const { button, playerIndex } = data;
        
        // In AI mode, only Player 1 (gamepad 0) can play
        // In local mode, each player can only control during their turn
        if (this.gameMode === 'ai') {
            // AI mode: only accept input from gamepad 0
            if (playerIndex !== 0) return;
        } else {
            // Local mode: Player 1 (currentPlayer=1) uses gamepad 0, Player 2 uses gamepad 1
            const expectedGamepad = this.currentPlayer === 1 ? 0 : 1;
            if (playerIndex !== expectedGamepad) return;
        }
        
        switch (button) {
            case 'left':
                this.selectedColumn = Math.max(0, this.selectedColumn - 1);
                this.highlightColumn(this.selectedColumn);
                window.gamepadManager.vibrate(playerIndex, 20, 0.1, 0);
                break;
            case 'right':
                this.selectedColumn = Math.min(this.cols - 1, this.selectedColumn + 1);
                this.highlightColumn(this.selectedColumn);
                window.gamepadManager.vibrate(playerIndex, 20, 0.1, 0);
                break;
            case 'a': // Drop disc
                if (!this.isColumnFull(this.selectedColumn)) {
                    this.dropDisc(this.selectedColumn);
                    window.gamepadManager.vibrate(playerIndex, 50, 0.3, 0.2);
                }
                break;
            case 'y': // New game
                this.initGame();
                break;
        }
    }
    
    highlightColumn(col) {
        // Remove previous highlight
        document.querySelectorAll('.col-btn').forEach(btn => btn.classList.remove('gamepad-selected'));
        
        // Add highlight to selected column
        const btn = document.querySelector(`.col-btn[data-col="${col}"]`);
        if (btn) {
            btn.classList.add('gamepad-selected');
            btn.focus();
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const game = new ConnectFour();
    
    document.getElementById('mode-ai')?.addEventListener('click', () => {
        document.getElementById('mode-ai')?.classList.add('active');
        document.getElementById('mode-local')?.classList.remove('active');
        game.gameMode = 'ai';
        game.scores = [0, 0];
        game.initGame();
    });
    
    document.getElementById('mode-local')?.addEventListener('click', () => {
        document.getElementById('mode-local')?.classList.add('active');
        document.getElementById('mode-ai')?.classList.remove('active');
        game.gameMode = 'local';
        game.scores = [0, 0];
        game.initGame();
    });
    
    document.getElementById('new-game-btn')?.addEventListener('click', () => game.initGame());
    document.getElementById('modal-new-game-btn')?.addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.remove('show');
        game.initGame();
    });
    
    document.getElementById('toggle-instructions-btn')?.addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    });
    
    game.initGame();
    game.setupGamepadControls();
});
