/**
 * Beat-Em-Up Game Engine
 * Modular engine for side-scrolling beat-em-up games
 * Designed for easy expansion with new levels, characters, and enemies
 * 
 * Part of the 9DTTT Game Library
 */

// ==================== GAME ENGINE CORE ====================

class BeatEmUpEngine {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Default config
        this.config = {
            width: config.width || 800,
            height: config.height || 450,
            gravity: config.gravity || 0.35,
            groundY: config.groundY || 350,
            maxPlayers: config.maxPlayers || 4,
            ...config
        };
        
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, gameover, victory
        this.players = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.pickups = [];
        
        // Level management
        this.currentLevel = null;
        this.levelIndex = 0;
        this.levels = [];
        this.camera = { x: 0, y: 0 };
        this.levelProgress = 0;
        
        // Input
        this.keys = {};
        this.gamepadStates = [{}, {}, {}, {}];
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        
        // Score & stats
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;

        // RAF tracking (cancellable loop)
        this._rafId = null;
        this._inputSetup = false;
        
        this.init();
    }

    init() {
        this.setupInput();
        this.gameLoop(0);
    }

    setupInput() {
        if (this._inputSetup) return;
        this._inputSetup = true;
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Gamepad input
        if (window.gamepadManager) {
            window.gamepadManager.on('buttondown', (data) => {
                this.handleGamepadButton(data.playerIndex, data.button, true);
            });
            
            window.gamepadManager.on('buttonup', (data) => {
                this.handleGamepadButton(data.playerIndex, data.button, false);
            });
        }
    }

    handleGamepadButton(playerIndex, button, pressed) {
        if (!this.gamepadStates[playerIndex]) {
            this.gamepadStates[playerIndex] = {};
        }
        this.gamepadStates[playerIndex][button] = pressed;
        
        // Handle menu/start
        if (pressed && button === 'start') {
            if (this.state === 'menu') {
                this.startGame();
            } else if (this.state === 'paused') {
                this.resumeGame();
            } else if (this.state === 'playing') {
                this.pauseGame();
            }
        }
    }

    // ==================== GAME LOOP ====================

    gameLoop(timestamp) {
        // Stop the loop permanently when the game has ended
        if (this.state === 'gameover' || this.state === 'victory') {
            this._rafId = null;
            return;
        }

        this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        
        this.update();
        this.render();
        
        this._rafId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update() {
        if (this.state !== 'playing') return;
        
        this.gameTime += this.deltaTime;
        
        // Update players
        this.players.forEach(player => {
            if (player.active) {
                this.updatePlayer(player);
            }
        });
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                this.updateEnemy(enemy);
            }
        });
        
        // Update projectiles
        this.projectiles.forEach(proj => {
            if (proj.active) {
                this.updateProjectile(proj);
            }
        });
        
        // Update effects
        this.effects = this.effects.filter(effect => {
            effect.timer -= this.deltaTime;
            return effect.timer > 0;
        });
        
        // Update pickups
        this.pickups.forEach(pickup => {
            if (pickup.active) {
                this.checkPickupCollision(pickup);
            }
        });
        
        // Cleanup
        this.enemies = this.enemies.filter(e => e.active);
        this.projectiles = this.projectiles.filter(p => p.active);
        this.pickups = this.pickups.filter(p => p.active);
        
        // Update combo
        if (this.comboTimer > 0) {
            this.comboTimer -= this.deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        // Update camera
        this.updateCamera();
        
        // Check level progress
        this.checkLevelProgress();
        
        // Spawn enemies
        if (this.currentLevel) {
            this.currentLevel.update(this.deltaTime, this);
        }
    }

    // ==================== PLAYER LOGIC ====================

    updatePlayer(player) {
        const input = this.getPlayerInput(player.index);
        
        // Movement
        player.vx = 0;
        if (input.left) player.vx = -player.speed;
        if (input.right) player.vx = player.speed;
        if (input.up && player.y >= this.config.groundY - 50) player.vy = -9;
        
        // Actions
        if (input.attack && player.attackCooldown <= 0) {
            this.playerAttack(player);
        }
        if (input.special && player.specialCooldown <= 0 && player.special > 0) {
            this.playerSpecial(player);
        }
        
        // Physics
        player.vy += this.config.gravity;
        player.x += player.vx;
        player.y += player.vy;
        
        // Ground collision
        if (player.y > this.config.groundY) {
            player.y = this.config.groundY;
            player.vy = 0;
            player.grounded = true;
        } else {
            player.grounded = false;
        }
        
        // Screen bounds
        player.x = Math.max(this.camera.x + 30, Math.min(player.x, this.camera.x + this.config.width - 30));
        
        // Cooldowns
        if (player.attackCooldown > 0) player.attackCooldown -= this.deltaTime;
        if (player.specialCooldown > 0) player.specialCooldown -= this.deltaTime;
        if (player.invincible > 0) player.invincible -= this.deltaTime;
        
        // Animation
        this.updateAnimation(player);
    }

    getPlayerInput(playerIndex) {
        const input = { left: false, right: false, up: false, down: false, attack: false, special: false };
        
        // Keyboard (Player 1)
        if (playerIndex === 0) {
            input.left = this.keys['ArrowLeft'] || this.keys['KeyA'];
            input.right = this.keys['ArrowRight'] || this.keys['KeyD'];
            input.up = this.keys['ArrowUp'] || this.keys['KeyW'];
            input.down = this.keys['ArrowDown'] || this.keys['KeyS'];
            input.attack = this.keys['KeyZ'] || this.keys['KeyJ'];
            input.special = this.keys['KeyX'] || this.keys['KeyK'];
        }
        
        // Keyboard (Player 2)
        if (playerIndex === 1) {
            input.left = this.keys['KeyG'];
            input.right = this.keys['KeyJ'];
            input.up = this.keys['KeyY'];
            input.down = this.keys['KeyH'];
            input.attack = this.keys['KeyB'];
            input.special = this.keys['KeyN'];
        }
        
        // Gamepad input
        if (window.gamepadManager) {
            const gp = this.gamepadStates[playerIndex] || {};
            const state = window.gamepadManager.getState(playerIndex);
            
            if (state) {
                input.left = input.left || gp.left || state.axes.leftX < -0.5;
                input.right = input.right || gp.right || state.axes.leftX > 0.5;
                input.up = input.up || gp.up || state.axes.leftY < -0.5;
                input.down = input.down || gp.down || state.axes.leftY > 0.5;
                input.attack = input.attack || gp.a || gp.x;
                input.special = input.special || gp.b || gp.y;
            }
        }
        
        return input;
    }

    playerAttack(player) {
        player.attackCooldown = 0.3;
        player.state = 'attacking';
        player.animTimer = 0;
        
        // Check for enemy hits
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < player.attackRange && Math.sign(dx) === (player.facing || 1)) {
                this.damageEnemy(enemy, player.damage, player);
            }
        });
        
        this.addEffect(player.x + (player.facing || 1) * 30, player.y - 20, 'attack');
    }

    playerSpecial(player) {
        player.specialCooldown = 1;
        player.special--;
        player.state = 'special';
        player.animTimer = 0;
        
        // Area damage
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 100) {
                this.damageEnemy(enemy, player.damage * 2, player);
            }
        });
        
        this.addEffect(player.x, player.y, 'special');
    }

    damagePlayer(player, damage, source) {
        if (player.invincible > 0) return;
        
        player.health -= damage;
        player.invincible = 1;
        player.state = 'hurt';
        player.animTimer = 0;
        
        // Knockback
        player.vx = (player.x < source.x ? -5 : 5);
        player.vy = -3;
        
        this.addEffect(player.x, player.y - 20, 'hit');
        
        if (player.health <= 0) {
            player.health = 0;
            player.active = false;
            player.state = 'dead';
            
            // Check game over
            if (!this.players.some(p => p.active)) {
                this.gameOver();
            }
        }
    }

    // ==================== ENEMY LOGIC ====================

    updateEnemy(enemy) {
        if (enemy.stunned > 0) {
            enemy.stunned -= this.deltaTime;
            return;
        }
        
        // Find nearest player
        let nearestPlayer = null;
        let nearestDist = Infinity;
        
        this.players.forEach(player => {
            if (!player.active) return;
            const dist = Math.abs(player.x - enemy.x);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestPlayer = player;
            }
        });
        
        if (nearestPlayer) {
            enemy.behavior(enemy, nearestPlayer, this);
        }
        
        // Physics
        enemy.vy += this.config.gravity;
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        
        // Ground
        if (enemy.y > this.config.groundY) {
            enemy.y = this.config.groundY;
            enemy.vy = 0;
        }
        
        // Cooldowns
        if (enemy.attackCooldown > 0) enemy.attackCooldown -= this.deltaTime;
        
        this.updateAnimation(enemy);
    }

    damageEnemy(enemy, damage, source) {
        enemy.health -= damage;
        enemy.stunned = 0.2;
        enemy.vx = (enemy.x < source.x ? 5 : -5);
        
        this.combo++;
        this.comboTimer = 2;
        this.score += damage * (1 + Math.floor(this.combo / 5));
        
        this.addEffect(enemy.x, enemy.y - 20, 'hit');
        
        if (enemy.health <= 0) {
            enemy.active = false;
            this.score += enemy.points || 100;
            
            // Drop pickup
            if (Math.random() < 0.3) {
                this.spawnPickup(enemy.x, enemy.y);
            }
            
            this.addEffect(enemy.x, enemy.y, 'death');
        }
    }

    spawnEnemy(type, x, y) {
        const enemyTypes = this.currentLevel?.enemyTypes || {};
        const template = enemyTypes[type] || this.getDefaultEnemy(type);
        
        const enemy = {
            ...template,
            x, y,
            vx: 0, vy: 0,
            active: true,
            stunned: 0,
            attackCooldown: 0,
            animTimer: 0,
            animFrame: 0
        };
        
        this.enemies.push(enemy);
        return enemy;
    }

    getDefaultEnemy(type) {
        const types = {
            grunt: {
                type: 'grunt',
                health: 30,
                maxHealth: 30,
                damage: 10,
                speed: 1.5,
                points: 100,
                width: 40,
                height: 60,
                color: '#8B0000',
                behavior: this.gruntBehavior.bind(this)
            },
            brute: {
                type: 'brute',
                health: 80,
                maxHealth: 80,
                damage: 20,
                speed: 1,
                points: 300,
                width: 50,
                height: 70,
                color: '#4B0082',
                behavior: this.bruteBehavior.bind(this)
            },
            boss: {
                type: 'boss',
                health: 300,
                maxHealth: 300,
                damage: 30,
                speed: 2,
                points: 1000,
                width: 70,
                height: 90,
                color: '#FFD700',
                behavior: this.bossBehavior.bind(this)
            }
        };
        return types[type] || types.grunt;
    }

    gruntBehavior(enemy, target, engine) {
        const dx = target.x - enemy.x;
        const dist = Math.abs(dx);
        
        enemy.facing = Math.sign(dx);
        
        if (dist > 50) {
            enemy.vx = Math.sign(dx) * enemy.speed;
            enemy.state = 'walking';
        } else {
            enemy.vx = 0;
            if (enemy.attackCooldown <= 0) {
                enemy.state = 'attacking';
                enemy.attackCooldown = 1;
                setTimeout(() => {
                    if (enemy.active && Math.abs(target.x - enemy.x) < 60) {
                        engine.damagePlayer(target, enemy.damage, enemy);
                    }
                }, 200);
            }
        }
    }

    bruteBehavior(enemy, target, engine) {
        const dx = target.x - enemy.x;
        const dist = Math.abs(dx);
        
        enemy.facing = Math.sign(dx);
        
        if (dist > 70) {
            enemy.vx = Math.sign(dx) * enemy.speed;
            enemy.state = 'walking';
        } else {
            enemy.vx = 0;
            if (enemy.attackCooldown <= 0) {
                enemy.state = 'attacking';
                enemy.attackCooldown = 2;
                setTimeout(() => {
                    if (enemy.active && Math.abs(target.x - enemy.x) < 80) {
                        engine.damagePlayer(target, enemy.damage, enemy);
                    }
                }, 500);
            }
        }
    }

    bossBehavior(enemy, target, engine) {
        const dx = target.x - enemy.x;
        const dist = Math.abs(dx);
        
        enemy.facing = Math.sign(dx);
        
        // Boss has multiple attack patterns
        if (enemy.attackCooldown <= 0) {
            const pattern = Math.floor(Math.random() * 3);
            
            if (pattern === 0 && dist < 100) {
                // Melee
                enemy.state = 'attacking';
                enemy.attackCooldown = 1.5;
                setTimeout(() => {
                    if (enemy.active && Math.abs(target.x - enemy.x) < 100) {
                        engine.damagePlayer(target, enemy.damage, enemy);
                    }
                }, 300);
            } else if (pattern === 1) {
                // Charge
                enemy.state = 'charging';
                enemy.vx = Math.sign(dx) * enemy.speed * 3;
                enemy.attackCooldown = 2;
            } else {
                // Jump attack
                enemy.state = 'jumping';
                enemy.vy = -12;
                enemy.vx = Math.sign(dx) * enemy.speed * 2;
                enemy.attackCooldown = 2;
            }
        } else if (enemy.state !== 'charging') {
            if (dist > 150) {
                enemy.vx = Math.sign(dx) * enemy.speed;
                enemy.state = 'walking';
            } else {
                enemy.vx = 0;
                enemy.state = 'idle';
            }
        }
    }

    // ==================== PICKUPS ====================

    spawnPickup(x, y) {
        const types = ['health', 'special', 'points'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.pickups.push({
            x, y,
            type,
            active: true,
            timer: 10
        });
    }

    checkPickupCollision(pickup) {
        pickup.timer -= this.deltaTime;
        if (pickup.timer <= 0) {
            pickup.active = false;
            return;
        }
        
        this.players.forEach(player => {
            if (!player.active) return;
            
            const dx = pickup.x - player.x;
            const dy = pickup.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 30) {
                pickup.active = false;
                
                switch (pickup.type) {
                    case 'health':
                        player.health = Math.min(player.maxHealth, player.health + 30);
                        break;
                    case 'special':
                        player.special = Math.min(3, player.special + 1);
                        break;
                    case 'points':
                        this.score += 500;
                        break;
                }
                
                this.addEffect(pickup.x, pickup.y, 'pickup');
            }
        });
    }

    // ==================== EFFECTS ====================

    addEffect(x, y, type) {
        this.effects.push({
            x, y, type,
            timer: 0.3
        });
    }

    // ==================== CAMERA ====================

    updateCamera() {
        // Follow rightmost active player
        let maxX = 0;
        this.players.forEach(p => {
            if (p.active && p.x > maxX) maxX = p.x;
        });
        
        const targetX = Math.max(0, maxX - this.config.width / 2);
        const maxCameraX = this.currentLevel ? this.currentLevel.width - this.config.width : 0;
        
        this.camera.x += (Math.min(targetX, maxCameraX) - this.camera.x) * 0.1;
    }

    // ==================== ANIMATION ====================

    updateAnimation(entity) {
        entity.animTimer = (entity.animTimer || 0) + this.deltaTime;
        if (entity.animTimer > 0.1) {
            entity.animTimer = 0;
            entity.animFrame = ((entity.animFrame || 0) + 1) % 4;
        }
    }

    // ==================== LEVEL MANAGEMENT ====================

    loadLevel(levelIndex) {
        if (levelIndex >= this.levels.length) {
            this.victory();
            return;
        }
        
        this.levelIndex = levelIndex;
        this.currentLevel = this.levels[levelIndex];
        this.currentLevel.init(this);
        
        this.enemies = [];
        this.projectiles = [];
        this.pickups = [];
        this.effects = [];
        this.camera.x = 0;
        
        // Reset players
        this.players.forEach((player, i) => {
            player.x = 100 + i * 50;
            player.y = this.config.groundY;
            player.health = player.maxHealth;
            player.active = true;
            player.state = 'idle';
        });
    }

    checkLevelProgress() {
        if (!this.currentLevel) return;
        
        if (this.currentLevel.isComplete(this)) {
            this.loadLevel(this.levelIndex + 1);
        }
    }

    // ==================== GAME STATE ====================

    startGame(numPlayers = 1) {
        this.state = 'playing';
        this.score = 0;
        this.combo = 0;
        this.players = [];
        
        for (let i = 0; i < numPlayers; i++) {
            this.players.push(this.createPlayer(i));
        }
        
        this.loadLevel(0);
    }

    createPlayer(index) {
        const colors = ['#2196F3', '#F44336', '#4CAF50', '#FF9800'];
        const names = ['Leo', 'Raph', 'Donnie', 'Mikey'];
        
        return {
            index,
            name: names[index],
            x: 100 + index * 50,
            y: this.config.groundY,
            vx: 0,
            vy: 0,
            width: 40,
            height: 60,
            color: colors[index],
            health: 100,
            maxHealth: 100,
            special: 3,
            damage: 15,
            speed: 4,
            attackRange: 60,
            attackCooldown: 0,
            specialCooldown: 0,
            invincible: 0,
            active: true,
            grounded: false,
            facing: 1,
            state: 'idle',
            animTimer: 0,
            animFrame: 0
        };
    }

    pauseGame() {
        this.state = 'paused';
    }

    resumeGame() {
        this.state = 'playing';
    }

    gameOver() {
        this.state = 'gameover';
        
        // Submit scores to leaderboard
        if (window.gameIntegration) {
            this.players.forEach(player => {
                if (player.score) {
                    gameIntegration.submitScore(Math.floor(player.score), {
                        level: this.levelIndex + 1,
                        enemies: player.enemiesDefeated || 0
                    });
                }
            });
        }
    }

    victory() {
        this.state = 'victory';
        
        // Submit final scores to leaderboard
        if (window.gameIntegration) {
            this.players.forEach(player => {
                if (player.score) {
                    gameIntegration.submitScore(Math.floor(player.score), {
                        level: this.levels.length,
                        enemies: player.enemiesDefeated || 0,
                        completed: true
                    });
                }
            });
        }
    }

    stop() {
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    // ==================== RENDERING ====================

    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw level background
        if (this.currentLevel) {
            this.currentLevel.render(this.ctx, this.camera);
        }
        
        // Draw ground
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.camera.x, this.config.groundY + 30, this.config.width, 100);
        
        // Draw pickups
        this.pickups.forEach(pickup => this.renderPickup(pickup));
        
        // Draw enemies
        this.enemies.forEach(enemy => this.renderEnemy(enemy));
        
        // Draw players
        this.players.forEach(player => this.renderPlayer(player));
        
        // Draw effects
        this.effects.forEach(effect => this.renderEffect(effect));
        
        this.ctx.restore();
        
        // Draw UI (fixed position)
        this.renderUI();
        
        // Draw state screens
        if (this.state === 'menu') this.renderMenu();
        if (this.state === 'paused') this.renderPaused();
        if (this.state === 'gameover') this.renderGameOver();
        if (this.state === 'victory') this.renderVictory();
    }

    renderPlayer(player) {
        if (!player.active && player.state !== 'dead') return;
        
        const flash = player.invincible > 0 && Math.floor(player.invincible * 10) % 2;
        if (flash) return;

        if (window.humanoidRenderer) {
            // Map engine state to HumanoidRenderer state
            let hrState = 'idle';
            if (player.state === 'attacking') hrState = player.attackType === 'kick' ? 'kick' : 'punch';
            else if (player.state === 'jumping') hrState = 'jump';
            else if (player.state === 'dead') hrState = 'dead';
            else if (player.state === 'hurt') hrState = 'hurt';
            else if (player.state === 'walking') hrState = 'walk';
            window.humanoidRenderer.draw(this.ctx, player.x, player.y, {
                facing:    player.facing || 1,
                scale:     0.85,
                state:     hrState,
                animTime:  Date.now(),
                cloth:     player.color || '#3060c0',
                accent:    '#f0c040',
                skin:      '#e8c090',
                hair:      '#1a1a1a',
                boot:      '#2a1810',
                muscular:  false,
            });
        } else {
            // Fallback
            this.ctx.save();
            this.ctx.translate(player.x, player.y);
            this.ctx.scale(player.facing || 1, 1);
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(-20, -60, 40, 60);
            this.ctx.fillStyle = '#FFE4C4';
            this.ctx.beginPath();
            this.ctx.arc(0, -70, 15, 0, Math.PI * 2);
            this.ctx.fill();
            if (player.state === 'attacking') {
                this.ctx.fillStyle = player.color;
                this.ctx.fillRect(20, -40, 30, 10);
            }
            this.ctx.restore();
        }
    }

    renderEnemy(enemy) {
        if (!enemy.active) return;

        // Health bar (always drawn above enemy)
        const healthPct = enemy.health / enemy.maxHealth;
        this.ctx.save();
        this.ctx.translate(enemy.x, enemy.y);
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(-25, -enemy.height - 10, 50, 6);
        this.ctx.fillStyle = healthPct > 0.3 ? '#4CAF50' : '#F44336';
        this.ctx.fillRect(-25, -enemy.height - 10, 50 * healthPct, 6);
        this.ctx.restore();

        if (window.humanoidRenderer) {
            let hrState = 'idle';
            if (enemy.state === 'attacking') hrState = 'punch';
            else if (enemy.state === 'hurt') hrState = 'hurt';
            else if (enemy.state === 'chasing') hrState = 'walk';
            const bossScale = (enemy.isBoss ? 1.05 : 0.78);
            window.humanoidRenderer.draw(this.ctx, enemy.x, enemy.y, {
                facing:    enemy.facing || -1,
                scale:     bossScale,
                state:     hrState,
                animTime:  Date.now(),
                cloth:     enemy.color || '#c03030',
                accent:    '#880000',
                skin:      '#d4a070',
                hair:      '#222',
                boot:      '#1a1a1a',
                muscular:  enemy.isBoss || false,
            });
        } else {
            // Fallback
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            this.ctx.scale(enemy.facing || 1, 1);
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(-enemy.width/2, -enemy.height, enemy.width, enemy.height);
            this.ctx.restore();
        }
    }

    renderPickup(pickup) {
        const colors = { health: '#4CAF50', special: '#2196F3', points: '#FFD700' };
        const icons = { health: '❤️', special: '⚡', points: '💰' };
        
        this.ctx.fillStyle = colors[pickup.type];
        this.ctx.beginPath();
        this.ctx.arc(pickup.x, pickup.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(icons[pickup.type], pickup.x, pickup.y + 5);
    }

    renderEffect(effect) {
        this.ctx.save();
        this.ctx.globalAlpha = effect.timer / 0.3;
        
        if (effect.type === 'hit') {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💥', effect.x, effect.y);
        } else if (effect.type === 'attack') {
            this.ctx.strokeStyle = '#FFF';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, 30 * (1 - effect.timer / 0.3), 0, Math.PI * 2);
            this.ctx.stroke();
        } else if (effect.type === 'special') {
            this.ctx.fillStyle = '#00BFFF';
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, 100 * (1 - effect.timer / 0.3), 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    renderUI() {
        // Score
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        
        // Combo
        if (this.combo > 1) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`${this.combo}x Combo!`, 20, 60);
        }
        
        // Player health bars
        this.players.forEach((player, i) => {
            const x = 20 + i * 180;
            const y = this.config.height - 50;
            
            // Name
            this.ctx.fillStyle = player.color;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(`P${i + 1}: ${player.name}`, x, y);
            
            // Health bar
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(x, y + 5, 150, 15);
            this.ctx.fillStyle = player.health > 30 ? '#4CAF50' : '#F44336';
            this.ctx.fillRect(x, y + 5, 150 * (player.health / player.maxHealth), 15);
            
            // Special charges
            for (let s = 0; s < player.special; s++) {
                this.ctx.fillStyle = '#2196F3';
                this.ctx.fillRect(x + s * 20, y + 25, 15, 10);
            }
        });
    }

    renderMenu() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('STREET BRAWLERS', this.config.width / 2, 150);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press START or SPACE to play', this.config.width / 2, 250);
        this.ctx.fillText('1-4 Players supported', this.config.width / 2, 290);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('Controls: Arrows/WASD to move, Z/J to attack, X/K for special', this.config.width / 2, 350);
        this.ctx.fillText('Gamepad: D-pad/Stick to move, A to attack, B for special', this.config.width / 2, 380);
    }

    renderPaused() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.config.width / 2, this.config.height / 2);
    }

    renderGameOver() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        
        this.ctx.fillStyle = '#F44336';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.config.width / 2, 180);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '32px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, 250);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press START or SPACE to retry', this.config.width / 2, 320);
    }

    renderVictory() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VICTORY!', this.config.width / 2, 180);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '32px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, 250);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press START or SPACE to play again', this.config.width / 2, 320);
    }

    // ==================== PROJECTILES ====================

    updateProjectile(proj) {
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        // Check bounds
        if (proj.x < this.camera.x - 50 || proj.x > this.camera.x + this.config.width + 50) {
            proj.active = false;
            return;
        }
        
        // Check collision
        const targets = proj.fromPlayer ? this.enemies : this.players;
        targets.forEach(target => {
            if (!target.active) return;
            
            const dx = target.x - proj.x;
            const dy = target.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 30) {
                proj.active = false;
                if (proj.fromPlayer) {
                    this.damageEnemy(target, proj.damage, proj);
                } else {
                    this.damagePlayer(target, proj.damage, proj);
                }
            }
        });
    }

    // ==================== LEVEL CLASS ====================
}

