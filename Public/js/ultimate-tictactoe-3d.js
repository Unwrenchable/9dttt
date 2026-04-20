/**
 * 9D Tic-Tac-Toe 3D Renderer using Babylon.js
 * Holographic 3D version of the Ultimate Tic-Tac-Toe game
 * Part of the 9DTTT Game Library
 */

class UltimateTicTacToe3D {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.canvas = document.getElementById('renderCanvas');
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.boards = [];
        this.cells = [];
        this.activeBoardHighlight = null;
        this.particleSystem = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the 3D scene
     */
    async init() {
        if (this.isInitialized) return;

        // Check if Babylon.js is available
        if (typeof BABYLON === 'undefined') {
            console.warn("Babylon.js not loaded, falling back to 2D mode");
            this.fallbackTo2D();
            return;
        }

        try {
            // Create Babylon engine
            this.engine = new BABYLON.Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true
            });

            // Create scene
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.05, 1); // Dark space background

            // Create camera
            this.camera = new BABYLON.ArcRotateCamera(
                "camera",
                -Math.PI / 2,
                Math.PI / 3,
                25,
                BABYLON.Vector3.Zero(),
                this.scene
            );
            this.camera.attachControls(this.canvas, true);
            this.camera.lowerRadiusLimit = 15;
            this.camera.upperRadiusLimit = 40;
            this.camera.wheelPrecision = 3.0;

            // Create lights
            const ambientLight = new BABYLON.HemisphericLight(
                "ambientLight",
                new BABYLON.Vector3(0, 1, 0),
                this.scene
            );
            ambientLight.intensity = 0.3;

            const directionalLight = new BABYLON.DirectionalLight(
                "directionalLight",
                new BABYLON.Vector3(-1, -1, -1),
                this.scene
            );
            directionalLight.intensity = 0.7;

            // Create particle system for effects
            this.createParticleSystem();

            // Create the 9 boards in 3x3 grid
            this.createBoards();

            // Handle window resize
            window.addEventListener('resize', () => {
                this.engine.resize();
            });

            // Handle pointer events for game interaction
            this.setupPointerEvents();

            // Start render loop
            this.engine.runRenderLoop(() => {
                this.scene.render();
            });

            this.isInitialized = true;
            console.log("3D scene initialized successfully");

        } catch (error) {
            console.error("Failed to initialize 3D scene:", error);
            this.fallbackTo2D();
        }
    }

    /**
     * Create particle system for visual effects
     */
    createParticleSystem() {
        this.particleSystem = new BABYLON.ParticleSystem("particles", 2000, this.scene);
        this.particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", this.scene);
        this.particleSystem.emitter = new BABYLON.Vector3(0, 0, 0);
        this.particleSystem.minEmitBox = new BABYLON.Vector3(-20, -20, -20);
        this.particleSystem.maxEmitBox = new BABYLON.Vector3(20, 20, 20);
        this.particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        this.particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        this.particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
        this.particleSystem.minSize = 0.1;
        this.particleSystem.maxSize = 0.3;
        this.particleSystem.minLifeTime = 0.3;
        this.particleSystem.maxLifeTime = 1.5;
        this.particleSystem.emitRate = 150;
        this.particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        this.particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
        this.particleSystem.direction1 = new BABYLON.Vector3(-1, 8, 1);
        this.particleSystem.direction2 = new BABYLON.Vector3(1, 8, -1);
        this.particleSystem.minAngularSpeed = 0;
        this.particleSystem.maxAngularSpeed = Math.PI;
        this.particleSystem.minEmitPower = 1;
        this.particleSystem.maxEmitPower = 3;
        this.particleSystem.updateSpeed = 0.025;
    }

    /**
     * Create the 9 holographic boards in 3x3 formation
     */
    createBoards() {
        const boardSpacing = 8;
        const boardSize = 4;

        for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
            const row = Math.floor(boardIndex / 3);
            const col = boardIndex % 3;

            const x = (col - 1) * boardSpacing;
            const y = (1 - row) * boardSpacing;
            const z = 0;

            // Create board plane with holographic material
            const board = BABYLON.MeshBuilder.CreatePlane(`board_${boardIndex}`, {
                width: boardSize,
                height: boardSize
            }, this.scene);

            board.position = new BABYLON.Vector3(x, y, z);
            board.rotation.x = Math.PI / 6; // Slight tilt for holographic effect

            // Advanced holographic material
            const boardMaterial = new BABYLON.StandardMaterial(`boardMat_${boardIndex}`, this.scene);
            boardMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
            boardMaterial.alpha = 0.8;
            boardMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 1.0);
            boardMaterial.specularPower = 128;
            boardMaterial.backFaceCulling = false;
            board.material = boardMaterial;

            // Add holographic border with animated glow
            const borderMaterial = new BABYLON.StandardMaterial(`borderMat_${boardIndex}`, this.scene);
            borderMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.5);
            borderMaterial.alpha = 0.4;

            const border = BABYLON.MeshBuilder.CreatePlane(`border_${boardIndex}`, {
                width: boardSize + 0.3,
                height: boardSize + 0.3
            }, this.scene);
            border.position = new BABYLON.Vector3(x, y, z - 0.02);
            border.rotation.x = Math.PI / 6;
            border.material = borderMaterial;

            // Add connection lines between boards (holographic grid)
            if (col < 2) {
                this.createConnectionLine(x + boardSize/2, y, z, x + boardSpacing - boardSize/2, y, z);
            }
            if (row < 2) {
                this.createConnectionLine(x, y - boardSize/2, z, x, y - boardSpacing + boardSize/2, z);
            }

            // Create cells for this board
            const cells = [];
            for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
                const cellRow = Math.floor(cellIndex / 3);
                const cellCol = cellIndex % 3;

                const cellX = x + (cellCol - 1) * (boardSize / 3);
                const cellY = y + (1 - cellRow) * (boardSize / 3);
                const cellZ = z + 0.02;

                const cell = BABYLON.MeshBuilder.CreatePlane(`cell_${boardIndex}_${cellIndex}`, {
                    width: boardSize / 3 - 0.1,
                    height: boardSize / 3 - 0.1
                }, this.scene);

                cell.position = new BABYLON.Vector3(cellX, cellY, cellZ);
                cell.rotation.x = Math.PI / 6;

                const cellMaterial = new BABYLON.StandardMaterial(`cellMat_${boardIndex}_${cellIndex}`, this.scene);
                cellMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.1);
                cellMaterial.alpha = 0.6;
                cell.material = cellMaterial;

                // Store cell data
                cell.boardIndex = boardIndex;
                cell.cellIndex = cellIndex;

                cells.push(cell);
            }

            this.boards.push({
                mesh: board,
                border: border,
                cells: cells,
                winner: null,
                connectionLines: [] // Will store connection lines
            });
        }
    }

    /**
     * Create animated connection lines between boards
     */
    createConnectionLine(x1, y1, z1, x2, y2, z2) {
        const lineMaterial = new BABYLON.StandardMaterial("lineMat", this.scene);
        lineMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.8);
        lineMaterial.alpha = 0.6;

        // Create multiple lines for animated effect
        for (let i = 0; i < 3; i++) {
            const line = BABYLON.MeshBuilder.CreateLines(`connection_${i}`, {
                points: [
                    new BABYLON.Vector3(x1, y1, z1 + i * 0.01),
                    new BABYLON.Vector3(x2, y2, z2 + i * 0.01)
                ]
            }, this.scene);
            line.material = lineMaterial;

            // Animate the line opacity
            const animation = BABYLON.Animation.CreateAndStartAnimation(
                `lineGlow_${i}`,
                line.material,
                'alpha',
                30,
                120,
                0.3,
                0.8,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
                null,
                i * 40 // Stagger the animations
            );
        }
    }

    /**
     * Setup pointer events for game interaction
     */
    setupPointerEvents() {
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.pickInfo.hit) {
                        const pickedMesh = pointerInfo.pickInfo.pickedMesh;
                        if (pickedMesh && pickedMesh.name.startsWith('cell_')) {
                            const parts = pickedMesh.name.split('_');
                            const boardIndex = parseInt(parts[1]);
                            const cellIndex = parseInt(parts[2]);
                            this.handleCellClick(boardIndex, cellIndex);
                        }
                    }
                    break;
            }
        });
    }

    /**
     * Handle cell click in 3D
     */
    handleCellClick(boardIndex, cellIndex) {
        // Delegate to the main game logic
        this.game.handleCellClick(boardIndex, cellIndex);
    }

    /**
     * Update the 3D board display based on game state
     */
    updateBoard() {
        if (!this.isInitialized) return;

        this.boards.forEach((board, boardIndex) => {
            const gameBoard = this.game.boards[boardIndex];

            // Update board appearance based on winner
            let emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
            let borderColor = new BABYLON.Color3(0.3, 0.3, 0.5);

            if (gameBoard.winner === 'X') {
                emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.8);
                borderColor = new BABYLON.Color3(0.4, 0.6, 1.0);
            } else if (gameBoard.winner === 'O') {
                emissiveColor = new BABYLON.Color3(0.8, 0.3, 0.3);
                borderColor = new BABYLON.Color3(1.0, 0.5, 0.5);
            } else if (gameBoard.winner === 'draw') {
                emissiveColor = new BABYLON.Color3(0.6, 0.5, 0.2);
                borderColor = new BABYLON.Color3(0.8, 0.7, 0.4);
            }

            board.mesh.material.emissiveColor = emissiveColor;
            board.border.material.emissiveColor = borderColor;

            // Highlight active board
            const isActive = this.game.activeBoard === null ||
                           this.game.activeBoard === boardIndex;

            if (isActive && !gameBoard.winner) {
                board.border.material.emissiveColor = new BABYLON.Color3(1.0, 0.8, 0.0);
                // Add pulsing animation
                const animation = BABYLON.Animation.CreateAndStartAnimation(
                    `pulse_${boardIndex}`,
                    board.border,
                    'scaling',
                    30,
                    60,
                    new BABYLON.Vector3(1, 1, 1),
                    new BABYLON.Vector3(1.05, 1.05, 1.05),
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
            } else {
                // Stop pulsing
                this.scene.stopAnimation(board.border);
                board.border.scaling = new BABYLON.Vector3(1, 1, 1);
            }

            // Update cells
            board.cells.forEach((cell, cellIndex) => {
                const cellValue = gameBoard.cells[cellIndex];
                let cellColor = new BABYLON.Color3(0.05, 0.05, 0.1);

                if (cellValue === 'X') {
                    cellColor = new BABYLON.Color3(0.3, 0.5, 1.0);
                } else if (cellValue === 'O') {
                    cellColor = new BABYLON.Color3(1.0, 0.4, 0.4);
                }

                cell.material.emissiveColor = cellColor;

                // Add piece meshes for X and O
                if (cellValue && !cell.piece) {
                    this.createPiece(cell, cellValue, boardIndex, cellIndex);
                }
            });
        });
    }

    /**
     * Create 3D piece (X or O) on a cell
     */
    createPiece(cell, piece, boardIndex, cellIndex) {
        let pieceMesh;

        if (piece === 'X') {
            // Create X shape using two crossing cylinders for a more 3D holographic look
            pieceMesh = new BABYLON.Mesh(`piece_X_${boardIndex}_${cellIndex}`, this.scene);

            const bar1 = BABYLON.MeshBuilder.CreateCylinder(`x1_${boardIndex}_${cellIndex}`, {
                height: 0.8,
                diameter: 0.08
            }, this.scene);
            bar1.rotation.z = Math.PI / 4;
            bar1.parent = pieceMesh;

            const bar2 = BABYLON.MeshBuilder.CreateCylinder(`x2_${boardIndex}_${cellIndex}`, {
                height: 0.8,
                diameter: 0.08
            }, this.scene);
            bar2.rotation.z = -Math.PI / 4;
            bar2.parent = pieceMesh;

        } else if (piece === 'O') {
            // Create O shape using torus with holographic rings
            pieceMesh = BABYLON.MeshBuilder.CreateTorus(`piece_O_${boardIndex}_${cellIndex}`, {
                diameter: 0.6,
                thickness: 0.08,
                tessellation: 32
            }, this.scene);

            // Add inner ring for extra holographic effect
            const innerRing = BABYLON.MeshBuilder.CreateTorus(`inner_O_${boardIndex}_${cellIndex}`, {
                diameter: 0.4,
                thickness: 0.04,
                tessellation: 24
            }, this.scene);
            innerRing.parent = pieceMesh;
        }

        if (pieceMesh) {
            pieceMesh.position = cell.position.clone();
            pieceMesh.position.z += 0.05;

            const material = new BABYLON.StandardMaterial(`pieceMat_${piece}_${boardIndex}_${cellIndex}`, this.scene);
            material.emissiveColor = piece === 'X' ?
                new BABYLON.Color3(0.3, 0.5, 1.0) :
                new BABYLON.Color3(1.0, 0.4, 0.4);
            material.specularColor = new BABYLON.Color3(0.8, 0.8, 1.0);
            material.specularPower = 64;
            pieceMesh.material = material;

            cell.piece = pieceMesh;

            // Enhanced placement animation with glow effect
            const animation = BABYLON.Animation.CreateAndStartAnimation(
                `place_${boardIndex}_${cellIndex}`,
                pieceMesh,
                'scaling',
                30,
                30,
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(1, 1, 1),
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            // Add particle burst on placement
            this.createPlacementParticles(cell.position.clone(), piece === 'X' ?
                new BABYLON.Color4(0.3, 0.5, 1.0, 1.0) :
                new BABYLON.Color4(1.0, 0.4, 0.4, 1.0));
        }
    }

    /**
     * Create particle burst for piece placement
     */
    createPlacementParticles(position, color) {
        const particleSystem = new BABYLON.ParticleSystem(`placement_particles`, 50, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", this.scene);
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
        particleSystem.color1 = color;
        particleSystem.color2 = new BABYLON.Color4(color.r * 0.5, color.g * 0.5, color.b * 0.5, 0.5);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
        particleSystem.minSize = 0.02;
        particleSystem.maxSize = 0.08;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.0;
        particleSystem.emitRate = 200;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 2, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-2, 4, -2);
        particleSystem.direction2 = new BABYLON.Vector3(2, 6, 2);
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;
        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 5;

        particleSystem.start();
        setTimeout(() => {
            particleSystem.stop();
            particleSystem.dispose();
        }, 1000);
    }

    /**
     * Animate camera to focus on a specific board
     */
    focusOnBoard(boardIndex) {
        if (!this.isInitialized) return;

        const row = Math.floor(boardIndex / 3);
        const col = boardIndex % 3;
        const x = (col - 1) * 8;
        const y = (1 - row) * 8;

        const targetPosition = new BABYLON.Vector3(x, y, 12);
        const targetTarget = new BABYLON.Vector3(x, y, 0);

        // Smooth camera transition
        BABYLON.Animation.CreateAndStartAnimation(
            'camera_focus',
            this.camera,
            'position',
            30,
            45,
            this.camera.position.clone(),
            targetPosition,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        BABYLON.Animation.CreateAndStartAnimation(
            'camera_target',
            this.camera,
            'target',
            30,
            45,
            this.camera.target.clone(),
            targetTarget,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        // Add board highlight pulse
        const board = this.boards[boardIndex];
        if (board) {
            const pulseAnimation = BABYLON.Animation.CreateAndStartAnimation(
                `board_highlight_${boardIndex}`,
                board.border,
                'scaling',
                60,
                30,
                board.border.scaling.clone(),
                new BABYLON.Vector3(1.2, 1.2, 1.2),
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );

            // Stop highlight after animation
            setTimeout(() => {
                this.scene.stopAnimation(board.border);
                board.border.scaling = new BABYLON.Vector3(1, 1, 1);
            }, 1000);
        }
    }

    /**
     * Show "send to board" particle effect
     */
    showSendToBoardEffect(fromBoard, toBoard) {
        if (!this.isInitialized) return;

        const fromPos = this.boards[fromBoard].mesh.position.clone();
        const toPos = this.boards[toBoard].mesh.position.clone();

        // Create particle trail from one board to another
        const particleSystem = new BABYLON.ParticleSystem(`send_particles_${fromBoard}_${toBoard}`, 100, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", this.scene);
        particleSystem.emitter = fromPos;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
        particleSystem.color1 = new BABYLON.Color4(0.8, 0.6, 1.0, 1.0);
        particleSystem.color2 = new BABYLON.Color4(0.4, 0.8, 1.0, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
        particleSystem.minSize = 0.05;
        particleSystem.maxSize = 0.15;
        particleSystem.minLifeTime = 1.0;
        particleSystem.maxLifeTime = 2.0;
        particleSystem.emitRate = 50;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = toPos.subtract(fromPos).normalize().scale(2);
        particleSystem.direction2 = toPos.subtract(fromPos).normalize().scale(3);
        particleSystem.minAngularSpeed = -Math.PI;
        particleSystem.maxAngularSpeed = Math.PI;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;

        particleSystem.start();

        // Add screen shake effect
        this.addScreenShake(0.5);

        setTimeout(() => {
            particleSystem.stop();
            particleSystem.dispose();
        }, 2000);
    }

    /**
     * Add screen shake effect
     */
    addScreenShake(intensity = 0.3, duration = 500) {
        const originalPosition = this.camera.position.clone();
        let shakeTime = 0;

        const shakeAnimation = () => {
            shakeTime += 16; // ~60fps
            if (shakeTime >= duration) return;

            const shakeX = (Math.random() - 0.5) * intensity;
            const shakeY = (Math.random() - 0.5) * intensity;
            const shakeZ = (Math.random() - 0.5) * intensity;

            this.camera.position = originalPosition.add(new BABYLON.Vector3(shakeX, shakeY, shakeZ));

            requestAnimationFrame(shakeAnimation);
        };

        requestAnimationFrame(shakeAnimation);
    }

    /**
     * Show win effect
     */
    showWinEffect(boardIndex) {
        if (!this.isInitialized) return;

        // Start particle system at board position
        const board = this.boards[boardIndex];
        this.particleSystem.emitter = board.mesh.position.clone();
        this.particleSystem.start();

        // Stop after 2 seconds
        setTimeout(() => {
            this.particleSystem.stop();
        }, 2000);
    }

    /**
     * Cleanup 3D resources
     */
    dispose() {
        if (this.engine) {
            this.engine.dispose();
            this.engine = null;
            this.scene = null;
            this.isInitialized = false;
        }
    }

    /**
     * Fallback to 2D mode if 3D fails
     */
    fallbackTo2D() {
        console.warn("3D initialization failed, falling back to 2D mode");
        document.getElementById('toggle-3d-btn').textContent = '3D Unavailable';
        document.getElementById('toggle-3d-btn').disabled = true;
        this.show2D();
    }

    /**
     * Show 2D board
     */
    show2D() {
        document.getElementById('ultimate-board').style.display = 'grid';
        this.canvas.style.display = 'none';
        if (this.engine) {
            this.engine.stopRenderLoop();
        }
    }

    /**
     * Show 3D board
     */
    show3D() {
        document.getElementById('ultimate-board').style.display = 'none';
        this.canvas.style.display = 'block';
        if (this.isInitialized) {
            this.engine.runRenderLoop(() => {
                this.scene.render();
            });
        }
    }
}