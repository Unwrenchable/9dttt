/**
 * Quantum Sudoku Game Logic
 * Sudoku with quantum superposition mechanics
 * Part of the 9DTTT Game Library
 */

class QuantumSudoku {
    constructor() {
        this.board = [];
        this.solution = [];
        this.initialBoard = [];
        this.quantumCells = [];
        this.selectedCell = null;
        this.selectedNumber = null;
        this.moveCount = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.difficulty = 'medium';
        this.gameOver = false;
        this.hintsUsed = 0;
        this.maxHints = 3;

        // Clean up timer on page navigation
        window.addEventListener('beforeunload', () => {
            if (this.timerInterval) clearInterval(this.timerInterval);
        });
    }

    /**
     * Initialize the game
     */
    initGame() {
        this.stopTimer();
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solution = this.generateSolution();
        this.initialBoard = this.createPuzzle();
        this.board = this.initialBoard.map(row => [...row]);
        this.quantumCells = this.selectQuantumCells();
        this.selectedCell = null;
        this.selectedNumber = null;
        this.moveCount = 0;
        this.timer = 0;
        this.gameOver = false;
        this.hintsUsed = 0;
        
        this.renderBoard();
        this.startTimer();
        this.updateUI();
    }

    /**
     * Generate a valid Sudoku solution using backtracking
     */
    generateSolution() {
        const grid = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillGrid(grid);
        return grid;
    }

    /**
     * Fill grid using backtracking
     */
    fillGrid(grid) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    const shuffled = this.shuffle([...numbers]);
                    
                    for (const num of shuffled) {
                        if (this.isValidPlacement(grid, row, col, num)) {
                            grid[row][col] = num;
                            
                            if (this.fillGrid(grid)) {
                                return true;
                            }
                            
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Shuffle array using Fisher-Yates
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Check if a number placement is valid
     */
    isValidPlacement(grid, row, col, num) {
        // Check row
        if (grid[row].includes(num)) return false;
        
        // Check column
        for (let r = 0; r < 9; r++) {
            if (grid[r][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r][c] === num) return false;
            }
        }
        
        return true;
    }

    /**
     * Create puzzle by removing numbers from solution
     */
    createPuzzle() {
        const puzzle = this.solution.map(row => [...row]);
        const cellsToRemove = {
            easy: 35,
            medium: 45,
            hard: 55
        };
        
        let removed = 0;
        const target = cellsToRemove[this.difficulty];
        const positions = [];
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                positions.push([r, c]);
            }
        }
        
        this.shuffle(positions);
        
        for (const [row, col] of positions) {
            if (removed >= target) break;
            
            const backup = puzzle[row][col];
            puzzle[row][col] = 0;
            removed++;
        }
        
