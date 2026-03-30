/**
 * 4D Chess Game Logic
 * Chess across multiple timelines where moves can affect parallel boards
 * Part of the 9DTTT Game Library
 */

class FourDChess {
    constructor() {
        // Chess piece Unicode characters
        this.PIECES = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };

        // Game state
        this.timelines = 2;
        this.currentTimeline = 0;
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.boards = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;
        this.winner = null;
        
        // Track king positions for check detection
        this.kingPositions = [];
        
        // Track if kings have moved (for castling)
        this.kingMoved = [];
        this.rookMoved = [];
        
        // Multiplayer properties
        this.onlineMode = false;
        this.gameId = null;
        this.playerColor = null;
        this._timelineNavSetup = false;
    }

    /**
     * Initialize the game
     */
    initGame() {
        // Initialize boards for each timeline
        this.boards = [];
        this.kingPositions = [];
        this.kingMoved = [];
        this.rookMoved = [];
        
        for (let t = 0; t < this.timelines; t++) {
            this.boards.push(this.createInitialBoard());
            this.kingPositions.push({
                white: { row: 7, col: 4 },
                black: { row: 0, col: 4 }
            });
            this.kingMoved.push({ white: false, black: false });
            this.rookMoved.push({
                white: { kingside: false, queenside: false },
                black: { kingside: false, queenside: false }
            });
        }

        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;
        this.winner = null;
        this.currentTimeline = 0;

        this.renderAllBoards();
        this.updateUI();
        this.setupTimelineNavigation();
    }

    /**
     * Create initial chess board configuration
     */
    createInitialBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Set up black pieces (top)
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

        // Set up white pieces (bottom)
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

    /**
     * Render all chess boards
     */
    renderAllBoards() {
        for (let t = 0; t < this.timelines; t++) {
            this.renderBoard(t);
        }
    }

    /**
     * Render a single chess board
     */
    renderBoard(timelineIndex) {
        const boardElement = document.getElementById(`chess-board-${timelineIndex}`);
        if (!boardElement) return;

        boardElement.innerHTML = '';
        const board = this.boards[timelineIndex];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.createSquare(timelineIndex, row, col, board[row][col]);
                boardElement.appendChild(square);
            }
        }
    }

    /**
     * Create a chess square element
     */
    createSquare(timeline, row, col, piece) {
        const square = document.createElement('div');
        const isLight = (row + col) % 2 === 0;
        
        square.className = `chess-square ${isLight ? 'light' : 'dark'}`;
        square.setAttribute('data-timeline', timeline);
        square.setAttribute('data-row', row);
        square.setAttribute('data-col', col);
        square.setAttribute('role', 'gridcell');
        square.setAttribute('tabindex', '0');
        
        const colLetter = String.fromCharCode(97 + col);
        const rowNumber = 8 - row;
        const positionName = `${colLetter}${rowNumber}`;
        
        if (piece) {
            const pieceSpan = document.createElement('span');
            pieceSpan.className = `chess-piece ${piece.color}`;
            pieceSpan.textContent = this.PIECES[piece.color][piece.type];
            square.appendChild(pieceSpan);
            square.setAttribute('aria-label', `${positionName}: ${piece.color} ${piece.type}`);
        } else {
            square.setAttribute('aria-label', `${positionName}: empty`);
        }

        // Check if this is the king in check
        if (piece && piece.type === 'king') {
            if (this.isKingInCheck(timeline, piece.color)) {
                square.classList.add('check');
            }
        }

        square.addEventListener('click', () => this.handleSquareClick(timeline, row, col));
        square.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleSquareClick(timeline, row, col);
            }
        });

        return square;
    }

    /**
     * Handle square click
     */
    handleSquareClick(timeline, row, col) {
        if (this.gameOver) return;

        // In online mode, check if it's our turn
        if (this.onlineMode && this.currentPlayer !== this.playerColor) {
            this.showNotification("It's not your turn!");
            return;
        }

        // Must play on current timeline (unless timeline jumping)
        if (timeline !== this.currentTimeline) {
            this.showNotification('Play on the active timeline!');
            return;
        }

        const board = this.boards[timeline];
        const clickedPiece = board[row][col];

        // If a piece is already selected
        if (this.selectedSquare) {
            const { row: fromRow, col: fromCol } = this.selectedSquare;

            // Check if clicking on a valid move
            const isValidMove = this.validMoves.some(
                move => move.row === row && move.col === col
            );

            if (isValidMove) {
                this.makeMove(timeline, fromRow, fromCol, row, col);
                return;
            }

            // If clicking on own piece, select it instead
            if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                this.selectPiece(timeline, row, col);
                return;
            }

            // Otherwise deselect
            this.deselectPiece();
            return;
        }

        // Select a piece if it belongs to current player
        if (clickedPiece && clickedPiece.color === this.currentPlayer) {
            this.selectPiece(timeline, row, col);
        }
    }

    /**
     * Select a piece
     */
    selectPiece(timeline, row, col) {
        this.deselectPiece();
        
        this.selectedSquare = { timeline, row, col };
        this.validMoves = this.getValidMoves(timeline, row, col);
        
        this.highlightSquare(timeline, row, col, 'selected');
        this.highlightValidMoves(timeline);
    }

    /**
     * Deselect current piece
     */
    deselectPiece() {
        if (this.selectedSquare) {
            this.clearHighlights(this.selectedSquare.timeline);
        }
        this.selectedSquare = null;
        this.validMoves = [];
    }

    /**
     * Get valid moves for a piece
     */
    getValidMoves(timeline, row, col) {
        const board = this.boards[timeline];
        const piece = board[row][col];
        if (!piece) return [];

        let moves = [];

        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(timeline, row, col, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(timeline, row, col, piece.color);
                break;
            case 'knight':
                moves = this.getKnightMoves(timeline, row, col, piece.color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(timeline, row, col, piece.color);
                break;
            case 'queen':
                moves = this.getQueenMoves(timeline, row, col, piece.color);
                break;
            case 'king':
                moves = this.getKingMoves(timeline, row, col, piece.color);
                break;
        }

        // Filter out moves that would leave king in check
        moves = moves.filter(move => {
            return !this.wouldBeInCheck(timeline, row, col, move.row, move.col, piece.color);
        });

        return moves;
    }

    /**
     * Get pawn moves
     */
    getPawnMoves(timeline, row, col, color) {
        const moves = [];
        const board = this.boards[timeline];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Forward move
        const newRow = row + direction;
        if (newRow >= 0 && newRow < 8 && !board[newRow][col]) {
            moves.push({ row: newRow, col, type: 'move' });

            // Double move from starting position
            if (row === startRow && !board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col, type: 'move' });
            }
        }

        // Captures
        for (const dc of [-1, 1]) {
            const newCol = col + dc;
            if (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
                const target = board[newRow][newCol];
                if (target && target.color !== color) {
                    moves.push({ row: newRow, col: newCol, type: 'capture' });
                }
            }
        }

        return moves;
    }

    /**
     * Get rook moves
     */
    getRookMoves(timeline, row, col, color) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        return this.getSlidingMoves(timeline, row, col, color, directions);
    }

    /**
     * Get bishop moves
     */
    getBishopMoves(timeline, row, col, color) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        return this.getSlidingMoves(timeline, row, col, color, directions);
    }

    /**
     * Get queen moves
     */
    getQueenMoves(timeline, row, col, color) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        return this.getSlidingMoves(timeline, row, col, color, directions);
    }

    /**
     * Get sliding piece moves (rook, bishop, queen)
     */
    getSlidingMoves(timeline, row, col, color, directions) {
        const moves = [];
        const board = this.boards[timeline];

        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;

            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];
                
                if (!target) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                } else if (target.color !== color) {
                    moves.push({ row: newRow, col: newCol, type: 'capture' });
                    break;
                } else {
                    break;
                }

                newRow += dr;
                newCol += dc;
            }
        }

        return moves;
    }

    /**
     * Get knight moves
     */
    getKnightMoves(timeline, row, col, color) {
        const moves = [];
        const board = this.boards[timeline];
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];
                
                if (!target) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                } else if (target.color !== color) {
                    moves.push({ row: newRow, col: newCol, type: 'capture' });
                }
            }
        }

        return moves;
    }

    /**
     * Get king moves
     */
    getKingMoves(timeline, row, col, color) {
        const moves = [];
        const board = this.boards[timeline];
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];
                
                if (!target) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                } else if (target.color !== color) {
                    moves.push({ row: newRow, col: newCol, type: 'capture' });
                }
            }
        }

        // Castling (simplified - only if king hasn't moved)
        if (!this.kingMoved[timeline][color] && !this.isKingInCheck(timeline, color)) {
            // Kingside castling
            if (!this.rookMoved[timeline][color].kingside) {
                const rookCol = 7;
                if (!board[row][5] && !board[row][6] && 
                    board[row][rookCol]?.type === 'rook' &&
                    !this.isSquareAttacked(timeline, row, 5, color) &&
                    !this.isSquareAttacked(timeline, row, 6, color)) {
                    moves.push({ row, col: 6, type: 'castle-kingside' });
                }
            }
            // Queenside castling
            if (!this.rookMoved[timeline][color].queenside) {
                const rookCol = 0;
                if (!board[row][1] && !board[row][2] && !board[row][3] &&
                    board[row][rookCol]?.type === 'rook' &&
                    !this.isSquareAttacked(timeline, row, 2, color) &&
                    !this.isSquareAttacked(timeline, row, 3, color)) {
                    moves.push({ row, col: 2, type: 'castle-queenside' });
                }
            }
        }

        return moves;
    }

    /**
     * Check if a square is attacked by opponent
     */
    isSquareAttacked(timeline, row, col, defendingColor) {
        const attackingColor = defendingColor === 'white' ? 'black' : 'white';
        const board = this.boards[timeline];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.color === attackingColor) {
                    const attacks = this.getAttackSquares(timeline, r, c, piece);
                    if (attacks.some(sq => sq.row === row && sq.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Get squares a piece attacks (without check filtering)
     */
    getAttackSquares(timeline, row, col, piece) {
        const board = this.boards[timeline];
        
        switch (piece.type) {
            case 'pawn': {
                const direction = piece.color === 'white' ? -1 : 1;
                const attacks = [];
                for (const dc of [-1, 1]) {
                    const newRow = row + direction;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        attacks.push({ row: newRow, col: newCol });
                    }
                }
                return attacks;
            }
            case 'knight':
                return this.getKnightMoves(timeline, row, col, piece.color);
            case 'bishop':
                return this.getBishopMoves(timeline, row, col, piece.color);
            case 'rook':
                return this.getRookMoves(timeline, row, col, piece.color);
            case 'queen':
                return this.getQueenMoves(timeline, row, col, piece.color);
            case 'king': {
                const attacks = [];
                const offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
                for (const [dr, dc] of offsets) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        attacks.push({ row: newRow, col: newCol });
                    }
                }
                return attacks;
            }
            default:
                return [];
        }
    }

    /**
     * Check if king is in check
     */
    isKingInCheck(timeline, color) {
        const kingPos = this.kingPositions[timeline][color];
        return this.isSquareAttacked(timeline, kingPos.row, kingPos.col, color);
    }

    /**
     * Check if move would leave king in check
     */
    wouldBeInCheck(timeline, fromRow, fromCol, toRow, toCol, color) {
        const board = this.boards[timeline];
        const piece = board[fromRow][fromCol];
        const capturedPiece = board[toRow][toCol];

        // Temporarily make the move
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = null;

        // Update king position if moving king
        let oldKingPos = null;
        if (piece.type === 'king') {
            oldKingPos = { ...this.kingPositions[timeline][color] };
            this.kingPositions[timeline][color] = { row: toRow, col: toCol };
        }

        const inCheck = this.isKingInCheck(timeline, color);

        // Undo the move
        board[fromRow][fromCol] = piece;
        board[toRow][toCol] = capturedPiece;

        if (oldKingPos) {
            this.kingPositions[timeline][color] = oldKingPos;
        }

        return inCheck;
    }

    /**
     * Make a move
     */
    makeMove(timeline, fromRow, fromCol, toRow, toCol) {
        const board = this.boards[timeline];
        const piece = board[fromRow][fromCol];
        const capturedPiece = board[toRow][toCol];
        const move = this.validMoves.find(m => m.row === toRow && m.col === toCol);

        // Handle castling
        if (move.type === 'castle-kingside') {
            board[toRow][toCol] = piece;
            board[fromRow][fromCol] = null;
            board[toRow][5] = board[toRow][7];
            board[toRow][7] = null;
            this.kingMoved[timeline][piece.color] = true;
            this.rookMoved[timeline][piece.color].kingside = true;
        } else if (move.type === 'castle-queenside') {
            board[toRow][toCol] = piece;
            board[fromRow][fromCol] = null;
            board[toRow][3] = board[toRow][0];
            board[toRow][0] = null;
            this.kingMoved[timeline][piece.color] = true;
            this.rookMoved[timeline][piece.color].queenside = true;
        } else {
            // Regular move
            board[toRow][toCol] = piece;
            board[fromRow][fromCol] = null;

            // Track if rook or king moved
            if (piece.type === 'king') {
                this.kingMoved[timeline][piece.color] = true;
            }
            if (piece.type === 'rook') {
                if (fromCol === 0) this.rookMoved[timeline][piece.color].queenside = true;
                if (fromCol === 7) this.rookMoved[timeline][piece.color].kingside = true;
            }

            // Handle capture
            if (capturedPiece) {
                this.capturedPieces[piece.color].push(capturedPiece);
                
                // 4D Chess feature: when capturing, piece appears on alternate timeline!
                this.handleTimelineEffect(timeline, toRow, toCol, capturedPiece);
            }

            // Pawn promotion
            if (piece.type === 'pawn') {
                const promotionRow = piece.color === 'white' ? 0 : 7;
                if (toRow === promotionRow) {
                    board[toRow][toCol] = { type: 'queen', color: piece.color };
                }
            }
        }

        // Update king position
        if (piece.type === 'king') {
            this.kingPositions[timeline][piece.color] = { row: toRow, col: toCol };
        }

        // Record move
        this.recordMove(timeline, piece, fromRow, fromCol, toRow, toCol, capturedPiece, move.type);

        // Deselect and update
        this.deselectPiece();

        // Check for game end
        this.checkGameEnd();

        if (!this.gameOver) {
            // Switch player
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        }

        this.renderAllBoards();
        this.updateUI();
    }

    /**
     * Handle 4D timeline effect when capturing
     */
    handleTimelineEffect(timeline, row, col, capturedPiece) {
        // When a piece is captured, a "ghost" of it appears on the alternate timeline
        // This is the 4D aspect - actions ripple across timelines!
        
        // Kings cannot be duplicated across timelines - this would violate chess rules
        if (capturedPiece.type === 'king') {
            return;
        }
        
        const alternateTimeline = (timeline + 1) % this.timelines;
        const altBoard = this.boards[alternateTimeline];

        // Find an empty square near the same position on alternate timeline
        const positions = [
            [row, col],
            [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1],
            [row - 1, col - 1], [row - 1, col + 1], [row + 1, col - 1], [row + 1, col + 1]
        ];

        for (const [r, c] of positions) {
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && !altBoard[r][c]) {
                // Place the captured piece on alternate timeline (color preserved)
                altBoard[r][c] = { ...capturedPiece };
                
                // Add visual effect
                setTimeout(() => {
                    const square = document.querySelector(
                        `[data-timeline="${alternateTimeline}"][data-row="${r}"][data-col="${c}"]`
                    );
                    if (square) {
                        square.classList.add('timeline-jump');
                        setTimeout(() => square.classList.remove('timeline-jump'), 500);
                    }
                }, 100);

                // Record timeline effect in move history
                this.addMoveHistoryEntry(`↪ ${this.PIECES[capturedPiece.color][capturedPiece.type]} appears on Timeline ${alternateTimeline + 1}`, 'timeline-jump');
                
                break;
            }
        }
    }

    /**
     * Record a move in history
     */
    recordMove(timeline, piece, fromRow, fromCol, toRow, toCol, captured, moveType) {
        const fromSquare = String.fromCharCode(97 + fromCol) + (8 - fromRow);
        const toSquare = String.fromCharCode(97 + toCol) + (8 - toRow);
        
        let notation = this.PIECES[piece.color][piece.type];
        
        if (moveType === 'castle-kingside') {
            notation = 'O-O';
        } else if (moveType === 'castle-queenside') {
            notation = 'O-O-O';
        } else {
            notation += fromSquare;
            notation += captured ? 'x' : '-';
            notation += toSquare;
        }
        
        notation += ` (T${timeline + 1})`;

        this.moveHistory.push({
            notation,
            color: piece.color,
            timeline
        });

        this.addMoveHistoryEntry(notation, `${piece.color}-move`);
    }

    /**
     * Add entry to move history display
     */
    addMoveHistoryEntry(text, className) {
        const historyEl = document.getElementById('move-history');
        const entry = document.createElement('span');
        entry.className = `move-entry ${className}`;
        entry.textContent = text;
        historyEl.appendChild(entry);
        historyEl.scrollTop = historyEl.scrollHeight;
    }

    /**
     * Check if game has ended
     */
    checkGameEnd() {
        const opponent = this.currentPlayer === 'white' ? 'black' : 'white';

        // Check for checkmate or stalemate on any timeline
        for (let t = 0; t < this.timelines; t++) {
            const hasValidMoves = this.playerHasValidMoves(t, opponent);
            const inCheck = this.isKingInCheck(t, opponent);

            if (!hasValidMoves) {
                if (inCheck) {
                    // Checkmate!
                    this.gameOver = true;
                    this.winner = this.currentPlayer;
                    this.showGameOver(`Checkmate on Timeline ${t + 1}! ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} wins!`);
                    return;
                }
            }
        }

        // Check if a king was captured (shouldn't happen in normal chess, but with timeline effects...)
        for (let t = 0; t < this.timelines; t++) {
            const board = this.boards[t];
            let whiteKingFound = false;
            let blackKingFound = false;

            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = board[r][c];
                    if (piece?.type === 'king') {
                        if (piece.color === 'white') whiteKingFound = true;
                        if (piece.color === 'black') blackKingFound = true;
                    }
                }
            }

            if (!whiteKingFound) {
                this.gameOver = true;
                this.winner = 'black';
                this.showGameOver('Black wins! White king was eliminated across timelines!');
                return;
            }
            if (!blackKingFound) {
                this.gameOver = true;
                this.winner = 'white';
                this.showGameOver('White wins! Black king was eliminated across timelines!');
                return;
            }
        }
    }

    /**
     * Check if player has any valid moves
     */
    playerHasValidMoves(timeline, color) {
        const board = this.boards[timeline];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(timeline, r, c);
                    if (moves.length > 0) return true;
                }
            }
        }

        return false;
    }

    /**
     * Highlight a square
     */
    highlightSquare(timeline, row, col, className) {
        const square = document.querySelector(
            `[data-timeline="${timeline}"][data-row="${row}"][data-col="${col}"]`
        );
        if (square) {
            square.classList.add(className);
        }
    }

    /**
     * Highlight valid moves
     */
    highlightValidMoves(timeline) {
        for (const move of this.validMoves) {
            const className = move.type === 'capture' || move.type.includes('capture') 
                ? 'valid-capture' 
                : 'valid-move';
            this.highlightSquare(timeline, move.row, move.col, className);
        }
    }

    /**
     * Clear all highlights on a board
     */
    clearHighlights(timeline) {
        const squares = document.querySelectorAll(`[data-timeline="${timeline}"]`);
        squares.forEach(square => {
            square.classList.remove('selected', 'valid-move', 'valid-capture');
        });
    }

    /**
     * Setup timeline navigation
     */
    setupTimelineNavigation() {
        if (this._timelineNavSetup) return;
        this._timelineNavSetup = true;
        const buttons = document.querySelectorAll('.timeline-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const timeline = parseInt(btn.dataset.timeline);
                this.switchTimeline(timeline);
            });
        });
    }

    /**
     * Switch to a different timeline
     */
    switchTimeline(timeline) {
        this.currentTimeline = timeline;
        this.deselectPiece();

        // Update timeline buttons
        document.querySelectorAll('.timeline-btn').forEach((btn, index) => {
            btn.classList.toggle('active', index === timeline);
            btn.setAttribute('aria-selected', index === timeline);
        });

        // Update board visibility
        document.querySelectorAll('.chess-board-wrapper').forEach((wrapper, index) => {
            wrapper.classList.toggle('hidden', index !== timeline);
        });

        document.getElementById('current-timeline').textContent = timeline + 1;

        this.announceToScreenReader(`Switched to Timeline ${timeline + 1}`);
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Update turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        if (this.gameOver) {
            turnIndicator.innerHTML = 'Game Over!';
        } else if (this.onlineMode) {
            const isMyTurn = this.currentPlayer === this.playerColor;
            const playerClass = `player-${this.currentPlayer}`;
            if (isMyTurn) {
                turnIndicator.innerHTML = `Your Turn (<span class="${playerClass}">${this.currentPlayer}</span>)`;
            } else {
                turnIndicator.innerHTML = `Opponent's Turn (<span class="${playerClass}">${this.currentPlayer}</span>)`;
            }
        } else {
            const playerClass = `player-${this.currentPlayer}`;
            turnIndicator.innerHTML = `Current Player: <span class="${playerClass}">${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}</span>`;
        }

        // Update captured pieces display
        document.getElementById('captured-white').textContent = 
            this.capturedPieces.white.map(p => this.PIECES[p.color][p.type]).join(' ');
        document.getElementById('captured-black').textContent = 
            this.capturedPieces.black.map(p => this.PIECES[p.color][p.type]).join(' ');

        // Update timeline count
        document.getElementById('total-timelines').textContent = this.timelines;
    }

    /**
     * Show game over modal
     */
    showGameOver(message) {
        const modal = document.getElementById('game-over-modal');
        const modalMessage = document.getElementById('modal-message');
        
        modalMessage.textContent = message;
        modal.classList.add('show');
        
        this.announceToScreenReader(message);
        
        setTimeout(() => {
            document.getElementById('modal-new-game-btn').focus();
        }, 100);
    }

    /**
     * Show notification
     */
    showNotification(message) {
        this.announceToScreenReader(message);
        
        if (window.gameUI) {
            window.gameUI.showNotification(message, 'info');
        }
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
        announcement.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden';
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    /**
     * Undo last move (local play only)
     */
    undo() {
        if (this.onlineMode || this.moveHistory.length === 0) return;
        
        // For simplicity, just restart - full undo would require storing complete game states
        this.showNotification('Undo not fully implemented - starting new game');
        this.initGame();
    }

    /**
     * Reset game
     */
    resetGame() {
        this.onlineMode = false;
        this.gameId = null;
        this.playerColor = null;
        
        document.getElementById('game-over-modal').classList.remove('show');
        document.getElementById('move-history').innerHTML = '';
        
        this.initGame();
        this.announceToScreenReader('New game started!');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new FourDChess();
    game.initGame();
    
    // Make game instance globally accessible
    window.currentGame = game;

    // Event listeners
    document.getElementById('new-game-btn').addEventListener('click', () => game.resetGame());
    document.getElementById('modal-new-game-btn').addEventListener('click', () => game.resetGame());
    document.getElementById('undo-btn').addEventListener('click', () => game.undo());
    
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
});
