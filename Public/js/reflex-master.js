/**
 * Reflex Master - Motor Skills and Reaction Time Training
 */
class ReflexMaster {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.mode = null;
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.reactionTimes = [];
        this.combo = 0;
        this.targets = [];
        this.particles = [];
        this.gameActive = false;
        this._rafId = null;
        this._clickHandler = (e) => this.handleClick(e);
    }
    
    start(mode) {
        this.mode = mode;
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.reactionTimes = [];
        this.combo = 0;
        this.gameActive = true;
        
        const titles = {
            'reaction': '🎯 Reaction Time Test',
            'tracking': '👁️ Eye Tracking Challenge',
            'precision': '🎪 Precision Challenge',
            'rhythm': '🎵 Rhythm Master',
            'whackamole': '🔨 Whack-a-Mole'
        };
        
        document.getElementById('gameTitle').textContent = titles[mode];
        
        this.setupGame();
        this.canvas.removeEventListener('click', this._clickHandler);
        this.canvas.addEventListener('click', this._clickHandler);
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
        this.gameLoop();
    }
    
    setupGame() {
        switch(this.mode) {
            case 'reaction':
                this.spawnReactionTarget();
                break;
            case 'tracking':
                this.spawnTrackingTargets();
                break;
            case 'precision':
                this.spawnPrecisionTargets();
                break;
            case 'rhythm':
                this.startRhythmGame();
                break;
            case 'whackamole':
                this.startWhackAMole();
                break;
        }
    }
    
    spawnReactionTarget() {
        setTimeout(() => {
            if (!this.gameActive) return;
            
            const size = 50 + Math.random() * 50;
            this.targets = [{
                x: Math.random() * (this.canvas.width - size),
                y: Math.random() * (this.canvas.height - size),
                size: size,
                color: `hsl(${Math.random() * 360}, 80%, 50%)`,
                spawnTime: Date.now(),
                type: 'reaction'
            }];
        }, 500 + Math.random() * 2000);
    }
    
    spawnTrackingTargets() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (!this.gameActive) return;
                
                const angle = Math.random() * Math.PI * 2;
                this.targets.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: Math.cos(angle) * (2 + Math.random() * 3),
                    vy: Math.sin(angle) * (2 + Math.random() * 3),
                    size: 40,
                    color: '#ff6b6b',
                    spawnTime: Date.now(),
                    type: 'tracking'
                });
            }, i * 1000);
        }
    }
    
    spawnPrecisionTargets() {
        for (let i = 0; i < 10; i++) {
            this.targets.push({
                x: Math.random() * (this.canvas.width - 20),
                y: Math.random() * (this.canvas.height - 20),
                size: 10 + Math.random() * 15,
                color: '#4ecdc4',
                spawnTime: Date.now(),
                type: 'precision',
                hitArea: 5
            });
        }
    }
    
    startRhythmGame() {
        const beats = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
        beats.forEach(time => {
            setTimeout(() => {
                if (!this.gameActive) return;
                
                this.targets.push({
                    x: this.canvas.width / 2 - 50,
                    y: this.canvas.height / 2 - 50,
                    size: 100,
                    color: '#ffe66d',
                    spawnTime: Date.now(),
                    type: 'rhythm',
                    lifetime: 500,
                    perfect: 200
                });
            }, time);
        });
    }
    
    startWhackAMole() {
        const spawnMole = () => {
            if (!this.gameActive || this.targets.length >= 20) return;
            
            const gridSize = 3;
            const cellWidth = this.canvas.width / gridSize;
            const cellHeight = this.canvas.height / gridSize;
            
            const col = Math.floor(Math.random() * gridSize);
            const row = Math.floor(Math.random() * gridSize);
            
            this.targets.push({
                x: col * cellWidth + cellWidth / 2 - 40,
                y: row * cellHeight + cellHeight / 2 - 40,
                size: 80,
                color: '#a55',
                spawnTime: Date.now(),
                type: 'mole',
                lifetime: 1500
            });
            
            setTimeout(spawnMole, 300 + Math.random() * 700);
        };
        
        spawnMole();
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        let hit = false;
        
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            const dx = clickX - (target.x + target.size / 2);
            const dy = clickY - (target.y + target.size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < target.size / 2) {
                hit = true;
                const reactionTime = Date.now() - target.spawnTime;
                this.reactionTimes.push(reactionTime);
                this.hits++;
                this.combo++;
                
                const points = Math.max(100 - reactionTime / 10, 10) * this.combo;
                this.score += Math.floor(points);
                
                this.createHitEffect(clickX, clickY, target.color);
                this.targets.splice(i, 1);
                
                // Spawn next target for certain modes
                if (this.mode === 'reaction') {
                    this.spawnReactionTarget();
                }
                
                break;
            }
        }
        
        if (!hit) {
            this.misses++;
            this.combo = 0;
            this.createMissEffect(clickX, clickY);
        }
        
        this.updateStats();
    }
    
    createHitEffect(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: color,
                life: 30 + Math.random() * 30,
                alpha: 1
            });
        }
    }
    
    createMissEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 2,
                color: '#999',
                life: 20,
                alpha: 1
            });
        }
    }
    
    updateStats() {
        document.getElementById('score').textContent = this.score;
        
        const total = this.hits + this.misses;
        const accuracy = total > 0 ? (this.hits / total * 100).toFixed(1) : 0;
        document.getElementById('accuracy').textContent = accuracy + '%';
        
        const avgTime = this.reactionTimes.length > 0
            ? Math.floor(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
            : 0;
        document.getElementById('avgTime').textContent = avgTime + 'ms';
        
        document.getElementById('combo').textContent = this.combo;
    }
    
    update() {
        // Update tracking targets
        this.targets.forEach((target, index) => {
            if (target.type === 'tracking') {
                target.x += target.vx;
                target.y += target.vy;
                
                // Bounce off walls
                if (target.x < 0 || target.x + target.size > this.canvas.width) {
                    target.vx *= -1;
                }
                if (target.y < 0 || target.y + target.size > this.canvas.height) {
                    target.vy *= -1;
                }
            }
            
            // Remove expired targets
            if (target.lifetime) {
                const age = Date.now() - target.spawnTime;
                if (age > target.lifetime) {
                    this.targets.splice(index, 1);
                    if (target.type !== 'rhythm') {
                        this.misses++;
                        this.combo = 0;
                    }
                }
            }
        });
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            p.alpha = p.life / 30;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }
    
    draw() {
        // Clear
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid for whack-a-mole
        if (this.mode === 'whackamole') {
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            const gridSize = 3;
            const cellWidth = this.canvas.width / gridSize;
            const cellHeight = this.canvas.height / gridSize;
            
            for (let i = 0; i <= gridSize; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(i * cellWidth, 0);
                this.ctx.lineTo(i * cellWidth, this.canvas.height);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(0, i * cellHeight);
                this.ctx.lineTo(this.canvas.width, i * cellHeight);
                this.ctx.stroke();
            }
        }
        
        // Draw targets
        this.targets.forEach(target => {
            // Pulse effect for rhythm game
            let size = target.size;
            if (target.type === 'rhythm') {
                const age = Date.now() - target.spawnTime;
                const pulse = Math.sin(age * 0.01) * 10;
                size += pulse;
            }
            
            this.ctx.fillStyle = target.color;
            this.ctx.beginPath();
            this.ctx.arc(
                target.x + target.size / 2,
                target.y + target.size / 2,
                size / 2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Draw outline
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Draw countdown for timed targets
            if (target.lifetime) {
                const remaining = target.lifetime - (Date.now() - target.spawnTime);
                const percent = remaining / target.lifetime;
                
                this.ctx.strokeStyle = percent > 0.5 ? '#0f0' : percent > 0.25 ? '#ff0' : '#f00';
                this.ctx.lineWidth = 5;
                this.ctx.beginPath();
                this.ctx.arc(
                    target.x + target.size / 2,
                    target.y + target.size / 2,
                    size / 2 + 10,
                    -Math.PI / 2,
                    -Math.PI / 2 + (Math.PI * 2 * percent)
                );
                this.ctx.stroke();
            }
        });
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;
        
        // Draw combo multiplier
        if (this.combo > 1) {
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`x${this.combo}`, this.canvas.width / 2, 60);
        }
    }
    
    gameLoop() {
        if (!this.gameActive) return;
        
        this.update();
        this.draw();
        
        this._rafId = requestAnimationFrame(() => this.gameLoop());
    }
}

let game = new ReflexMaster();

function startGame(mode) {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    game.start(mode);
}