        return puzzle;
    }

    /**
     * Select cells to be in quantum superposition
     */
    selectQuantumCells() {
        const quantumCount = {
            easy: 3,
            medium: 5,
            hard: 8
        };
        
        const emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.initialBoard[r][c] === 0) {
                    emptyCells.push({ row: r, col: c });
                }
            }
        }
        
        this.shuffle(emptyCells);
        return emptyCells.slice(0, quantumCount[this.difficulty]);
    }

    /**
     * Get possible values for a cell (superposition)
     */
    getPossibleValues(row, col) {
        const possible = [];
        for (let num = 1; num <= 9; num++) {
            const testGrid = this.board.map(r => [...r]);
            testGrid[row][col] = 0;
            if (this.isValidPlacement(testGrid, row, col, num)) {
                possible.push(num);
            }
        }
        return possible.length > 0 ? possible : [this.solution[row][col]];
    }

    /**
     * Check if a cell is quantum
     */
    isQuantumCell(row, col) {
        return this.quantumCells.some(q => q.row === row && q.col === col) && 
               this.board[row][col] === 0;
    }

    /**
     * Collapse quantum cell (observe it)
     */
    collapseQuantum(row, col) {
        const index = this.quantumCells.findIndex(q => q.row === row && q.col === col);
        if (index !== -1 && this.board[row][col] === 0) {
            // Reveal the correct value
            this.board[row][col] = this.solution[row][col];
            this.quantumCells.splice(index, 1);
            this.updateQuantumMessage(`Quantum collapsed! Value revealed: ${this.solution[row][col]}`);
            this.renderBoard();
            this.checkWin();
        }
    }

    /**
     * Render the Sudoku board
     */
    renderBoard() {
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement) return;
        
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('tabindex', '0');
                
                const value = this.board[row][col];
                const isFixed = this.initialBoard[row][col] !== 0;
                const isQuantum = this.isQuantumCell(row, col);
                
                if (isFixed) {
                    cell.classList.add('fixed');
                    cell.textContent = value;
                    cell.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}, fixed value ${value}`);
                } else if (isQuantum) {
                    cell.classList.add('quantum');
                    const possible = this.getPossibleValues(row, col);
                    const superposition = document.createElement('div');
                    superposition.className = 'superposition';
                    superposition.textContent = possible.slice(0, 4).join(' ');
                    cell.appendChild(superposition);
                    cell.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}, quantum state with possible values ${possible.join(', ')}`);
                } else if (value !== 0) {
                    cell.textContent = value;
                    // Check if value is correct
                    if (value !== this.solution[row][col]) {
                        cell.classList.add('error');
                    }
                    cell.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}, value ${value}`);
                } else {
                    cell.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}, empty`);
                }
                
                if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
                    cell.classList.add('selected');
                }
                
                // Highlight same row, column, and box
                if (this.selectedCell) {
                    const sameRow = this.selectedCell.row === row;
                    const sameCol = this.selectedCell.col === col;
                    const sameBox = Math.floor(this.selectedCell.row / 3) === Math.floor(row / 3) &&
                                   Math.floor(this.selectedCell.col / 3) === Math.floor(col / 3);
                    
                    if ((sameRow || sameCol || sameBox) && 
                        !(this.selectedCell.row === row && this.selectedCell.col === col)) {
                        cell.classList.add('highlight');
                    }
                }
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                cell.addEventListener('keydown', (e) => this.handleCellKeydown(e, row, col));
                
                boardElement.appendChild(cell);
            }
        }
    }

    /**
     * Handle cell click
     */
    handleCellClick(row, col) {
        if (this.gameOver) return;
        
        // Check if it's a quantum cell
        if (this.isQuantumCell(row, col)) {
            this.collapseQuantum(row, col);
            return;
        }
        
        // Don't allow selecting fixed cells
        if (this.initialBoard[row][col] !== 0) {
            return;
        }
        
        this.selectedCell = { row, col };
        this.renderBoard();
        
        // If a number is already selected, place it
        if (this.selectedNumber !== null && this.selectedNumber !== 0) {
            this.placeNumber(row, col, this.selectedNumber);
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleCellKeydown(e, row, col) {
        if (this.gameOver) return;
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (row > 0) this.focusCell(row - 1, col);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (row < 8) this.focusCell(row + 1, col);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (col > 0) this.focusCell(row, col - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (col < 8) this.focusCell(row, col + 1);
                break;
            case '1': case '2': case '3': case '4': case '5':
            case '6': case '7': case '8': case '9':
                e.preventDefault();
                this.handleCellClick(row, col);
                this.placeNumber(row, col, parseInt(e.key));
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.handleCellClick(row, col);
                this.placeNumber(row, col, 0);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.handleCellClick(row, col);
                break;
        }
    }

    /**
     * Focus a specific cell
     */
    focusCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.focus();
            this.handleCellClick(row, col);
        }
    }

    /**
     * Place a number in the selected cell
     */
    placeNumber(row, col, number) {
        if (this.initialBoard[row][col] !== 0) return;
        if (this.isQuantumCell(row, col)) return;
        
        this.board[row][col] = number;
        this.moveCount++;
        this.updateUI();
        this.renderBoard();
        this.checkWin();
    }

    /**
     * Handle number pad click
     */
    handleNumberClick(number) {
        this.selectedNumber = number;
        
        // Update number pad UI
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.num) === number) {
                btn.classList.add('active');
            }
        });
        
        // If a cell is selected, place the number
        if (this.selectedCell && !this.isQuantumCell(this.selectedCell.row, this.selectedCell.col)) {
            this.placeNumber(this.selectedCell.row, this.selectedCell.col, number);
        }
    }

    /**
     * Give a hint
     */
    giveHint() {
        if (this.hintsUsed >= this.maxHints || this.gameOver) return;
        
        // Find an empty cell
        const emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0 && this.initialBoard[r][c] === 0 && 
                    !this.isQuantumCell(r, c)) {
                    emptyCells.push({ row: r, col: c });
                }
            }
        }
        
        if (emptyCells.length === 0) return;
        
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.board[cell.row][cell.col] = this.solution[cell.row][cell.col];
        this.hintsUsed++;
        this.moveCount++;
        
        this.updateQuantumMessage(`Hint used! ${this.maxHints - this.hintsUsed} hints remaining.`);
        this.renderBoard();
        this.updateUI();
        this.checkWin();
    }

    /**
     * Check if the puzzle is solved
     */
    checkWin() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] !== this.solution[r][c]) {
                    return false;
                }
            }
        }
        
        this.gameOver = true;
        this.stopTimer();
        this.showWinModal();
        return true;
    }

    /**
     * Show win modal
     */
    showWinModal() {
        const modal = document.getElementById('game-over-modal');
        const message = document.getElementById('modal-message');
        
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        message.innerHTML = `
            You completed the ${this.difficulty} puzzle!<br>
            Time: ${timeStr}<br>
            Moves: ${this.moveCount}<br>
            Hints used: ${this.hintsUsed}
        `;
        
        modal.classList.add('show');
    }

    /**
     * Update quantum message
     */
    updateQuantumMessage(message) {
        const messageEl = document.getElementById('quantum-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    /**
     * Start timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            const minutes = Math.floor(this.timer / 60);
            const seconds = this.timer % 60;
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Update UI
     */
    updateUI() {
        const diffEl = document.getElementById('difficulty-level');
        const moveEl = document.getElementById('move-count');
        
        if (diffEl) diffEl.textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        if (moveEl) moveEl.textContent = this.moveCount;
    }

    /**
     * Set difficulty
     */
    setDifficulty(diff) {
        this.difficulty = diff;
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.diff === diff);
        });
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new QuantumSudoku();
    
    // Setup number pad
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            game.handleNumberClick(parseInt(btn.dataset.num));
        });
    });
    
    // Setup difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            game.setDifficulty(btn.dataset.diff);
        });
    });
    
    // Setup control buttons
    document.getElementById('new-game-btn')?.addEventListener('click', () => game.initGame());
    document.getElementById('hint-btn')?.addEventListener('click', () => game.giveHint());
    document.getElementById('modal-new-game-btn')?.addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.remove('show');
        game.initGame();
    });
    
    // Instructions toggle
    document.getElementById('toggle-instructions-btn')?.addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '9') {
            game.handleNumberClick(parseInt(e.key));
        } else if (e.key === '0' || e.key === 'Delete' || e.key === 'Backspace') {
            if (!e.target.closest('.sudoku-cell')) {
                game.handleNumberClick(0);
            }
        }
    });
    
    // Start the game
    game.initGame();
});
