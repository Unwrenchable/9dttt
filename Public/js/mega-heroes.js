/**
 * Mega Heroes - Mega Man style platformer with boss battles
 */
class MegaHeroes {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.keys = {};
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.platforms = [];
        this.pickups = [];
        this.particles = [];
        
        this.stage = 1;
        this.score = 0;
        this.lives = 3;
        this.currentBoss = null;
        this.camera = { x: 0, y: 0 };
        this.levelWidth = 3000;
        
        this.weapons = {
            buster: { name: 'BUSTER', damage: 10, cooldown: 200, color: '#0ff', speed: 12 },
            laser: { name: 'LASER', damage: 15, cooldown: 150, color: '#f00', speed: 15 },
            spread: { name: 'SPREAD', damage: 8, cooldown: 250, color: '#ff0', speed: 10 },
            wave: { name: 'WAVE', damage: 12, cooldown: 300, color: '#0f0', speed: 8 }
        };

        this.state = 'playing';
        
        this.setupInput();
        this.init();
        this.gameLoop();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space' && this.player) this.jump();
            if (e.code === 'KeyJ' || e.code === 'KeyZ') this.shoot();
            if (e.code === 'KeyK' || e.code === 'KeyX') this.switchWeapon();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    init() {
        this.player = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            width: 32,
            height: 48,
            health: 28,
            maxHealth: 28,
            onGround: false,
            canJump: true,
            facingRight: true,
            weapon: 'buster',
            shootCooldown: 0,
            invincible: 0
        };
        
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
        
        // Platforms
        const platformPatterns = [
            { x: 200, y: 450, width: 150, height: 20 },
            { x: 400, y: 350, width: 100, height: 20 },
            { x: 600, y: 300, width: 120, height: 20 },
            { x: 800, y: 400, width: 100, height: 20 },
            { x: 1000, y: 250, width: 150, height: 20 },
            { x: 1200, y: 450, width: 100, height: 20 },
            { x: 1500, y: 350, width: 180, height: 20 },
            { x: 1800, y: 280, width: 100, height: 20 },
            { x: 2100, y: 400, width: 150, height: 20 },
            { x: 2400, y: 300, width: 200, height: 20 }
        ];
        
        platformPatterns.forEach(p => {
            this.platforms.push({ ...p, type: 'platform' });
        });
        
