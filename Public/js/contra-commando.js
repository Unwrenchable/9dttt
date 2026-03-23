/**
 * Contra Commando - Classic run-and-gun action
 * Side-scrolling shooter with platforming, power-ups, and intense combat
 */

class ContraCommando {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1000;
        this.canvas.height = 600;
        
        this.state = 'menu';
        this.coopMode = false;
        this.level = 1;
        this.score = 0;
        this.lives = 3;
        
        this.players = [];
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.platforms = [];
        this.particles = [];
        this.explosions = [];
        
        this.camera = { x: 0, y: 0 };
        this.levelWidth = 5000;
        this.gravity = 0.6;
        
        this.keys = {};
        this.lastTime = 0;
        this.running = false;

        // Konami Code sequence: ↑↑↓↓←→←→BA (KeyboardEvent.code values)
        this.konamiCode = [
            'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
            'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
            'KeyB','KeyA'
        ];
        this.konamiProgress = 0;
        this.konamiBannerTimer = 0;  // counts down in frames; 240 ≈ 4 s at 60 fps
        
        this.weaponTypes = {
            rifle: { name: 'RIFLE', icon: '🔫', damage: 10, speed: 15, spread: 0, cooldown: 100 },
            spread: { name: 'SPREAD', icon: '📢', damage: 8, speed: 12, spread: 3, cooldown: 150 },
            laser: { name: 'LASER', icon: '⚡', damage: 15, speed: 20, spread: 0, cooldown: 50 },
            rocket: { name: 'ROCKET', icon: '🚀', damage: 50, speed: 10, spread: 0, cooldown: 500 },
            flame: { name: 'FLAME', icon: '🔥', damage: 5, speed: 8, spread: 5, cooldown: 30 }
        };
        
        this.setupInput();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            
            if (e.code === 'KeyP' && this.state === 'playing') {
                this.state = 'paused';
            } else if (e.code === 'KeyP' && this.state === 'paused') {
                this.state = 'playing';
            }