/**
 * Level Template - Extend this to create new levels
 */
class BeatEmUpLevel {
    constructor(config = {}) {
        this.name = config.name || 'Level';
        this.width = config.width || 2000;
        this.backgroundColor = config.backgroundColor || '#1a1a2e';
        this.groundColor = config.groundColor || '#333';
        this.enemyTypes = config.enemyTypes || {};
        this.waves = config.waves || [];
        this.currentWave = 0;
        this.waveTimer = 0;
        this.bossDefeated = false;
    }

    init(engine) {
        this.currentWave = 0;
        this.waveTimer = 2;
        this.bossDefeated = false;
    }

    update(deltaTime, engine) {
        this.waveTimer -= deltaTime;
        
        if (this.waveTimer <= 0 && this.currentWave < this.waves.length) {
            const wave = this.waves[this.currentWave];
            
            // Check if current enemies are cleared
            if (engine.enemies.length === 0 || !wave.waitForClear) {
                this.spawnWave(wave, engine);
                this.currentWave++;
                this.waveTimer = wave.delay || 3;
            }
        }
    }

    spawnWave(wave, engine) {
        wave.enemies.forEach(spawn => {
            for (let i = 0; i < (spawn.count || 1); i++) {
                const x = engine.camera.x + engine.config.width + 50 + i * 50;
                const y = engine.config.groundY;
                engine.spawnEnemy(spawn.type, x, y);
            }
        });
    }

    isComplete(engine) {
        return this.currentWave >= this.waves.length && engine.enemies.length === 0;
    }

    render(ctx, camera) {
        // Override for custom backgrounds
    }
}

// Export
window.BeatEmUpEngine = BeatEmUpEngine;
window.BeatEmUpLevel = BeatEmUpLevel;
