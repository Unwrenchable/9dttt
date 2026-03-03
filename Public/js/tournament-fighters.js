/**
 * Tournament Fighters - Street Fighter style fighting game with tournament mode
 */
class TournamentFighters {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1000;
        this.canvas.height = 560;

        // Professional character renderer
        this.charRenderer = window.CharacterRenderer ? new window.CharacterRenderer() : null;
        this.frameCount = 0;
        
        this.fighters = [
            { id: 'ryu',     name: 'RYU',      speed: 5, power: 8,  special: 'Hadouken',           origin: 'Japan' },
            { id: 'chun',    name: 'CHUN-LI',  speed: 9, power: 6,  special: 'Lightning Kick',     origin: 'China' },
            { id: 'zangief', name: 'ZANGIEF',  speed: 3, power: 10, special: 'Spinning Piledriver', origin: 'Russia' },
            { id: 'guile',   name: 'GUILE',    speed: 6, power: 7,  special: 'Sonic Boom',         origin: 'USA' },
            { id: 'blanka',  name: 'BLANKA',   speed: 8, power: 7,  special: 'Electric Thunder',   origin: 'Brazil' },
            { id: 'dhalsim', name: 'DHALSIM',  speed: 4, power: 6,  special: 'Yoga Fire',          origin: 'India' },
            { id: 'ken',     name: 'KEN',      speed: 7, power: 8,  special: 'Shoryuken',          origin: 'USA' },
            { id: 'sagat',   name: 'SAGAT',    speed: 5, power: 9,  special: 'Tiger Uppercut',     origin: 'Thailand' }
        ];
        
        this.state = 'menu';
        this.mode = null;
        this.selectedFighters = [null, null];
        this.players = [];
        this.projectiles = [];
        this.particles = [];
        this.keys = {};
        
        this.round = 1;
        this.timer = 99;
        this.wins = [0, 0];
        this.tournamentRound = 0;
        this.tournamentOpponents = [];
        