            // Konami Code: ↑↑↓↓←→←→BA
            if (e.code === this.konamiCode[this.konamiProgress]) {
                this.konamiProgress++;
                if (this.konamiProgress === this.konamiCode.length) {
                    this.konamiProgress = 0;
                    this.activateKonamiCode();
                }
            } else {
                this.konamiProgress = e.code === this.konamiCode[0] ? 1 : 0;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    activateKonamiCode() {
        this.lives += 30;
        this.konamiBannerTimer = 240;
        this.updateHUD();
    }
    
    start(coop = false) {
        this.coopMode = coop;
        this.state = 'playing';
        this.running = true;
        this.lastTime = 0;
        document.getElementById('startScreen').classList.add('hidden');
        
        this.initLevel();
        this.gameLoop(0);
    }
    
    initLevel() {
        // Clear game objects from previous level
        this.bullets = [];
        this.powerups = [];
        this.particles = [];
        this.explosions = [];
        this.camera = { x: 0, y: 0 };

        // Create player(s)
        this.players = [{
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            width: 30,
            height: 40,
            health: 100,
            maxHealth: 100,
            weapon: 'rifle',
            facingRight: true,
            onGround: false,
            canJump: true,
            shootCooldown: 0,
            color: '#00ff00',
            controls: {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                jump: 'Space',
                shoot: 'KeyZ',
                special: 'KeyX',
                switchWeapon: 'KeyC'
            }
        }];
        
        if (this.coopMode) {
            this.players.push({
                x: 150,
                y: 400,
                vx: 0,
                vy: 0,
                width: 30,
                height: 40,
                health: 100,
                maxHealth: 100,
                weapon: 'rifle',
                facingRight: true,
                onGround: false,
                canJump: true,
                shootCooldown: 0,
                color: '#ff0000',
                controls: {
                    left: 'KeyA',
                    right: 'KeyD',
                    jump: 'KeyW',
                    shoot: 'KeyJ',
                    special: 'KeyK',
                    switchWeapon: 'KeyL'
                }
            });
        }
        
        this.generateLevel();
        this.spawnEnemies();
    }
    
    generateLevel() {
        this.platforms = [];
        
        // Ground
        for (let i = 0; i < this.levelWidth / 100; i++) {
            this.platforms.push({
                x: i * 100,
                y: 550,
                width: 100,
                height: 50,
                type: 'ground'
            });
        }
        
        // Floating platforms
        for (let i = 0; i < 30; i++) {
            this.platforms.push({
                x: 200 + i * 150 + Math.random() * 50,
                y: 300 + Math.random() * 150,
                width: 80 + Math.random() * 40,
                height: 20,
                type: 'platform'
            });
        }
        
        // Obstacles
        for (let i = 0; i < 20; i++) {
            this.platforms.push({
                x: 300 + i * 200 + Math.random() * 100,
                y: 480,
                width: 60,
                height: 70,
                type: 'obstacle'
            });
        }
    }
    
    spawnEnemies() {
        const enemyTypes = [
            { type: 'soldier', health: 30, speed: 1, damage: 10, score: 100, color: '#ff4444' },
            { type: 'turret', health: 50, speed: 0, damage: 15, score: 200, color: '#888888' },
            { type: 'tank', health: 100, speed: 0.5, damage: 25, score: 500, color: '#444444' },
            { type: 'flyer', health: 20, speed: 2, damage: 5, score: 150, color: '#4444ff' }
        ];
        
        for (let i = 0; i < 50; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const x = 500 + i * 100 + Math.random() * 200;
            
            this.enemies.push({
                x: x,
                y: type.type === 'flyer' ? 200 + Math.random() * 200 : 510,
                vx: type.speed * (Math.random() < 0.5 ? 1 : -1),
                vy: 0,
                width: 30,
                height: type.type === 'tank' ? 50 : 40,
                health: type.health,
                maxHealth: type.health,
                shootCooldown: 0,
                facingRight: true,
                ...type
            });
        }
        
        // Boss at the end
        this.enemies.push({
            x: this.levelWidth - 500,
            y: 450,
            vx: 0,
            vy: 0,
            width: 80,
            height: 100,
            health: 500,
            maxHealth: 500,
            type: 'boss',
            speed: 0.5,
            damage: 30,
            score: 5000,
            color: '#ff0000',
            shootCooldown: 0,
            facingRight: false,
            isBoss: true
        });
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Update players
        this.players.forEach(player => {
            this.updatePlayer(player, deltaTime);
        });
        
        // Update enemies
        this.enemies.forEach(enemy => {
            this.updateEnemy(enemy, deltaTime);
        });
        
        // Update bullets
        this.bullets.forEach(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            // Check collisions
            if (bullet.friendly) {
                this.enemies.forEach(enemy => {
                    if (this.checkCollision(bullet, enemy) && bullet.active) {
                        this.damageEnemy(enemy, bullet.damage);
                        bullet.active = false;
                        this.createHitEffect(bullet.x, bullet.y);
                    }
                });
            } else {
                this.players.forEach(player => {
                    if (this.checkCollision(bullet, player) && bullet.active) {
                        this.damagePlayer(player, bullet.damage);
                        bullet.active = false;
                        this.createHitEffect(bullet.x, bullet.y);
                    }
                });
            }
        });
        this.bullets = this.bullets.filter(b => b.life > 0 && b.active && b.x > this.camera.x - 100 && b.x < this.camera.x + this.canvas.width + 100);
        
        // Update power-ups
        this.powerups.forEach(powerup => {
            this.players.forEach(player => {
                if (this.checkCollision(player, powerup) && !powerup.collected) {
                    this.collectPowerup(player, powerup);
                    powerup.collected = true;
                }
            });
        });
        this.powerups = this.powerups.filter(p => !p.collected);
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            p.alpha -= 0.02;
        });
        this.particles = this.particles.filter(p => p.life > 0 && p.alpha > 0);
        
        // Update explosions
        this.explosions.forEach(e => {
            e.scale += 0.1;
            e.alpha -= 0.05;
            e.life--;
        });
        this.explosions = this.explosions.filter(e => e.life > 0);
        
        // Update camera to follow player
        if (this.players.length > 0) {
            const mainPlayer = this.players[0];
            this.camera.x = mainPlayer.x - this.canvas.width / 3;
            if (this.camera.x < 0) this.camera.x = 0;
            if (this.camera.x > this.levelWidth - this.canvas.width) {
                this.camera.x = this.levelWidth - this.canvas.width;
            }
        }
        
        // Check level completion
        const aliveEnemies = this.enemies.filter(e => e.health > 0).length;
        if (aliveEnemies === 0) {
            this.nextLevel();
        }
        
        // Check game over
        const alivePlayers = this.players.filter(p => p.health > 0).length;
        if (alivePlayers === 0) {
            this.gameOver();
        }
        
        this.updateHUD();
    }
    
    updatePlayer(player, deltaTime) {
        const speed = 4;
        const jumpPower = -12;
        
        // Horizontal movement
        if (this.keys[player.controls.left]) {
            player.vx = -speed;
            player.facingRight = false;
        } else if (this.keys[player.controls.right]) {
            player.vx = speed;
            player.facingRight = true;
        } else {
            player.vx *= 0.8;
        }
        
        // Jump
        if (this.keys[player.controls.jump] && player.onGround && player.canJump) {
            player.vy = jumpPower;
            player.canJump = false;
        }
        
        if (!this.keys[player.controls.jump]) {
            player.canJump = true;
        }
        
        // Shoot
        if (player.shootCooldown > 0) {
            player.shootCooldown -= deltaTime;
        }
        
        if (this.keys[player.controls.shoot] && player.shootCooldown <= 0) {
            this.playerShoot(player);
        }
        
        // Switch weapon
        if (this.keys[player.controls.switchWeapon]) {
            const weapons = Object.keys(this.weaponTypes);
            const currentIndex = weapons.indexOf(player.weapon);
            player.weapon = weapons[(currentIndex + 1) % weapons.length];
            this.keys[player.controls.switchWeapon] = false;
        }
        
        // Physics
        player.vy += this.gravity;
        player.x += player.vx;
        player.y += player.vy;
        
        // Platform collision
        player.onGround = false;
        this.platforms.forEach(platform => {
            if (this.checkCollision(player, platform)) {
                if (player.vy > 0 && player.y + player.height - player.vy <= platform.y + 10) {
                    player.y = platform.y - player.height;
                    player.vy = 0;
                    player.onGround = true;
                } else if (player.vy < 0 && player.y - player.vy >= platform.y + platform.height - 10) {
                    player.y = platform.y + platform.height;
                    player.vy = 0;
                } else if (player.vx > 0) {
                    player.x = platform.x - player.width;
                    player.vx = 0;
                } else if (player.vx < 0) {
                    player.x = platform.x + platform.width;
                    player.vx = 0;
                }
            }
        });
        
        // Boundaries
        if (player.x < 0) player.x = 0;
        if (player.x > this.levelWidth - player.width) player.x = this.levelWidth - player.width;
        if (player.y > this.canvas.height) {
            this.damagePlayer(player, 50);
            player.y = 100;
            player.x = this.camera.x + 100;
        }
    }
    
    updateEnemy(enemy, deltaTime) {
        if (enemy.health <= 0) return;
        
        // AI behavior
        const nearestPlayer = this.players.reduce((nearest, player) => {
            if (player.health <= 0) return nearest;
            const dist = Math.abs(player.x - enemy.x);
            return (!nearest || dist < Math.abs(nearest.x - enemy.x)) ? player : nearest;
        }, null);
        
        if (!nearestPlayer) return;
        
        const distToPlayer = Math.abs(nearestPlayer.x - enemy.x);
        
        if (enemy.type === 'soldier' || enemy.type === 'tank') {
            if (distToPlayer < 400) {
                // Move towards player
                if (nearestPlayer.x < enemy.x) {
                    enemy.vx = -enemy.speed;
                    enemy.facingRight = false;
                } else {
                    enemy.vx = enemy.speed;
                    enemy.facingRight = true;
                }
                
                // Shoot
                if (enemy.shootCooldown <= 0 && distToPlayer < 300) {
                    this.enemyShoot(enemy, nearestPlayer);
                    enemy.shootCooldown = 1000 + Math.random() * 1000;
                }
            }
        } else if (enemy.type === 'flyer') {
            // Fly in sine wave
            enemy.vx = enemy.speed;
            enemy.y += Math.sin(Date.now() * 0.005) * 2;
            
            if (enemy.shootCooldown <= 0 && distToPlayer < 350) {
                this.enemyShoot(enemy, nearestPlayer);
                enemy.shootCooldown = 800;
            }
        } else if (enemy.type === 'turret') {
            // Stationary, just shoot
            if (enemy.shootCooldown <= 0 && distToPlayer < 400) {
                this.enemyShoot(enemy, nearestPlayer);
                enemy.shootCooldown = 1500;
            }
        } else if (enemy.type === 'boss') {
            // Boss behavior
            if (distToPlayer < 500) {
                if (nearestPlayer.x < enemy.x) {
                    enemy.vx = -enemy.speed;
                    enemy.facingRight = false;
                } else {
                    enemy.vx = enemy.speed;
                    enemy.facingRight = true;
                }
                
                // Multi-shot
                if (enemy.shootCooldown <= 0) {
                    for (let i = -2; i <= 2; i++) {
                        this.enemyShoot(enemy, nearestPlayer, i * 15);
                    }
                    enemy.shootCooldown = 2000;
                }
            }
        }
        
        enemy.x += enemy.vx;
        enemy.shootCooldown -= deltaTime;
        
        // Keep on platforms
        if (enemy.type !== 'flyer') {
            enemy.vy += this.gravity;
            enemy.y += enemy.vy;
            
            this.platforms.forEach(platform => {
                if (this.checkCollision(enemy, platform) && enemy.vy > 0) {
                    enemy.y = platform.y - enemy.height;
                    enemy.vy = 0;
                }
            });
        }
    }
    
    playerShoot(player) {
        const weapon = this.weaponTypes[player.weapon];
        player.shootCooldown = weapon.cooldown;
        
        const bulletCount = weapon.spread > 0 ? weapon.spread : 1;
        const angleStep = 15;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i - Math.floor(bulletCount / 2)) * angleStep;
            const radians = angle * Math.PI / 180;
            const direction = player.facingRight ? 1 : -1;
            
            let vx = weapon.speed * direction * Math.cos(radians);
            let vy = weapon.speed * Math.sin(radians);
            
            this.bullets.push({
                x: player.x + (player.facingRight ? player.width : 0),
                y: player.y + player.height / 2,
                vx: vx,
                vy: vy,
                width: 8,
                height: 4,
                damage: weapon.damage,
                color: '#ffff00',
                friendly: true,
                life: 100,
                active: true,
                weaponType: player.weapon
            });
        }
        
        this.createMuzzleFlash(
            player.x + (player.facingRight ? player.width : 0),
            player.y + player.height / 2
        );
    }
    
    enemyShoot(enemy, target, angleOffset = 0) {
        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x) + (angleOffset * Math.PI / 180);
        const speed = 8;
        
        this.bullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            width: 6,
            height: 6,
            damage: enemy.damage,
            color: '#ff0000',
            friendly: false,
            life: 100,
            active: true
        });
    }
    
    damageEnemy(enemy, damage) {
        enemy.health -= damage;
        
        if (enemy.health <= 0) {
            enemy.health = 0;
            this.score += enemy.score;
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            
            // Drop power-up chance
            if (Math.random() < 0.3) {
                this.spawnPowerup(enemy.x, enemy.y);
            }
        }
    }
    
    damagePlayer(player, damage) {
        player.health -= damage;
        if (player.health <= 0) {
            player.health = 0;
            this.lives--;
            
            if (this.lives > 0) {
                player.health = player.maxHealth;
                player.x = this.camera.x + 100;
                player.y = 100;
            }
        }
    }
    
    spawnPowerup(x, y) {
        const types = [
            { type: 'health', color: '#00ff00', effect: 'health' },
            { type: 'spread', color: '#ffff00', effect: 'weapon' },
            { type: 'laser', color: '#00ffff', effect: 'weapon' },
            { type: 'rocket', color: '#ff8800', effect: 'weapon' },
            { type: 'flame', color: '#ff0000', effect: 'weapon' }
        ];
        
        const powerup = types[Math.floor(Math.random() * types.length)];
        
        this.powerups.push({
            x: x,
            y: y,
            width: 25,
            height: 25,
            ...powerup,
            collected: false
        });
    }
    
    collectPowerup(player, powerup) {
        if (powerup.effect === 'health') {
            player.health = Math.min(player.health + 50, player.maxHealth);
        } else if (powerup.effect === 'weapon') {
            player.weapon = powerup.type;
        }
        
        this.score += 50;
        this.createParticles(powerup.x, powerup.y, 10, powerup.color);
    }
    
    createMuzzleFlash(x, y) {
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: 8,
            color: '#ffff00',
            life: 5,
            alpha: 1
        });
    }
    
    createHitEffect(x, y) {
        this.createParticles(x, y, 5, '#ffffff');
    }
    
    createExplosion(x, y) {
        this.explosions.push({
            x: x,
            y: y,
            scale: 0,
            alpha: 1,
            life: 20
        });
        this.createParticles(x, y, 30, '#ff4400');
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: color,
                life: 30,
                alpha: 1
            });
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    nextLevel() {
        this.level++;
        // Save player state before re-initializing the level
        const savedWeapons = this.players.map(p => p.weapon);
        const savedHealth = this.players.map(p => Math.min(p.health + 30, p.maxHealth));
        this.initLevel();
        // Restore player state
        this.players.forEach((p, i) => {
            if (savedWeapons[i]) p.weapon = savedWeapons[i];
            if (savedHealth[i] !== undefined) p.health = savedHealth[i];
        });
    }
    
    gameOver() {
        this.state = 'gameover';
        this.running = false;
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').innerHTML = 
            `<h3>Final Score: ${this.score}</h3><p>Level Reached: ${this.level}</p>`;
    }
    
    draw() {
        // Clear
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background elements
        this.ctx.save();
        this.ctx.translate(-this.camera.x * 0.5, 0);
        this.ctx.fillStyle = '#0f3460';
        for (let i = 0; i < 10; i++) {
            this.ctx.fillRect(i * 200, 400, 100, 200);
        }
        this.ctx.restore();
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw platforms
        this.platforms.forEach(platform => {
            if (platform.type === 'ground') {
                this.ctx.fillStyle = '#2d4a3e';
            } else if (platform.type === 'platform') {
                this.ctx.fillStyle = '#8b7355';
            } else {
                this.ctx.fillStyle = '#606060';
            }
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Outline
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Draw power-ups
        this.powerups.forEach(powerup => {
            this.ctx.fillStyle = powerup.color;
            this.ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(powerup.x, powerup.y, powerup.width, powerup.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(this.weaponTypes[powerup.type]?.icon || '❤️', 
                powerup.x + 2, powerup.y + 20);
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;

            // Health bar
            const healthPercent = enemy.health / enemy.maxHealth;
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
            this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
            this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 4);

            if (enemy.isBoss) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('BOSS', enemy.x + enemy.width / 2, enemy.y - 12);
                this.ctx.textAlign = 'left';
            }

            if (window.humanoidRenderer) {
                window.humanoidRenderer.draw(this.ctx,
                    enemy.x + enemy.width / 2, enemy.y + enemy.height, {
                    facing:    enemy.facingRight ? 1 : -1,
                    scale:     enemy.isBoss ? 0.58 : 0.45,
                    state:     'idle',
                    animTime:  Date.now(),
                    cloth:     enemy.color || '#c03030',
                    accent:    '#660000',
                    skin:      '#c89060',
                    hair:      '#1a1a1a',
                    boot:      '#1a1a1a',
                    muscular:  enemy.isBoss || false,
                    headStyle: 'helmet',
                    headColor: '#333',
                });
            } else {
                this.ctx.fillStyle = enemy.color;
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        });
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            if (bullet.weaponType === 'laser') {
                this.ctx.fillRect(bullet.x - 4, bullet.y - 1, 20, 2);
            } else if (bullet.weaponType === 'rocket') {
                this.ctx.fillRect(bullet.x, bullet.y - 3, 12, 6);
            } else {
                this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            }
        });
        
        // Draw players
        this.players.forEach(player => {
            if (player.health <= 0) return;
            
            // Shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(player.x + 5, player.y + player.height, player.width - 10, 4);

            // Health bar
            const healthPercent = player.health / player.maxHealth;
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(player.x, player.y - 10, player.width, 4);
            this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
            this.ctx.fillRect(player.x, player.y - 10, player.width * healthPercent, 4);

            if (window.humanoidRenderer) {
                window.humanoidRenderer.draw(this.ctx,
                    player.x + player.width / 2, player.y + player.height, {
                    facing:    player.facingRight ? 1 : -1,
                    scale:     0.48,
                    state:     !player.onGround ? 'jump' : (Math.abs(player.vx) > 0.5 ? 'walk' : 'idle'),
                    animTime:  Date.now(),
                    cloth:     player.color || '#3a7a3a',
                    accent:    '#c8a030',
                    skin:      '#e8c090',
                    hair:      '#1a1a1a',
                    boot:      '#2a2a1a',
                    muscular:  false,
                    headStyle: 'normal',
                    weapon:    'rifle',
                });
            } else {
                this.ctx.fillStyle = player.color;
                this.ctx.fillRect(player.x, player.y, player.width, player.height);
                this.ctx.fillStyle = '#888';
                if (player.facingRight) {
                    this.ctx.fillRect(player.x + player.width, player.y + player.height / 2, 15, 4);
                } else {
                    this.ctx.fillRect(player.x - 15, player.y + player.height / 2, 15, 4);
                }
            }
        });
        
        // Draw explosions
        this.explosions.forEach(explosion => {
            this.ctx.globalAlpha = explosion.alpha;
            this.ctx.fillStyle = '#ff4400';
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, 20 * explosion.scale, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, 10 * explosion.scale, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
            this.ctx.globalAlpha = 1;
        });
        
        this.ctx.restore();
        
        // Draw pause overlay
        if (this.state === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }

        // Draw Konami Code banner
        if (this.konamiBannerTimer > 0) {
            this.konamiBannerTimer--;
            const alpha = Math.min(1, this.konamiBannerTimer / 30);
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, this.canvas.height / 2 - 60, this.canvas.width, 120);
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('↑↑↓↓←→←→BA', this.canvas.width / 2, this.canvas.height / 2 - 15);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText('+30 LIVES!  CHEAT ACTIVATED 🎮', this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.globalAlpha = 1;
            this.ctx.textAlign = 'left';
        }
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
        
        if (this.players[0]) {
            document.getElementById('health').textContent = Math.floor(this.players[0].health);
            const weapon = this.weaponTypes[this.players[0].weapon];
            document.getElementById('weapon').textContent = weapon.icon;
            document.getElementById('weaponName').textContent = weapon.name;
        }
    }
    
    gameLoop(timestamp) {
        if (!this.running) return;
        const deltaTime = this.lastTime === 0 ? 16 : timestamp - this.lastTime; // 16 ms ≈ one frame at 60 fps
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.draw();
        
        this._rafId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
}

// Initialize
window.game = null;
window.addEventListener('load', () => {
    window.game = new ContraCommando();
});
