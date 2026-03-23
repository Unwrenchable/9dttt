/**
 * Brain Academy - Educational Games Collection
 */
class BrainAcademy {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentGame = null;
        this.score = 0;
        this.level = 1;
        this.gameState = 'menu';
    }
    
    // Math Blaster Game
    mathBlaster() {
        const problems = [];
        let asteroids = [];
        let player = { x: 400, y: 450, width: 40, height: 40 };
        let score = 0;
        let lives = 3;
        
        const generateProblem = () => {
            const ops = ['+', '-', '×', '÷'];
            const op = ops[Math.floor(Math.random() * ops.length)];
            let a = Math.floor(Math.random() * 12) + 1;
            let b = Math.floor(Math.random() * 12) + 1;
            let answer;
            
            switch(op) {
                case '+': answer = a + b; break;
                case '-': 
                    if (a < b) [a, b] = [b, a];
                    answer = a - b;
                    break;
                case '×': answer = a * b; break;
                case '÷':
                    answer = a;
                    a = a * b;
                    break;
            }
            
            return {
                question: `${a} ${op} ${b}`,
                answer: answer,
                x: Math.random() * 700 + 50,
                y: -50,
                vy: 1 + Math.random(),
                width: 80,
                height: 40
            };
        };
        
        // Spawn asteroids with problems
        this._spawnInterval = setInterval(() => {
            if (asteroids.length < 5) {
                asteroids.push(generateProblem());
            }
        }, 2000);
        
        const gameLoop = () => {
            if (lives <= 0) {
                clearInterval(this._spawnInterval);
                this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 36px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
                this.ctx.font = '22px sans-serif';
                this.ctx.fillText(`Final Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
                this.ctx.textAlign = 'left';
                setTimeout(() => backToMenu(), 2500);
                return;
            }
            
            // Clear
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw stars
            for (let i = 0; i < 50; i++) {
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(
                    (i * 157) % this.canvas.width,
                    (i * 251) % this.canvas.height,
                    2, 2
                );
            }
            
            // Update and draw asteroids
            asteroids.forEach((asteroid, index) => {
                asteroid.y += asteroid.vy;
                
                // Draw asteroid
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(asteroid.question, asteroid.x + asteroid.width / 2, asteroid.y + 25);
                
                // Check if hit ground
                if (asteroid.y > this.canvas.height) {
                    asteroids.splice(index, 1);
                    lives--;
                }
            });
            
            // Draw player ship
            this.ctx.fillStyle = '#0ff';
            this.ctx.beginPath();
            this.ctx.moveTo(player.x + player.width / 2, player.y);
            this.ctx.lineTo(player.x, player.y + player.height);
            this.ctx.lineTo(player.x + player.width, player.y + player.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw UI
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(`Score: ${score}`, 20, 30);
            this.ctx.fillText(`Lives: ${'❤️'.repeat(lives)}`, 20, 60);
            
            academy._rafId = requestAnimationFrame(gameLoop);
        };
        
        // Input for answers
        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = 'Enter answer and press Enter';
        input.style.cssText = 'padding: 10px; font-size: 18px; width: 300px; margin: 20px;';
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const answer = parseInt(input.value);
                const correctAsteroid = asteroids.find(a => a.answer === answer);
                
                if (correctAsteroid) {
                    score += 10;
                    asteroids = asteroids.filter(a => a !== correctAsteroid);
                }
                
                input.value = '';
            }
        });
        
        document.getElementById('gameControls').innerHTML = '';
        document.getElementById('gameControls').appendChild(input);
        input.focus();
        
        gameLoop();
    }
    
    // Typing Master Game
    typingMaster() {
        const words = [
            'javascript', 'programming', 'computer', 'keyboard', 'function',
            'variable', 'algorithm', 'database', 'network', 'security',
            'development', 'interface', 'application', 'software', 'hardware'
        ];
        
        let fallingWords = [];
        let score = 0;
        let lives = 5;
        let currentInput = '';
        
        const spawnWord = () => {
            if (fallingWords.length < 4) {
                fallingWords.push({
                    text: words[Math.floor(Math.random() * words.length)],
                    x: Math.random() * 700 + 50,
                    y: -20,
                    vy: 0.5 + score * 0.01,
                    typed: ''
                });
            }
        };
        
        this._wordInterval = setInterval(spawnWord, 2000);
        
        // Remove any previous typing listener before adding a new one
        if (this._handleTyping) {
            document.removeEventListener('keydown', this._handleTyping);
            this._handleTyping = null;
        }
        
        const gameLoop = () => {
            if (lives <= 0) {
                clearInterval(this._wordInterval);
                const wpm = Math.floor(score * 1.5);
                this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 36px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
                this.ctx.font = '22px sans-serif';
                this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
                this.ctx.fillText(`Est. WPM: ${wpm}`, this.canvas.width / 2, this.canvas.height / 2 + 44);
                this.ctx.textAlign = 'left';
                setTimeout(() => backToMenu(), 2500);
                return;
            }
            
            // Clear
            this.ctx.fillStyle = '#2d3561';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update and draw words
            fallingWords.forEach((word, index) => {
                word.y += word.vy;
                
                // Draw word
                this.ctx.font = '24px monospace';
                
                // Color typed part green
                this.ctx.fillStyle = '#0f0';
                this.ctx.fillText(word.typed, word.x, word.y);
                
                // Color remaining part white
                const typedWidth = this.ctx.measureText(word.typed).width;
                this.ctx.fillStyle = '#fff';
                this.ctx.fillText(
                    word.text.substring(word.typed.length),
                    word.x + typedWidth,
                    word.y
                );
                
                // Check if reached bottom
                if (word.y > this.canvas.height) {
                    fallingWords.splice(index, 1);
                    lives--;
                }
            });
            
            // Draw current input
            this.ctx.fillStyle = '#ff0';
            this.ctx.font = 'bold 32px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(currentInput, this.canvas.width / 2, this.canvas.height - 30);
            
            // Draw UI
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${score}`, 20, 30);
            this.ctx.fillText(`Lives: ${lives}`, 20, 60);
            this.ctx.fillText(`WPM: ${Math.floor(score * 1.5)}`, 20, 90);
            
            academy._rafId = requestAnimationFrame(gameLoop);
        };
        
        // Keyboard input – stored on `this` so backToMenu() can remove it
        this._handleTyping = (e) => {
            if (e.key === 'Backspace') {
                currentInput = currentInput.slice(0, -1);
            } else if (e.key.length === 1 && /[a-z]/.test(e.key)) {
                currentInput += e.key.toLowerCase();
                
                // Check if any word matches
                fallingWords.forEach((word, index) => {
                    if (word.text.startsWith(currentInput)) {
                        word.typed = currentInput;
                        
                        if (currentInput === word.text) {
                            score += word.text.length;
                            fallingWords.splice(index, 1);
                            currentInput = '';
                        }
                    }
                });
            }
        };
        document.addEventListener('keydown', this._handleTyping);
        
        document.getElementById('gameControls').innerHTML = '<p style="text-align: center; font-size: 18px;">Type the falling words!</p>';
        
        gameLoop();
    }
    
    // Memory Match Game
    memoryMatch() {
        const symbols = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🥝', '🍑'];
        let cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
        let flipped = [];
        let matched = [];
        let moves = 0;
        
        const cardWidth = 80;
        const cardHeight = 100;
        const padding = 10;
        const startX = 50;
        const startY = 50;
        
        const draw = () => {
            this.ctx.fillStyle = '#16213e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            cards.forEach((symbol, index) => {
                const col = index % 4;
                const row = Math.floor(index / 4);
                const x = startX + col * (cardWidth + padding);
                const y = startY + row * (cardHeight + padding);
                
                // Card back or front
                if (flipped.includes(index) || matched.includes(index)) {
                    this.ctx.fillStyle = matched.includes(index) ? '#0f0' : '#fff';
                    this.ctx.fillRect(x, y, cardWidth, cardHeight);
                    this.ctx.font = '48px Arial';
                    this.ctx.fillText(symbol, x + 15, y + 65);
                } else {
                    this.ctx.fillStyle = '#4a69bd';
                    this.ctx.fillRect(x, y, cardWidth, cardHeight);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '24px Arial';
                    this.ctx.fillText('?', x + 30, y + 60);
                }
            });
            
            // Draw UI
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Moves: ${moves}`, 500, 40);
            this.ctx.fillText(`Matched: ${matched.length / 2} / ${symbols.length}`, 500, 70);
            
            if (matched.length === cards.length) {
                this.ctx.fillStyle = '#ff0';
                this.ctx.font = 'bold 48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2);
                this.ctx.fillText(`${moves} Moves`, this.canvas.width / 2, this.canvas.height / 2 + 60);
            }
        };
        
        this.canvas.addEventListener('click', handleClick);
        
        function handleClick(e) {
            if (flipped.length >= 2) return;
            
            const rect = this.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Find clicked card
            cards.forEach((symbol, index) => {
                const col = index % 4;
                const row = Math.floor(index / 4);
                const x = startX + col * (cardWidth + padding);
                const y = startY + row * (cardHeight + padding);
                
                if (clickX >= x && clickX <= x + cardWidth &&
                    clickY >= y && clickY <= y + cardHeight &&
                    !flipped.includes(index) && !matched.includes(index)) {
                    
                    flipped.push(index);
                    
                    if (flipped.length === 2) {
                        moves++;
                        setTimeout(() => {
                            if (cards[flipped[0]] === cards[flipped[1]]) {
                                matched.push(...flipped);
                            }
                            flipped = [];
                            draw();
                        }, 1000);
                    }
                    
                    draw();
                }
            });
        }
        
        document.getElementById('gameControls').innerHTML = '<p style="text-align: center; font-size: 18px;">Click cards to match pairs!</p>';
        
        const animate = () => {
            draw();
            if (matched.length < cards.length) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
}

let academy = new BrainAcademy();

function loadGame(gameType) {
    document.getElementById('gamesMenu').style.display = 'none';
    document.getElementById('gameArea').classList.add('active');
    
    const titles = {
        'math-blaster': '🔢 Math Blaster',
        'typing-master': '⌨️ Typing Master',
        'memory-match': '🧩 Memory Match',
        'word-wizard': '📝 Word Wizard',
        'geography-quest': '🌍 Geography Quest',
        'pattern-master': '🎨 Pattern Master'
    };
    
    document.getElementById('gameTitle').textContent = titles[gameType] || 'Game';
    
    switch(gameType) {
        case 'math-blaster':
            academy.mathBlaster();
            break;
        case 'typing-master':
            academy.typingMaster();
            break;
        case 'memory-match':
            academy.memoryMatch();
            break;
        default: {
            // Show a brief "coming soon" toast instead of a silent log
            const toast = document.createElement('div');
            toast.textContent = 'Coming soon! 🚀';
            toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#FFD700;font-family:"Press Start 2P",cursive;font-size:14px;padding:20px 32px;border-radius:10px;z-index:9999;pointer-events:none;';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
            backToMenu();
        }
    }
}

function backToMenu() {
    // Clean up RAF loop and intervals from any running mini-game
    if (academy && academy._rafId) { cancelAnimationFrame(academy._rafId); academy._rafId = null; }
    if (academy && academy._spawnInterval) { clearInterval(academy._spawnInterval); academy._spawnInterval = null; }
    if (academy && academy._wordInterval) { clearInterval(academy._wordInterval); academy._wordInterval = null; }
    // Clean up the Typing Master keydown listener if it is still attached
    if (academy && academy._handleTyping) {
        document.removeEventListener('keydown', academy._handleTyping);
        academy._handleTyping = null;
    }
    document.getElementById('gamesMenu').style.removeProperty('display');
    const gameArea = document.getElementById('gameArea');
    if (gameArea) gameArea.classList.remove('active');
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