        this.setupInput();
        this.renderFighterSelect();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    renderFighterSelect() {
        const container = document.getElementById('fighterSelect');
        container.innerHTML = this.fighters.map((f, i) => `
            <div class="fighter-card" onclick="game.selectFighter(${i})" data-fighter-id="${f.id}">
                <canvas class="fighter-portrait" width="90" height="90" style="display:block;margin:0 auto;"></canvas>
                <div style="margin-top: 8px; font-size: 11px; letter-spacing: 1px;">${f.name}</div>
                <div style="font-size: 8px; margin-top: 4px; color: #aaa;">${f.origin || ''}</div>
                <div style="font-size: 8px; margin-top: 4px;">
                    <span style="color:#4ef;">SPD ${f.speed}</span> &nbsp; <span style="color:#f84;">PWR ${f.power}</span>
                </div>
                <div style="font-size: 7px; margin-top: 3px; color: #ff0;">${f.special}</div>
            </div>
        `).join('');

        // Draw portraits using CharacterRenderer
        if (this.charRenderer) {
            document.querySelectorAll('.fighter-portrait').forEach((canvas, i) => {
                const f = this.fighters[i];
                const ctx = canvas.getContext('2d');
                // Dark gradient background
                const bg = ctx.createRadialGradient(45, 45, 5, 45, 45, 55);
                bg.addColorStop(0, '#1a2040');
                bg.addColorStop(1, '#080c1a');
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, 90, 90);
                // Draw portrait centred
                this.charRenderer.drawPortrait(ctx, f.id, 45, 55, 90);
            });
        }
    }
    
    selectFighter(index) {
        if (this.selectedFighters[0] === null) {
            this.selectedFighters[0] = this.fighters[index];
            document.querySelectorAll('.fighter-card')[index].classList.add('selected-p1');
        } else if (this.selectedFighters[1] === null && index !== this.fighters.indexOf(this.selectedFighters[0])) {
            this.selectedFighters[1] = this.fighters[index];
            document.querySelectorAll('.fighter-card')[index].classList.add('selected-p2');
        }
    }
    
    startTournament() {
        if (!this.selectedFighters[0]) {
            alert('Select your fighter!');
            return;
        }
        
        this.mode = 'tournament';
        this.tournamentRound = 0;
        this.wins = [0, 0];
        
        // Create tournament bracket (7 opponents)
        this.tournamentOpponents = this.fighters
            .filter(f => f.id !== this.selectedFighters[0].id)
            .sort(() => Math.random() - 0.5);
        
        this.selectedFighters[1] = this.tournamentOpponents[0];
        this.startFight();
    }
    
    startVersus() {
        if (!this.selectedFighters[0] || !this.selectedFighters[1]) {
            alert('Both players must select a fighter!');
            return;
        }
        
        this.mode = 'versus';
        this.wins = [0, 0];
        this.startFight();
    }
    
    startFight() {
        this.state = 'fighting';
        document.getElementById('menu').classList.add('hidden');
        
        this.round = 1;
        this.timer = 99;
        this.frameCount = 0;
        
        this.players = [
            {
                ...this.selectedFighters[0],
                x: 200,
                y: 410,
                vx: 0,
                vy: 0,
                width: 50,
                height: 80,
                health: 100,
                maxHealth: 100,
                facingRight: true,
                onGround: true,
                blocking: false,
                attacking: false,
                attackCooldown: 0,
                specialCharge: 0,
                invincible: 0,
                combo: 0,
                animState: 'idle',
                animFrame: 0,
                controls: {
                    left: 'KeyA',
                    right: 'KeyD',
                    jump: 'KeyW',
                    crouch: 'KeyS',
                    punch: 'KeyJ',
                    kick: 'KeyK',
                    block: 'KeyL',
                    special: 'KeyI'
                }
            },
            {
                ...this.selectedFighters[1],
                x: 750,
                y: 410,
                vx: 0,
                vy: 0,
                width: 50,
                height: 80,
                health: 100,
                maxHealth: 100,
                facingRight: false,
                onGround: true,
                blocking: false,
                attacking: false,
                attackCooldown: 0,
                specialCharge: 0,
                invincible: 0,
                combo: 0,
                animState: 'idle',
                animFrame: 0,
                controls: this.mode === 'tournament' ? null : {
                    left: 'ArrowLeft',
                    right: 'ArrowRight',
                    jump: 'ArrowUp',
                    crouch: 'ArrowDown',
                    punch: 'Numpad4',
                    kick: 'Numpad5',
                    block: 'Numpad6',
                    special: 'Numpad8'
                }
            }
        ];
        
        this.announceRound();
        this.gameLoop();
    }
    
    announceRound() {
        const display = document.getElementById('roundDisplay');
        display.textContent = `ROUND ${this.round}`;
        display.classList.add('show');
        setTimeout(() => {
            display.classList.remove('show');
        }, 2000);
    }
    
    update() {
        if (this.state !== 'fighting') return;
        
        // Timer
        if (this.timer > 0 && Date.now() % 1000 < 20) {
            this.timer -= 0.016;
            document.getElementById('timer').textContent = Math.ceil(this.timer);
        }
        
        if (this.timer <= 0) {
            this.endRound('time');
        }
        
        // Update players
        this.players.forEach((player, index) => {
            this.updatePlayer(player, index);
        });
        
        // Check collisions
        if (this.players[0].attacking && !this.players[1].blocking && 
            !this.players[1].invincible && this.checkCollision(this.players[0], this.players[1])) {
            this.hitPlayer(1, this.players[0].power);
            this.players[0].combo++;
        }
        
        if (this.players[1].attacking && !this.players[0].blocking && 
            !this.players[0].invincible && this.checkCollision(this.players[1], this.players[0])) {
            this.hitPlayer(0, this.players[1].power);
            this.players[1].combo++;
        }
        
        // Update projectiles
        this.projectiles.forEach(proj => {
            proj.x += proj.vx;
            
            const target = this.players[proj.opponent];
            if (!target.blocking && this.checkCollision(proj, target)) {
                this.hitPlayer(proj.opponent, proj.damage);
                proj.active = false;
            }
        });
        this.projectiles = this.projectiles.filter(p => p.active && p.x > 0 && p.x < this.canvas.width);
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);
        
        // Check round end
        if (this.players[0].health <= 0) {
            this.endRound(1);
        } else if (this.players[1].health <= 0) {
            this.endRound(0);
        }
        
        this.updateHUD();
    }
    
    updatePlayer(player, index) {
        const opponent = this.players[1 - index];
        
        // AI for tournament mode
        if (this.mode === 'tournament' && index === 1) {
            this.aiControl(player, opponent);
        } else if (player.controls) {
            this.playerControl(player);
        }
        
        // Physics
        if (!player.onGround) {
            player.vy += 0.8;
        }
        
        player.x += player.vx;
        player.y += player.vy;
        
        // Ground collision
        if (player.y >= 410) {
            player.y = 410;
            player.vy = 0;
            player.onGround = true;
        }
        
        // Boundaries
        if (player.x < 0) player.x = 0;
        if (player.x > this.canvas.width - player.width) {
            player.x = this.canvas.width - player.width;
        }
        
        // Face opponent
        player.facingRight = opponent.x > player.x;
        
        // Cooldowns
        if (player.attackCooldown > 0) {
            player.attackCooldown -= 16;
            if (player.attackCooldown <= 0) {
                player.attacking = false;
            }
        }
        
        if (player.invincible > 0) {
            player.invincible -= 16;
        }
        
        player.vx *= 0.8;

        // Update animation state
        if (player.invincible > 200) {
            player.animState = 'hurt';
        } else if (!player.onGround) {
            player.animState = 'jump';
        } else if (player.blocking) {
            player.animState = 'block';
        } else if (player.attacking) {
            player.animState = 'attack';
        } else {
            player.animState = 'idle';
        }
        player.animFrame = (player.animFrame || 0) + 1;
    }
    
    playerControl(player) {
        const speed = player.speed;
        
        if (this.keys[player.controls.left]) {
            player.vx = -speed;
        }
        if (this.keys[player.controls.right]) {
            player.vx = speed;
        }
        if (this.keys[player.controls.jump] && player.onGround) {
            player.vy = -15;
            player.onGround = false;
        }
        if (this.keys[player.controls.block]) {
            player.blocking = true;
            player.vx = 0;
        } else {
            player.blocking = false;
        }
        if (this.keys[player.controls.punch] && player.attackCooldown <= 0) {
            this.attack(player, 'punch');
        }
        if (this.keys[player.controls.kick] && player.attackCooldown <= 0) {
            this.attack(player, 'kick');
        }
        if (this.keys[player.controls.special] && player.specialCharge >= 50) {
            this.special(player);
        }
    }
    
    aiControl(player, opponent) {
        const dist = Math.abs(player.x - opponent.x);
        
        // Move towards opponent
        if (dist > 100) {
            player.vx = opponent.x > player.x ? player.speed : -player.speed;
        } else if (dist < 50) {
            player.vx = opponent.x > player.x ? -player.speed : player.speed;
        }
        
        // Attack
        if (dist < 80 && player.attackCooldown <= 0 && Math.random() < 0.05) {
            this.attack(player, Math.random() < 0.5 ? 'punch' : 'kick');
        }
        
        // Special
        if (player.specialCharge >= 50 && dist < 200 && Math.random() < 0.02) {
            this.special(player);
        }
        
        // Jump
        if (Math.random() < 0.01 && player.onGround) {
            player.vy = -15;
            player.onGround = false;
        }
        
        // Block
        player.blocking = opponent.attacking && dist < 100 && Math.random() < 0.3;
    }
    
    attack(player, type) {
        player.attacking = true;
        player.attackCooldown = type === 'punch' ? 300 : 400;
        player.specialCharge = Math.min(player.specialCharge + 5, 100);
        
        this.createParticles(
            player.x + (player.facingRight ? player.width : 0),
            player.y + player.height / 2,
            5,
            '#fff'
        );
    }
    
    special(player) {
        player.specialCharge = 0;
        
        // Create projectile
        this.projectiles.push({
            x: player.x + (player.facingRight ? player.width : 0),
            y: player.y + player.height / 2,
            vx: (player.facingRight ? 1 : -1) * 10,
            width: 30,
            height: 20,
            damage: player.power * 2,
            opponent: this.players.indexOf(player) === 0 ? 1 : 0,
            active: true
        });
        
        this.createParticles(player.x, player.y, 20, '#ff0');
    }
    
    hitPlayer(index, damage) {
        const player = this.players[index];
        player.health -= damage;
        player.invincible = 500;
        player.combo = 0;
        
        this.createParticles(player.x, player.y, 10, '#f00');
        
        // Knockback
        player.vx = (player.facingRight ? 1 : -1) * 5;
    }
    
    endRound(winner) {
        if (winner === 'time') {
            // Winner is player with more health
            winner = this.players[0].health > this.players[1].health ? 0 : 1;
        }
        
        this.wins[winner]++;
        
        if (this.wins[winner] >= 2) {
            // Match won
            if (this.mode === 'tournament') {
                if (winner === 0) {
                    this.tournamentRound++;
                    if (this.tournamentRound >= this.tournamentOpponents.length) {
                        alert('TOURNAMENT CHAMPION! 🏆');
                        location.reload();
                    } else {
                        // Next opponent
                        this.selectedFighters[1] = this.tournamentOpponents[this.tournamentRound];
                        this.wins = [0, 0];
                        this.startFight();
                    }
                } else {
                    alert('TOURNAMENT OVER! Try again!');
                    location.reload();
                }
            } else {
                alert(`PLAYER ${winner + 1} WINS!`);
                location.reload();
            }
        } else {
            // Next round
            this.round++;
            this.timer = 99;
            this.players[0].health = this.players[0].maxHealth;
            this.players[1].health = this.players[1].maxHealth;
            this.players[0].x = 200;
            this.players[1].x = 750;
            this.players[0].y = 410;
            this.players[1].y = 410;
            this.announceRound();
        }
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color,
                alpha: 1
            });
        }
    }
    
    checkCollision(a, b) {
        const aRange = {
            x: a.x + (a.facingRight ? a.width : -30),
            y: a.y,
            width: 30,
            height: a.height
        };
        
        return aRange.x < b.x + b.width &&
               aRange.x + aRange.width > b.x &&
               aRange.y < b.y + b.height &&
               aRange.y + aRange.height > b.y;
    }
    
    draw() {
        const ctx = this.ctx;
        this.frameCount++;

        // === BACKGROUND — dramatic arena ===
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGrad.addColorStop(0, '#0a0820');
        skyGrad.addColorStop(0.5, '#1a1040');
        skyGrad.addColorStop(1, '#0d0820');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Background crowd silhouettes
        ctx.fillStyle = 'rgba(80, 40, 120, 0.35)';
        for (let i = 0; i < 30; i++) {
            const cx = i * 35 + 15;
            const cy = 440 + Math.sin(i * 1.7 + this.frameCount * 0.03) * 3;
            const headR = 8 + (i % 3) * 2;
            ctx.beginPath();
            ctx.arc(cx, cy - headR, headR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(cx - headR * 0.6, cy - headR * 0.2, headR * 1.2, 30);
        }

        // Arena floor with perspective lines
        ctx.fillStyle = '#1a1230';
        ctx.fillRect(0, 490, this.canvas.width, 110);

        // Floor reflection lines
        ctx.strokeStyle = 'rgba(180, 100, 255, 0.18)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 70, 490);
            ctx.lineTo(i * 70 + 30, 600);
            ctx.stroke();
        }

        // Glowing floor edge
        const floorGlow = ctx.createLinearGradient(0, 488, 0, 498);
        floorGlow.addColorStop(0, 'rgba(180, 100, 255, 0.6)');
        floorGlow.addColorStop(1, 'rgba(80, 40, 180, 0)');
        ctx.fillStyle = floorGlow;
        ctx.fillRect(0, 488, this.canvas.width, 10);

        // Neon border lights
        ctx.strokeStyle = 'rgba(200, 80, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);

        // === PROJECTILES — energy orbs ===
        this.projectiles.forEach(proj => {
            const orbGrad = ctx.createRadialGradient(proj.x + 15, proj.y + 10, 2, proj.x + 15, proj.y + 10, 18);
            orbGrad.addColorStop(0, '#fff');
            orbGrad.addColorStop(0.3, '#80ffff');
            orbGrad.addColorStop(1, 'rgba(0, 200, 255, 0)');
            ctx.fillStyle = orbGrad;
            ctx.beginPath();
            ctx.arc(proj.x + 15, proj.y + 10, 18, 0, Math.PI * 2);
            ctx.fill();
            // Core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(proj.x + 15, proj.y + 10, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // === PARTICLES ===
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // === FIGHTERS ===
        this.players.forEach(player => {
            // Flicker on invincibility
            if (player.invincible > 0 && Math.floor(player.invincible / 80) % 2 === 0) return;

            // Ground shadow
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(
                player.x + player.width / 2, player.y + player.height + 5,
                player.width * 0.55, 8, 0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();

            // Blocking shield effect
            if (player.blocking) {
                ctx.save();
                ctx.globalAlpha = 0.4;
                const shieldGrad = ctx.createRadialGradient(
                    player.x + player.width / 2, player.y + player.height / 2, 5,
                    player.x + player.width / 2, player.y + player.height / 2, 55
                );
                shieldGrad.addColorStop(0, 'rgba(0, 200, 255, 0.6)');
                shieldGrad.addColorStop(1, 'rgba(0, 100, 255, 0)');
                ctx.fillStyle = shieldGrad;
                ctx.beginPath();
                ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 55, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // === Draw character with CharacterRenderer ===
            if (this.charRenderer) {
                this.charRenderer.drawFighter(
                    ctx,
                    player.id,
                    player.x + player.width / 2,   // feet centre X
                    player.y + player.height,        // feet Y
                    {
                        facing: player.facingRight ? 'right' : 'left',
                        animState: player.animState || 'idle',
                        frame: player.animFrame || 0,
                        scale: 1.2
                    }
                );
            } else {
                // Fallback coloured rectangle
                ctx.fillStyle = '#4a90e2';
                ctx.fillRect(player.x, player.y, player.width, player.height);
            }

            // Attack flash
            if (player.attacking) {
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = '#ffdd00';
                const hx = player.x + (player.facingRight ? player.width : -36);
                ctx.beginPath();
                ctx.ellipse(hx + 18, player.y + 30, 24, 20, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Special charge pip bar above fighter
            if (player.specialCharge > 0) {
                const bw = 46, bh = 5;
                const bx = player.x + (player.width - bw) / 2;
                const by = player.y - 22;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
                const chargeGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
                chargeGrad.addColorStop(0, '#ff8c00');
                chargeGrad.addColorStop(1, '#ffee00');
                ctx.fillStyle = chargeGrad;
                ctx.fillRect(bx, by, bw * (player.specialCharge / 100), bh);
            }
        });
    }
    
    updateHUD() {
        document.getElementById('p1Name').textContent = this.players[0].name;
        document.getElementById('p2Name').textContent = this.players[1].name;
        
        const p1hp = Math.max(0, (this.players[0].health / this.players[0].maxHealth) * 100);
        const p2hp = Math.max(0, (this.players[1].health / this.players[1].maxHealth) * 100);
        
        document.getElementById('p1Health').style.width = p1hp + '%';
        document.getElementById('p2Health').style.width = p2hp + '%';

        // Win dots
        for (let p = 0; p < 2; p++) {
            for (let w = 0; w < 2; w++) {
                const dot = document.getElementById(`p${p + 1}w${w}`);
                if (dot) dot.className = 'win-dot' + (this.wins[p] > w ? ' filled' : '');
            }
        }

        // Timer colour
        const timerEl = document.getElementById('timer');
        timerEl.textContent = Math.ceil(this.timer);
        timerEl.className = 'timer' + (this.timer <= 10 ? ' urgent' : '');
    }
    
    gameLoop() {
        if (this.state !== 'fighting') return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.game = null;
window.addEventListener('load', () => {
    window.game = new TournamentFighters();
});