        // Boss room at end
        this.platforms.push({
            x: this.levelWidth - 600,
            y: 400,
            width: 600,
            height: 200,
            type: 'boss_floor'
        });
    }
    
    spawnEnemies() {
        const enemyTypes = [
            { type: 'walker', health: 20, speed: 1, damage: 5, score: 100 },
            { type: 'flyer', health: 15, speed: 2, damage: 3, score: 150 },
            { type: 'turret', health: 30, speed: 0, damage: 8, score: 200 },
            { type: 'jumper', health: 25, speed: 1.5, damage: 6, score: 180 }
        ];
        
        for (let i = 0; i < 40; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            this.enemies.push({
                x: 500 + i * 60 + Math.random() * 40,
                y: type.type === 'flyer' ? 200 + Math.random() * 200 : 500,
                vx: type.speed * (Math.random() < 0.5 ? 1 : -1),
                vy: 0,
                width: 30,
                height: 30,
                shootCooldown: 0,
                ...type
            });
        }
        
        // Spawn boss at end
        this.spawnBoss();
    }
    
    spawnBoss() {
        this.currentBoss = {
            x: this.levelWidth - 400,
            y: 300,
            vx: 2,
            vy: 0,
            width: 80,
            height: 100,
            health: 200,
            maxHealth: 200,
            pattern: 0,
            patternTimer: 0,
            shootCooldown: 0,
            phase: 1
        };
    }
    
    jump() {
        if (this.player.onGround && this.player.canJump) {
            this.player.vy = -15;
            this.player.canJump = false;
        }
    }
    
    shoot() {
        if (this.player.shootCooldown > 0) return;
        
        const weapon = this.weapons[this.player.weapon];
        this.player.shootCooldown = weapon.cooldown;
        
        const dir = this.player.facingRight ? 1 : -1;
        const startX = this.player.x + (this.player.facingRight ? this.player.width : 0);
        
        if (weapon.name === 'SPREAD') {
            for (let i = -1; i <= 1; i++) {
                this.projectiles.push({
                    x: startX,
                    y: this.player.y + this.player.height / 2,
                    vx: dir * weapon.speed,
                    vy: i * 3,
                    width: 12,
                    height: 12,
                    damage: weapon.damage,
                    color: weapon.color,
                    friendly: true,
                    life: 100
                });
            }
        } else {
            this.projectiles.push({
                x: startX,
                y: this.player.y + this.player.height / 2,
                vx: dir * weapon.speed,
                vy: 0,
                width: 16,
                height: 8,
                damage: weapon.damage,
                color: weapon.color,
                friendly: true,
                life: 100
            });
        }
    }
    
    switchWeapon() {
        const weapons = Object.keys(this.weapons);
        const currentIndex = weapons.indexOf(this.player.weapon);
        this.player.weapon = weapons[(currentIndex + 1) % weapons.length];
    }
    
    update() {
        // Player movement
        const speed = 5;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.vx = -speed;
            this.player.facingRight = false;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.vx = speed;
            this.player.facingRight = true;
        } else {
            this.player.vx *= 0.8;
        }
        
        // Gravity
        this.player.vy += 0.8;
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Platform collision
        this.player.onGround = false;
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                if (this.player.vy > 0) {
                    this.player.y = platform.y - this.player.height;
                    this.player.vy = 0;
                    this.player.onGround = true;
                    this.player.canJump = true;
                }
            }
        });
        
        // Cooldowns
        if (this.player.shootCooldown > 0) this.player.shootCooldown -= 16;
        if (this.player.invincible > 0) this.player.invincible -= 16;
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;
            
            if (enemy.type === 'walker' || enemy.type === 'jumper') {
                enemy.x += enemy.vx;
                
                // Turn around at edges
                const onPlatform = this.platforms.find(p => 
                    this.checkCollision(enemy, p) && enemy.vy >= 0
                );
                if (!onPlatform || enemy.x < 0 || enemy.x > this.levelWidth) {
                    enemy.vx *= -1;
                }
                
                if (enemy.type === 'jumper' && Math.random() < 0.02) {
                    enemy.vy = -10;
                }
                
                enemy.vy += 0.8;
                enemy.y += enemy.vy;
            } else if (enemy.type === 'flyer') {
                enemy.x += enemy.vx;
                enemy.y += Math.sin(Date.now() * 0.005) * 2;
                
                if (Math.abs(enemy.x - this.player.x) < 300) {
                    enemy.vx = enemy.x < this.player.x ? enemy.speed : -enemy.speed;
                }
            }
            
            // Enemy shoot
            if (enemy.shootCooldown <= 0 && Math.abs(enemy.x - this.player.x) < 400) {
                this.enemyShoot(enemy);
                enemy.shootCooldown = 1000 + Math.random() * 1000;
            }
            enemy.shootCooldown -= 16;
            
            // Collision with player
            if (this.player.invincible <= 0 && this.checkCollision(this.player, enemy)) {
                this.damagePlayer(enemy.damage);
            }
        });
        
        // Update boss
        if (this.currentBoss && this.currentBoss.health > 0) {
            this.updateBoss();
            
            // Show boss bar when near
            if (Math.abs(this.player.x - this.currentBoss.x) < 800) {
                document.getElementById('bossBar').classList.add('active');
                document.getElementById('bossName').textContent = 'STAGE ' + this.stage + ' BOSS';
                const healthPercent = (this.currentBoss.health / this.currentBoss.maxHealth) * 100;
                document.getElementById('bossHealthFill').style.width = healthPercent + '%';
            }
        } else {
            document.getElementById('bossBar').classList.remove('active');
        }
        
        // Update projectiles
        this.projectiles.forEach(proj => {
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.life--;
            
            if (proj.friendly) {
                // Hit enemies
                this.enemies.forEach(enemy => {
                    if (enemy.health > 0 && this.checkCollision(proj, enemy)) {
                        enemy.health -= proj.damage;
                        proj.life = 0;
                        this.createParticles(proj.x, proj.y, 5, proj.color);
                        if (enemy.health <= 0) {
                            this.score += enemy.score;
                            this.createExplosion(enemy.x, enemy.y);
                        }
                    }
                });
                
                // Hit boss
                if (this.currentBoss && this.currentBoss.health > 0 && 
                    this.checkCollision(proj, this.currentBoss)) {
                    this.currentBoss.health -= proj.damage;
                    proj.life = 0;
                    this.createParticles(proj.x, proj.y, 5, proj.color);
                    
                    if (this.currentBoss.health <= 0) {
                        this.score += 5000;
                        this.createExplosion(this.currentBoss.x, this.currentBoss.y);
                        // Next stage or victory
                        setTimeout(() => {
                            this.stage++;
                            this.init();
                        }, 2000);
                    }
                }
            } else {
                // Hit player
                if (this.player.invincible <= 0 && this.checkCollision(proj, this.player)) {
                    this.damagePlayer(5);
                    proj.life = 0;
                }
            }
        });
        this.projectiles = this.projectiles.filter(p => p.life > 0);
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3;
            p.alpha -= 0.02;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);
        
        // Camera follow player
        this.camera.x = this.player.x - this.canvas.width / 3;
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.camera.x > this.levelWidth - this.canvas.width) {
            this.camera.x = this.levelWidth - this.canvas.width;
        }
        
        // Boundaries
        if (this.player.y > this.canvas.height) {
            this.damagePlayer(10);
            this.player.x = this.camera.x + 100;
            this.player.y = 100;
        }
        
        this.updateHUD();
    }
    
    updateBoss() {
        const boss = this.currentBoss;
        boss.patternTimer++;
        
        // Movement
        boss.x += boss.vx;
        if (boss.x < this.levelWidth - 500 || boss.x > this.levelWidth - 200) {
            boss.vx *= -1;
        }
        
        // Attack patterns
        if (boss.patternTimer > 60) {
            boss.patternTimer = 0;
            boss.pattern = (boss.pattern + 1) % 3;
        }
        
        if (boss.shootCooldown <= 0) {
            switch (boss.pattern) {
                case 0: // Triple shot
                    for (let i = -1; i <= 1; i++) {
                        this.projectiles.push({
                            x: boss.x + boss.width / 2,
                            y: boss.y + boss.height / 2,
                            vx: -8,
                            vy: i * 3,
                            width: 12,
                            height: 12,
                            color: '#f0f',
                            friendly: false,
                            life: 100
                        });
                    }
                    break;
                case 1: // Aimed shot
                    const angle = Math.atan2(
                        this.player.y - boss.y,
                        this.player.x - boss.x
                    );
                    this.projectiles.push({
                        x: boss.x + boss.width / 2,
                        y: boss.y + boss.height / 2,
                        vx: Math.cos(angle) * 10,
                        vy: Math.sin(angle) * 10,
                        width: 16,
                        height: 16,
                        color: '#ff0',
                        friendly: false,
                        life: 100
                    });
                    break;
                case 2: // Spread
                    for (let i = 0; i < 5; i++) {
                        const ang = (i - 2) * 0.3;
                        this.projectiles.push({
                            x: boss.x + boss.width / 2,
                            y: boss.y + boss.height / 2,
                            vx: Math.cos(ang - Math.PI) * 6,
                            vy: Math.sin(ang) * 6,
                            width: 10,
                            height: 10,
                            color: '#0ff',
                            friendly: false,
                            life: 100
                        });
                    }
                    break;
            }
            boss.shootCooldown = 800;
        }
        boss.shootCooldown -= 16;
    }
    
    enemyShoot(enemy) {
        const angle = Math.atan2(
            this.player.y - enemy.y,
            this.player.x - enemy.x
        );
        
        this.projectiles.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            width: 8,
            height: 8,
            color: '#f00',
            friendly: false,
            life: 100
        });
    }
    
    damagePlayer(damage) {
        this.player.health -= damage;
        this.player.invincible = 1000;
        
        if (this.player.health <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.player.health = this.player.maxHealth;
                this.player.x = 100;
                this.player.y = 100;
            } else {
                this.state = 'gameover';
                this._showGameOver();
            }
        }
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                color,
                alpha: 1
            });
        }
    }
    
    createExplosion(x, y) {
        this.createParticles(x, y, 20, '#ff8800');
    }
    
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    draw() {
        // Sky
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Platforms
        this.platforms.forEach(p => {
            this.ctx.fillStyle = p.type === 'ground' ? '#2d4' : '#666';
            this.ctx.fillRect(p.x, p.y, p.width, p.height);
        });
        
        // Enemies
        this.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;
            if (window.humanoidRenderer) {
                window.humanoidRenderer.draw(this.ctx,
                    enemy.x + enemy.width / 2, enemy.y + enemy.height, {
                    facing:    enemy.vx >= 0 ? 1 : -1,
                    scale:     0.38,
                    state:     'walk',
                    animTime:  Date.now(),
                    cloth:     '#c03030',
                    accent:    '#ff4400',
                    skin:      '#c88060',
                    hair:      '#111',
                    boot:      '#111',
                    headStyle: 'helmet',
                    headColor: '#333',
                });
            } else {
                this.ctx.fillStyle = '#f44';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        });
        
        // Boss
        if (this.currentBoss && this.currentBoss.health > 0) {
            if (window.humanoidRenderer) {
                window.humanoidRenderer.draw(this.ctx,
                    this.currentBoss.x + this.currentBoss.width / 2,
                    this.currentBoss.y + this.currentBoss.height, {
                    facing:    1,
                    scale:     0.75,
                    state:     'attack',
                    animTime:  Date.now(),
                    cloth:     '#8800aa',
                    accent:    '#ff00ff',
                    skin:      '#c08060',
                    hair:      '#220022',
                    boot:      '#110011',
                    muscular:  true,
                    headStyle: 'helmet',
                    headColor: '#550066',
                });
            } else {
                this.ctx.fillStyle = '#f0f';
                this.ctx.fillRect(this.currentBoss.x, this.currentBoss.y,
                    this.currentBoss.width, this.currentBoss.height);
            }
        }
        
        // Projectiles
        this.projectiles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.width, p.height);
        });
        
        // Particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;
        
        // Player
        if (this.player.invincible % 200 < 100) {
            if (window.humanoidRenderer) {
                window.humanoidRenderer.draw(this.ctx,
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height, {
                    facing:    this.player.facingRight ? 1 : -1,
                    scale:     0.42,
                    state:     !this.player.onGround ? 'jump' : (Math.abs(this.player.vx || 0) > 0.5 ? 'walk' : 'idle'),
                    animTime:  Date.now(),
                    cloth:     '#0080c0',
                    accent:    '#f0c040',
                    skin:      '#e8c090',
                    hair:      '#1a1a1a',
                    boot:      '#1a2a50',
                    weapon:    'gun',
                });
            } else {
                this.ctx.fillStyle = '#0ff';
                this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
        
        this.ctx.restore();
    }
    
    updateHUD() {
        document.getElementById('stage').textContent = this.stage;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('health').textContent = this.player.health;
        document.getElementById('weapon').textContent = this.weapons[this.player.weapon].name;
        document.getElementById('score').textContent = this.score;
    }
    
    gameLoop() {
        if (this.state === 'gameover') return;
        this.update();
        this.draw();
        this._rafId = requestAnimationFrame(() => this.gameLoop());
    }

    _showGameOver() {
        const existing = document.getElementById('megaHeroesGameOver');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'megaHeroesGameOver';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;font-family:"Press Start 2P",cursive;color:#FFD700;text-align:center;';
        overlay.innerHTML = `<div style="font-size:28px;margin-bottom:16px;">GAME OVER</div>
            <div style="font-size:16px;margin-bottom:28px;">Score: ${this.score}</div>
            <button style="padding:14px 28px;font-size:12px;font-family:inherit;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;"
                onclick="document.getElementById('megaHeroesGameOver').remove();location.reload();">
                PLAY AGAIN
            </button>`;
        document.body.appendChild(overlay);
    }
}

window.addEventListener('load', () => {
    new MegaHeroes();
});
