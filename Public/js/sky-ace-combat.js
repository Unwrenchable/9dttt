/**
 * Sky Ace Combat - Top Gun style flight combat game
 */
class SkyAceCombat {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.radarCanvas = document.getElementById('radar');
        if (!this.radarCanvas) {
            console.warn('[sky-ace-combat] Radar canvas not found; radar disabled.');
            this.radarCtx = null;
        } else {
            this.radarCtx = this.radarCanvas.getContext('2d');
        }
        
        this.state = 'menu';
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.missiles = [];
        this.explosions = [];
        this.clouds = [];
        
        this.score = 0;
        this.wave = 1;
        this.keys = {};
        
        this.setupInput();
        this.generateClouds();
        this.gameLoop();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.shoot();
            if (e.code === 'KeyM') this.fireMissile();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    start() {
        this.state = 'playing';
        document.getElementById('startScreen').style.display = 'none';
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            z: 1000,
            vx: 0,
            vy: 0,
            vz: 0,
            rotation: 0,
            pitch: 0,
            speed: 5,
            maxSpeed: 15,
            health: 100,
            ammo: 200,
            missiles: 10
        };
        
        this.spawnEnemies();
    }
    
    generateClouds() {
        for (let i = 0; i < 50; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width * 3 - this.canvas.width,
                y: Math.random() * this.canvas.height * 3 - this.canvas.height,
                z: Math.random() * 3000 + 500,
                size: Math.random() * 100 + 50,
                alpha: Math.random() * 0.3 + 0.1
            });
        }
    }
    
    spawnEnemies() {
        for (let i = 0; i < 5 + this.wave * 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 2000 + Math.random() * 1000;
            this.enemies.push({
                x: this.canvas.width / 2 + Math.cos(angle) * dist,
                y: this.canvas.height / 2 + Math.sin(angle) * dist,
                z: Math.random() * 1000 + 500,
                vx: 0,
                vy: 0,
                rotation: Math.random() * Math.PI * 2,
                health: 50,
                shootCooldown: 0,
                type: Math.random() < 0.7 ? 'fighter' : 'bomber'
            });
        }
    }
    
    shoot() {
        if (this.state !== 'playing' || this.player.ammo <= 0) return;
        this.player.ammo--;
        
        for (let i = 0; i < 2; i++) {
            this.bullets.push({
                x: this.player.x + (i === 0 ? -20 : 20),
                y: this.player.y,
                z: this.player.z,
                vx: Math.cos(this.player.rotation) * 20,
                vy: Math.sin(this.player.rotation) * 20,
                life: 60,
                damage: 10
            });
        }
    }
    
    fireMissile() {
        if (this.state !== 'playing' || this.player.missiles <= 0) return;
        
        const target = this.findNearestEnemy();
        if (!target) return;
        
        this.player.missiles--;
        this.missiles.push({
            x: this.player.x,
            y: this.player.y,
            z: this.player.z,
            vx: 0,
            vy: 0,
            target: target,
            speed: 10,
            life: 120,
            damage: 50
        });
    }
    
    findNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;
        
        this.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });
        
        return nearest;
    }
    
    update() {
        if (this.state !== 'playing') return;
        
        // Player controls
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.rotation -= 0.05;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.rotation += 0.05;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.speed = Math.min(this.player.speed + 0.3, this.player.maxSpeed);
            this.player.pitch = Math.max(this.player.pitch - 0.02, -0.3);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.speed = Math.max(this.player.speed - 0.2, 3);
            this.player.pitch = Math.min(this.player.pitch + 0.02, 0.3);
        }
        
        // Move player
        this.player.vx = Math.cos(this.player.rotation) * this.player.speed;
        this.player.vy = Math.sin(this.player.rotation) * this.player.speed;
        this.player.z += this.player.pitch * 10;
        
        if (this.player.z < 100) this.player.z = 100;
        if (this.player.z > 2000) this.player.z = 2000;
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;
            
            // AI: Chase player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 100) {
                enemy.rotation = Math.atan2(dy, dx);
                enemy.vx = Math.cos(enemy.rotation) * 3;
                enemy.vy = Math.sin(enemy.rotation) * 3;
                enemy.x += enemy.vx;
                enemy.y += enemy.vy;
            }
            
            // Shoot at player
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0 && dist < 800) {
                this.bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    z: enemy.z,
                    vx: Math.cos(enemy.rotation) * 8,
                    vy: Math.sin(enemy.rotation) * 8,
                    life: 60,
                    damage: 5,
                    enemy: true
                });
                enemy.shootCooldown = 30 + Math.random() * 30;
            }
        });
        
        // Update bullets
        this.bullets.forEach(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            // Check collisions
            if (bullet.enemy) {
                const dx = bullet.x - this.player.x;
                const dy = bullet.y - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 30) {
                    this.player.health -= bullet.damage;
                    bullet.life = 0;
                }
            } else {
                this.enemies.forEach(enemy => {
                    if (enemy.health <= 0) return;
                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 40) {
                        enemy.health -= bullet.damage;
                        bullet.life = 0;
                        if (enemy.health <= 0) {
                            this.score += enemy.type === 'bomber' ? 500 : 200;
                            this.createExplosion(enemy.x, enemy.y, enemy.z);
                        }
                    }
                });
            }
        });
        this.bullets = this.bullets.filter(b => b.life > 0);
        
        // Update missiles
        this.missiles.forEach(missile => {
            if (missile.target && missile.target.health > 0) {
                const dx = missile.target.x - missile.x;
                const dy = missile.target.y - missile.y;
                const angle = Math.atan2(dy, dx);
                missile.vx = Math.cos(angle) * missile.speed;
                missile.vy = Math.sin(angle) * missile.speed;
            }
            
            missile.x += missile.vx;
            missile.y += missile.vy;
            missile.life--;
            
            // Check hit
            if (missile.target && missile.target.health > 0) {
                const dx = missile.x - missile.target.x;
                const dy = missile.y - missile.target.y;
                if (Math.sqrt(dx * dx + dy * dy) < 50) {
                    missile.target.health -= missile.damage;
                    missile.life = 0;
                    if (missile.target.health <= 0) {
                        this.score += 1000;
                        this.createExplosion(missile.target.x, missile.target.y, missile.target.z);
                    }
                }
            }
        });
        this.missiles = this.missiles.filter(m => m.life > 0);
        
        // Update explosions
        this.explosions.forEach(e => {
            e.scale += 2;
            e.alpha -= 0.05;
        });
        this.explosions = this.explosions.filter(e => e.alpha > 0);
        
        // Check wave complete
        if (this.enemies.filter(e => e.health > 0).length === 0) {
            this.wave++;
            this.player.ammo += 50;
            this.player.missiles += 5;
            this.spawnEnemies();
        }
        
        // Check game over
        if (this.player.health <= 0) {
            this.state = 'gameover';
            this._showGameOver();
        }
        
        this.updateHUD();
    }
    
    createExplosion(x, y, z) {
        this.explosions.push({
            x, y, z,
            scale: 10,
            alpha: 1
        });
    }
    
    draw() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#001a4d');
        gradient.addColorStop(1, '#4d94ff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Don't draw game objects if game hasn't started
        if (!this.player) {
            this.drawRadar();
            return;
        }
        
        // Ground/horizon
        const horizonY = this.canvas.height / 2 + this.player.pitch * 200;
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, horizonY, this.canvas.width, this.canvas.height - horizonY);
        
        // Clouds
        this.clouds.forEach(cloud => {
            const relX = cloud.x - this.player.x;
            const relY = cloud.y - this.player.y;
            const scale = 1000 / cloud.z;
            const screenX = this.canvas.width / 2 + relX * scale;
            const screenY = this.canvas.height / 2 + relY * scale;
            
            this.ctx.globalAlpha = cloud.alpha;
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.ellipse(screenX, screenY, cloud.size * scale, cloud.size * scale * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
        
        // Enemies
        this.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;
            
            const relX = enemy.x - this.player.x;
            const relY = enemy.y - this.player.y;
            const scale = 1000 / enemy.z;
            const screenX = this.canvas.width / 2 + relX * scale;
            const screenY = this.canvas.height / 2 + relY * scale;
            
            this.ctx.save();
            this.ctx.translate(screenX, screenY);
            this.ctx.rotate(enemy.rotation);
            
            // Draw plane
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(-20 * scale, -3 * scale, 40 * scale, 6 * scale);
            this.ctx.fillRect(-3 * scale, -15 * scale, 6 * scale, 30 * scale);
            
            this.ctx.restore();
        });
        
        // Bullets
        this.bullets.forEach(bullet => {
            const relX = bullet.x - this.player.x;
            const relY = bullet.y - this.player.y;
            const scale = 1000 / bullet.z;
            const screenX = this.canvas.width / 2 + relX * scale;
            const screenY = this.canvas.height / 2 + relY * scale;
            
            this.ctx.fillStyle = bullet.enemy ? '#ff0000' : '#ffff00';
            this.ctx.fillRect(screenX - 2, screenY - 2, 4, 4);
        });
        
        // Missiles
        this.missiles.forEach(missile => {
            const relX = missile.x - this.player.x;
            const relY = missile.y - this.player.y;
            const scale = 1000 / missile.z;
            const screenX = this.canvas.width / 2 + relX * scale;
            const screenY = this.canvas.height / 2 + relY * scale;
            
            this.ctx.fillStyle = '#ff8800';
            this.ctx.fillRect(screenX - 3, screenY - 3, 6, 6);
            
            // Trail
            this.ctx.fillStyle = 'rgba(255, 136, 0, 0.5)';
            this.ctx.fillRect(screenX - 10, screenY - 1, 10, 2);
        });
        
        // Explosions
        this.explosions.forEach(e => {
            const relX = e.x - this.player.x;
            const relY = e.y - this.player.y;
            const scale = 1000 / e.z;
            const screenX = this.canvas.width / 2 + relX * scale;
            const screenY = this.canvas.height / 2 + relY * scale;
            
            this.ctx.globalAlpha = e.alpha;
            this.ctx.fillStyle = '#ff4400';
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, e.scale * scale, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, e.scale * scale * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
        
        this.drawRadar();
    }
    
    drawRadar() {
        if (!this.radarCtx) return;
        const radar = this.radarCanvas;
        this.radarCtx.fillRect(0, 0, radar.width, radar.height);
        
        // Grid
        this.radarCtx.strokeStyle = '#0f0';
        this.radarCtx.lineWidth = 1;
        this.radarCtx.beginPath();
        this.radarCtx.moveTo(radar.width / 2, 0);
        this.radarCtx.lineTo(radar.width / 2, radar.height);
        this.radarCtx.moveTo(0, radar.height / 2);
        this.radarCtx.lineTo(radar.width, radar.height / 2);
        this.radarCtx.stroke();
        
        // Player (center)
        this.radarCtx.fillStyle = '#0f0';
        this.radarCtx.fillRect(radar.width / 2 - 3, radar.height / 2 - 3, 6, 6);
        
        // Enemies
        if (this.player) {
            this.enemies.forEach(enemy => {
                if (enemy.health <= 0) return;
                const dx = (enemy.x - this.player.x) / 20;
                const dy = (enemy.y - this.player.y) / 20;
                const radarX = radar.width / 2 + dx;
                const radarY = radar.height / 2 + dy;
                
                if (radarX > 0 && radarX < radar.width && radarY > 0 && radarY < radar.height) {
                    this.radarCtx.fillStyle = '#ff0000';
                    this.radarCtx.beginPath();
                    this.radarCtx.arc(radarX, radarY, 3, 0, Math.PI * 2);
                    this.radarCtx.fill();
                }
            });
        }
    }
    
    updateHUD() {
        if (!this.player) return;
        document.getElementById('altitude').textContent = Math.floor(this.player.z);
        document.getElementById('speed').textContent = Math.floor(this.player.speed * 50);
        document.getElementById('ammo').textContent = this.player.ammo;
        document.getElementById('missiles').textContent = this.player.missiles;
        document.getElementById('score').textContent = this.score;
        document.getElementById('enemies').textContent = this.enemies.filter(e => e.health > 0).length;
    }
    
    gameLoop() {
        if (this.state === 'gameover') return;
        this.update();
        this.draw();
        this._rafId = requestAnimationFrame(() => this.gameLoop());
    }

    _showGameOver() {
        const existing = document.getElementById('gameOverOverlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'gameOverOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;font-family:"Press Start 2P",cursive;color:#FFD700;text-align:center;';
        overlay.innerHTML = `<div style="font-size:28px;margin-bottom:16px;">✈ SHOT DOWN ✈</div>
            <div style="font-size:16px;margin-bottom:8px;">Final Score: ${this.score}</div>
            <div style="font-size:12px;color:#aaa;margin-bottom:28px;">Wave ${this.wave}</div>
            <button style="padding:14px 28px;font-size:12px;font-family:inherit;background:#1e3a8a;color:#FFD700;border:2px solid #FFD700;border-radius:8px;cursor:pointer;"
                onclick="document.getElementById('gameOverOverlay').remove();location.reload();">
                FLY AGAIN
            </button>`;
        document.body.appendChild(overlay);
    }
}

window.game = null;
window.addEventListener('load', () => {
    window.game = new SkyAceCombat();
});
