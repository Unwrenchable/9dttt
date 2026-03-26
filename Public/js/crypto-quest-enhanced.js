/**
 * CRYPTO QUEST ACADEMY - Full Interactive Edition
 * Real gameplay, not text screens!
 */

class CryptoQuestGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = 1;
        this.scene = 'menu';
        this.coins = 0;
        this.knowledge = 0;
        this.achievements = [];
        this.completedLevels = [];
        
        // Game state
        this.userId = localStorage.getItem('userId') || `user_${Date.now()}`;
        this.mining = { active: false, hashrate: 0, blocks: 0, clicks: 0 };
        this.blockchain = [];
        this.wallet = { address: '', privateKey: '', balance: 1000, tokens: {} };
        this.trading = { prices: {}, portfolio: {}, history: [] };
        this.nfts = [];
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        this._inputSetup = false;
        this.setupInputHandlers();
        
        // RAF tracking (cancellable loop)
        this._rafId = null;
        this._stopped = false;
        
        // Load progress
        this.loadProgress();
        
        // Start game loop
        this.lastTime = Date.now();
        this.gameLoop();
    }
    
    setupInputHandlers() {
        if (this._inputSetup) return;
        this._inputSetup = true;
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') this.scene = 'menu';
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.clicked = true;
            this.handleClick(this.mouse.x, this.mouse.y);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
    }
    
    // ==================== GAME LOOP ====================
    
    gameLoop() {
        // Stop the loop when explicitly halted
        if (this._stopped) {
            this._rafId = null;
            return;
        }

        const now = Date.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
        
        this.update(deltaTime);
        this.render();
        
        this._rafId = requestAnimationFrame(() => this.gameLoop());
    }
    
    stop() {
        this._stopped = true;
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }
    
    update(dt) {
        // Update mining if active
        if (this.mining.active) {
            this.mining.blocks += this.mining.hashrate * dt;
        }
        
        // Update trading prices
        this.updateTradingPrices(dt);
        
        // Reset click state
        this.mouse.clicked = false;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render current scene
        switch(this.scene) {
            case 'menu':
                this.renderMenu();
                break;
            case 'level_select':
                this.renderLevelSelect();
                break;
            case 'mining':
                this.renderMiningGame();
                break;
            case 'blockchain_builder':
                this.renderBlockchainBuilder();
                break;
            case 'wallet_creator':
                this.renderWalletCreator();
                break;
            case 'trading_sim':
                this.renderTradingSim();
                break;
            case 'scam_detector':
                this.renderScamDetector();
                break;
            case 'nft_studio':
                this.renderNFTStudio();
                break;
            case 'defi_farm':
                this.renderDeFiFarm();
                break;
            case 'dao_builder':
                this.renderDAOBuilder();
                break;
            default:
                this.renderMenu();
        }
        
        // UI Overlay
        this.renderUI();
    }
    
    // ==================== MENU ====================
    
    renderMenu() {
        // Title
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CRYPTO QUEST ACADEMY', this.canvas.width / 2, 100);
        
        // Subtitle
        this.ctx.fillStyle = '#64b5f6';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Learn Blockchain & Web3 Through Gaming', this.canvas.width / 2, 150);
        
        // Stats
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Level: ${this.currentLevel} | Coins: ${this.coins} | Knowledge: ${this.knowledge}%`, 
            this.canvas.width / 2, 200);
        
        // Main buttons
        const buttons = [
            { text: 'Start Adventure', action: 'level_select', y: 280 },
            { text: 'Continue Learning', action: 'level_select', y: 340 },
            { text: 'View Achievements', action: 'achievements', y: 400 },
            { text: 'Settings', action: 'settings', y: 460 }
        ];
        
        buttons.forEach(btn => {
            this.drawButton(this.canvas.width / 2 - 150, btn.y, 300, 50, btn.text, '#2196f3');
        });
        
        // Instructions
        this.ctx.fillStyle = '#888';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Click any button to start your crypto education journey!', 
            this.canvas.width / 2, this.canvas.height - 40);
    }
    
    // ==================== LEVEL SELECT ====================
    
    renderLevelSelect() {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Choose Your Quest', this.canvas.width / 2, 50);
        
        const levels = [
            { id: 1, name: 'Bitcoin Mining', type: 'mining', unlocked: true },
            { id: 2, name: 'Build a Blockchain', type: 'blockchain_builder', unlocked: this.currentLevel >= 1 },
            { id: 3, name: 'Create Your Wallet', type: 'wallet_creator', unlocked: this.currentLevel >= 2 },
            { id: 4, name: 'Trading Academy', type: 'trading_sim', unlocked: this.currentLevel >= 3 },
            { id: 5, name: 'Scam Detector', type: 'scam_detector', unlocked: this.currentLevel >= 4 },
            { id: 6, name: 'NFT Art Studio', type: 'nft_studio', unlocked: this.currentLevel >= 5 },
            { id: 7, name: 'DeFi Farming', type: 'defi_farm', unlocked: this.currentLevel >= 6 },
            { id: 8, name: 'Build a DAO', type: 'dao_builder', unlocked: this.currentLevel >= 7 }
        ];
        
        const cols = 3;
        const startX = 100;
        const startY = 100;
        const cardWidth = 350;
        const cardHeight = 120;
        const gap = 20;
        
        levels.forEach((level, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardWidth + gap);
            const y = startY + row * (cardHeight + gap);
            
            const color = level.unlocked ? '#2196f3' : '#555';
            const textColor = level.unlocked ? '#fff' : '#888';
            
            // Card background
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, cardWidth, cardHeight);
            
            // Level number
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Level ${level.id}`, x + 15, y + 35);
            
            // Level name
            this.ctx.fillStyle = textColor;
            this.ctx.font = '20px Arial';
            this.ctx.fillText(level.name, x + 15, y + 65);
            
            // Status
            const completed = this.completedLevels.includes(level.id);
            this.ctx.font = '16px Arial';
            this.ctx.fillText(completed ? '✓ Completed' : level.unlocked ? 'Click to Play' : '🔒 Locked', 
                x + 15, y + 95);
        });
        
        // Back button
        this.drawButton(50, this.canvas.height - 70, 150, 50, 'Back', '#f44336');
    }
    
    // ==================== LEVEL 1: MINING CLICKER ====================
    
    renderMiningGame() {
        // Title
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⛏️ BITCOIN MINING SIMULATOR', this.canvas.width / 2, 40);
        
        // Mining stats
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Hash Rate: ${this.mining.hashrate.toFixed(1)} H/s`, this.canvas.width / 2, 80);
        this.ctx.fillText(`Blocks Mined: ${Math.floor(this.mining.blocks)} / 100`, this.canvas.width / 2, 110);
        this.ctx.fillText(`Total Clicks: ${this.mining.clicks}`, this.canvas.width / 2, 140);
        
        // Progress bar
        const barWidth = 600;
        const barHeight = 30;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = 160;
        const progress = Math.min(this.mining.blocks / 100, 1);
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        this.ctx.fillStyle = '#4caf50';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Big mining button
        const btnSize = 200;
        const btnX = (this.canvas.width - btnSize) /2;
        const btnY = 250;
        
        // Glow effect
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, btnY + btnSize / 2, btnSize / 4,
            this.canvas.width / 2, btnY + btnSize / 2, btnSize / 2
        );
        gradient.addColorStop(0, '#ff9800');
        gradient.addColorStop(1, '#ff5722');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, btnY + btnSize / 2, btnSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Mining icon
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 80px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⛏️', this.canvas.width / 2, btnY + btnSize / 2 + 25);
        
        // Click instruction
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('CLICK TO MINE!', this.canvas.width / 2, btnY + btnSize + 40);
        
        // Upgrades section
        this.ctx.fillStyle = '#2196f3';
        this.ctx.fillRect(100, 520, 1000, 60);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Upgrades:', 120, 550);
        
        const upgrades = [
            { name: 'GPU (+1 H/s)', cost: 50, x: 350 },
            { name: 'ASIC (+5 H/s)', cost: 200, x: 550 },
            { name: 'Mining Farm (+20 H/s)', cost: 500, x: 750 }
        ];
        
        upgrades.forEach(upgrade => {
            const canAfford = this.mining.blocks >= upgrade.cost;
            this.ctx.fillStyle = canAfford ? '#4caf50' : '#666';
            this.ctx.fillText(`${upgrade.name} - ${upgrade.cost} blocks`, upgrade.x, 550);
        });
        
        // Educational info
        this.renderEducationalBox(
            'What is Mining?',
            'Mining is the process of validating transactions and adding them to the blockchain. ' +
            'Miners use computational power to solve complex puzzles and earn Bitcoin rewards!',
            50, this.canvas.height - 130, 1100, 80
        );
        
        // Check completion
        if (this.mining.blocks >= 100) {
            this.completeLevel(1);
        }
    }
    
    // ==================== LEVEL 2: BLOCKCHAIN BUILDER ====================
    
    renderBlockchainBuilder() {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⛓️ BUILD YOUR OWN BLOCKCHAIN', this.canvas.width / 2, 40);
        
        // Instructions
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Add blocks to create a secure chain! Each block links to the previous one.', 
            this.canvas.width / 2, 80);
        
        // Draw blockchain
        const blockWidth = 150;
        const blockHeight = 100;
        const startX = 100;
        const startY = 150;
        const gap = 20;
        
        this.blockchain.forEach((block, index) => {
            const x = startX + (index % 6) * (blockWidth + gap);
            const y = startY + Math.floor(index / 6) * (blockHeight + gap);
            
            // Block
            this.ctx.fillStyle = block.valid ? '#4caf50' : '#f44336';
            this.ctx.fillRect(x, y, blockWidth, blockHeight);
            
            // Block info
            this.ctx.fillStyle = '#000';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Block #${index}`, x + 10, y + 25);
            this.ctx.font = '12px monospace';
            this.ctx.fillText(`Hash: ${block.hash.substr(0, 12)}...`, x + 10, y + 50);
            this.ctx.fillText(`Prev: ${block.prevHash.substr(0, 12)}...`, x + 10, y + 70);
            
            // Chain link
            if (index > 0 && index % 6 !== 0) {
                this.ctx.strokeStyle = '#64b5f6';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(x - gap, y + blockHeight / 2);
                this.ctx.lineTo(x, y + blockHeight / 2);
                this.ctx.stroke();
            }
        });
        
        // Add block button
        this.drawButton(this.canvas.width / 2 - 100, 450, 200, 50, 'Add Block', '#2196f3');
        
        // Validate chain button
        this.drawButton(this.canvas.width / 2 - 100, 520, 200, 50, 'Validate Chain', '#4caf50');
        
        // Back button
        this.drawButton(50, this.canvas.height - 70, 150, 50, 'Back', '#f44336');
    }
    
    // ==================== LEVEL 3: WALLET CREATOR ====================
    
    renderWalletCreator() {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('👛 CREATE YOUR CRYPTO WALLET', this.canvas.width / 2, 40);
        
        if (!this.wallet.address) {
            // Wallet creation interface
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('A wallet stores your crypto securely with two keys:', this.canvas.width / 2, 100);
            
            // Key explanations
            const explanations = [
                { icon: '🔓', title: 'Public Key (Address)', desc: 'Like your email - share it to receive crypto', y: 180 },
                { icon: '🔐', title: 'Private Key', desc: 'Like your password - NEVER share this!', y: 280 }
            ];
            
            explanations.forEach(item => {
                this.ctx.font = 'bold 40px Arial';
                this.ctx.fillText(item.icon, 200, item.y);
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(item.title, 280, item.y - 20);
                this.ctx.font = '18px Arial';
                this.ctx.fillStyle = '#aaa';
                this.ctx.fillText(item.desc, 280, item.y + 10);
                this.ctx.fillStyle = '#fff';
                this.ctx.textAlign = 'center';
            });
            
            // Generate button
            this.drawButton(this.canvas.width / 2 - 150, 400, 300, 60, 'Generate My Wallet', '#4caf50');
            
        } else {
            // Show generated wallet
            this.ctx.fillStyle = '#2196f3';
            this.ctx.fillRect(100, 100, 1000, 400);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'left';
            
            this.ctx.fillText('✅ Your Wallet is Ready!', 120, 140);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Public Address:', 120, 200);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 16px monospace';
            this.ctx.fillText(this.wallet.address, 120, 230);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Balance:', 120, 280);
            this.ctx.fillStyle = '#4caf50';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.fillText(`$${this.wallet.balance.toFixed(2)}`, 120, 320);
            
            // Seed phrase
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Seed Phrase (Write this down!):', 120, 380);
            
            const seedWords = this.wallet.privateKey.split('-');
            this.ctx.font = '16px monospace';
            seedWords.forEach((word, i) => {
                const x = 120 + (i % 4) * 250;
                const y = 410 + Math.floor(i / 4) * 30;
                this.ctx.fillStyle = '#ff9800';
                this.ctx.fillText(`${i + 1}. ${word}`, x, y);
            });
            
            // Transaction button
            this.drawButton(this.canvas.width / 2 - 100, 520, 200, 50, 'Complete', '#4caf50');
        }
        
        // Back button
        this.drawButton(50, this.canvas.height - 70, 150, 50, 'Back', '#f44336');
    }
    
    // ==================== LEVEL 4: TRADING SIMULATOR ====================
    
    renderTradingSim() {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📈 CRYPTO TRADING ACADEMY', this.canvas.width / 2, 40);
        
        // Portfolio value
        this.ctx.fillStyle = '#4caf50';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText(`Portfolio: $${this.wallet.balance.toFixed(2)}`, this.canvas.width / 2, 90);
        
        // Market prices
        const tokens = [
            { name: 'BTC', price: this.trading.prices.BTC || 45000, change: 2.5, icon: '₿' },
            { name: 'ETH', price: this.trading.prices.ETH || 3000, change: -1.2, icon: 'Ξ' },
            { name: 'SOL', price: this.trading.prices.SOL || 100, change: 5.7, icon: '◎' }
        ];
        
        const cardWidth = 350;
        const startX = 50;
        const startY = 140;
        
        tokens.forEach((token, index) => {
            const x = startX + index * (cardWidth + 25);
            const y = startY;
            
            // Card background
            this.ctx.fillStyle = '#1e1e1e';
            this.ctx.fillRect(x, y, cardWidth, 180);
            
            // Token info
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(token.icon, x + cardWidth / 2, y + 60);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(token.name, x + cardWidth / 2, y + 100);
            
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`$${token.price.toFixed(2)}`, x + cardWidth / 2, y + 130);
            
            // Change indicator
            const changeColor = token.change > 0 ? '#4caf50' : '#f44336';
            this.ctx.fillStyle = changeColor;
            this.ctx.font = '18px Arial';
            const changeText = token.change > 0 ? `▲ +${token.change}%` : `▼ ${token.change}%`;
            this.ctx.fillText(changeText, x + cardWidth / 2, y + 160);
            
            // Buy/Sell buttons
            this.drawButton(x + 20, y + 190, 150, 40, 'Buy', '#4caf50');
            this.drawButton(x + 180, y + 190, 150, 40, 'Sell', '#f44336');
        });
        
        // Chart area
        this.ctx.fillStyle = '#1e1e1e';
        this.ctx.fillRect(50, 360, 1100, 200);
        
        this.ctx.strokeStyle = '#2196f3';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        for (let i = 0; i < 100; i++) {
            const x = 50 + i * 11;
            const noise = Math.sin(i * 0.1 + Date.now() * 0.001) * 50;
            const y = 460 + noise;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Live Market Chart', this.canvas.width / 2, 390);
        
        // Back button
        this.drawButton(50, this.canvas.height - 70, 150, 50, 'Back', '#f44336');
    }
    
    // ==================== LEVEL 5: SCAM DETECTOR ====================
    
    renderScamDetector() {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🛡️ SCAM DETECTOR TRAINING', this.canvas.width / 2, 40);
        
        const scams = [
            { title: 'Fake Giveaway', red: ['Send 1 BTC get 2 back', 'Celebrity endorsement', 'Limited time'], safe: ['Never send crypto first', 'Too good to be true', 'Verify official accounts'] },
            { title: 'Phishing Website', red: ['Suspiciouslink.com', 'Spelling errors', 'No HTTPS'], safe: ['Check URL carefully', 'Look for padlock', 'Bookmark official sites'] },
            { title: 'Pump & Dump', red: ['Buy now or miss out!', 'Guaranteed 1000x', 'Secret insider info'], safe: ['Do your research', 'Avoid FOMO', 'Diversify investments'] }
        ];
        
        const currentScam = scams[Math.floor(Date.now() / 10000) % scams.length];
        
        // Scenario
        this.ctx.fillStyle = '#f44336';
        this.ctx.fillRect(100, 100, 1000, 200);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`⚠️ ${currentScam.title}`, this.canvas.width / 2, 140);
        
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#ffeb3b';
        currentScam.red.forEach((flag, i) => {
            this.ctx.fillText(`🚩 ${flag}`, 120, 190 + i * 30);
        });
        
        // Safe practices
        this.ctx.fillStyle = '#4caf50';
        this.ctx.fillRect(100, 340, 1000, 180);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✅ How to Stay Safe', this.canvas.width / 2, 375);
        
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        currentScam.safe.forEach((tip, i) => {
            this.ctx.fillText(`✓ ${tip}`, 120, 415 + i * 30);
        });
        
        // Interactive buttons
        this.drawButton(250, 550, 300, 50, 'This is a SCAM!', '#f44336');
        this.drawButton(650, 550, 300, 50, 'This is SAFE', '#4caf50');
        
        // Back button
        this.drawButton(50, this.canvas.height - 70, 150, 50, 'Back', '#f44336');
    }
    
    // ==================== UI HELPERS ====================
    
    renderUI() {
        // Top bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, 30);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`💰 ${this.coins} | 🧠 ${this.knowledge}% | 🏆 ${this.achievements.length}/25`, 10, 20);
        
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Level ${this.currentLevel}/25 | ESC = Menu`, this.canvas.width - 10, 20);
    }
    
    drawButton(x, y, width, height, text, color) {
        const isHover = this.mouse.x >= x && this.mouse.x <= x + width && 
                        this.mouse.y >= y && this.mouse.y <= y + height;
        
        this.ctx.fillStyle = isHover ? this.lightenColor(color) : color;
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x + width / 2, y + height / 2 + 7);
        
        return isHover;
    }
    
    renderEducationalBox(title, text, x, y, width, height) {
        this.ctx.fillStyle = 'rgba(33, 150, 243, 0.8)';
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`📚 ${title}`, x + 10, y + 25);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.wrapText(text, x + 10, y + 50, width - 20, 20);
    }
    
    wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                this.ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, x, y);
    }
    
    lightenColor(color) {
        // Simple color lightener
        const colors = {
            '#2196f3': '#42a5f5',
            '#4caf50': '#66bb6a',
            '#f44336': '#ef5350',
            '#ff9800': '#ffa726'
        };
        return colors[color] || color;
    }
    
    // ==================== GAME LOGIC ====================
    
    handleClick(x, y) {
        if (this.scene === 'menu') {
            if (this.isPointInButton(x, y, this.canvas.width / 2 - 150, 280, 300, 50) ||
                this.isPointInButton(x, y, this.canvas.width / 2 - 150, 340, 300, 50)) {
                this.scene = 'level_select';
            }
        }
        
        if (this.scene === 'level_select') {
            // Check level cards
            const cols = 3;
            const startX = 100;
            const startY = 100;
            const cardWidth = 350;
            const cardHeight = 120;
            const gap = 20;
            
            const levels = [
                { type: 'mining' },
                { type: 'blockchain_builder' },
                { type: 'wallet_creator' },
                { type: 'trading_sim' },
                { type: 'scam_detector' },
                { type: 'nft_studio' },
                { type: 'defi_farm' },
                { type: 'dao_builder' }
            ];
            
            levels.forEach((level, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const lx = startX + col * (cardWidth + gap);
                const ly = startY + row * (cardHeight + gap);
                
                if (x >= lx && x <= lx + cardWidth && y >= ly && y <= ly + cardHeight) {
                    if (index < this.currentLevel || index === this.currentLevel - 1 || index === 0) {
                        this.scene = level.type;
                        this.initLevel(level.type);
                    }
                }
            });
            
            // Back button
            if (this.isPointInButton(x, y, 50, this.canvas.height - 70, 150, 50)) {
                this.scene = 'menu';
            }
        }
        
        if (this.scene === 'mining') {
            // Mining button
            const btnSize = 200;
            const btnX = (this.canvas.width - btnSize) / 2;
            const btnY = 250;
            const distance = Math.sqrt(Math.pow(x - this.canvas.width / 2, 2) + Math.pow(y - (btnY + btnSize / 2), 2));
            
            if (distance <= btnSize / 2) {
                this.mining.clicks++;
                this.mining.blocks += 1 + this.mining.hashrate * 0.1;
                this.coins += 1;
            }
            
            // Upgrade buttons
            if (this.isPointInButton(x, y, 350, 520, 170, 60) && this.mining.blocks >= 50) {
                this.mining.blocks -= 50;
                this.mining.hashrate += 1;
            }
            
            // Back button
            if (this.isPointInButton(x, y, 50, this.canvas.height - 70, 150, 50)) {
                this.scene = 'level_select';
            }
        }
        
        if (this.scene === 'blockchain_builder') {
            // Add block button
            if (this.isPointInButton(x, y, this.canvas.width / 2 - 100, 450, 200, 50)) {
                this.addBlock();
            }
            
            // Back button
            if (this.isPointInButton(x, y, 50, this.canvas.height - 70, 150, 50)) {
                this.scene = 'level_select';
            }
        }
        
        if (this.scene === 'wallet_creator') {
            // Generate wallet button
            if (!this.wallet.address && this.isPointInButton(x, y, this.canvas.width / 2 - 150, 400, 300, 60)) {
                this.generateWallet();
            }
            
            // Complete button
            if (this.wallet.address && this.isPointInButton(x, y, this.canvas.width / 2 - 100, 520, 200, 50)) {
                this.completeLevel(3);
                this.scene = 'level_select';
            }
            
            // Back button
            if (this.isPointInButton(x, y, 50, this.canvas.height - 70, 150, 50)) {
                this.scene = 'level_select';
            }
        }
        
        // Add more click handlers for other levels...
    }
    
    isPointInButton(px, py, x, y, width, height) {
        return px >= x && px <= x + width && py >= y && py <= y + height;
    }
    
    initLevel(type) {
        if (type === 'mining') {
            this.mining = { active: true, hashrate: 0, blocks: 0, clicks: 0 };
        }
        if (type === 'blockchain_builder') {
            this.blockchain = [this.createGenesisBlock()];
        }
    }
    
    addBlock() {
        const prevBlock = this.blockchain[this.blockchain.length - 1];
        const newBlock = {
            index: this.blockchain.length,
            timestamp: Date.now(),
            data: `Transaction ${this.blockchain.length}`,
            prevHash: prevBlock.hash,
            hash: this.calculateHash(this.blockchain.length, prevBlock.hash),
            valid: true
        };
        this.blockchain.push(newBlock);
        this.coins += 10;
        this.knowledge += 5;
        
        if (this.blockchain.length >= 10) {
            this.completeLevel(2);
        }
    }
    
    createGenesisBlock() {
        return {
            index: 0,
            timestamp: Date.now(),
            data: 'Genesis Block',
            prevHash: '0',
            hash: this.calculateHash(0, '0'),
            valid: true
        };
    }
    
    calculateHash(index, prevHash) {
        const hash = `${index}${prevHash}${Date.now()}`;
        return hash.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0).toString(16).substr(0, 16);
    }
    
    generateWallet() {
        const words = ['apple', 'brave', 'cloud', 'dream', 'eagle', 'flame', 'ghost', 'honor'];
        const shuffled = words.sort(() => Math.random() - 0.5);
        
        this.wallet.address = '0x' + Array(40).fill(0).map(() => 
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('');
        
        this.wallet.privateKey = shuffled.join('-');
        this.wallet.balance = 1000;
        this.coins += 50;
        this.knowledge += 10;
    }
    
    updateTradingPrices(dt) {
        if (!this.trading.prices.BTC) {
            this.trading.prices = { BTC: 45000, ETH: 3000, SOL: 100 };
        }
        
        // Simulate price changes
        Object.keys(this.trading.prices).forEach(token => {
            const change = (Math.random() - 0.5) * 50;
            this.trading.prices[token] += change * dt;
        });
    }
    
    completeLevel(levelNum) {
        if (!this.completedLevels.includes(levelNum)) {
            this.completedLevels.push(levelNum);
            this.currentLevel = Math.max(this.currentLevel, levelNum + 1);
            this.knowledge += 10;
            this.achievements.push(`Level ${levelNum} Complete`);
            this.saveProgress();
            this.showLevelComplete(levelNum);
        }
    }
    
    showLevelComplete(levelNum) {
        // Show completion overlay
        alert(`🎉 Level ${levelNum} Complete!\n\n+50 Coins\n+10 Knowledge\n\nKeep learning!`);
    }
    
    // ==================== PROGRESS MANAGEMENT ====================
    
    async saveProgress() {
        // Strip privateKey before persisting – never store private keys in localStorage
        const { privateKey: _privateKey, ...safeWallet } = this.wallet || {};
        const progress = {
            userId: this.userId,
            coins: this.coins,
            knowledge: this.knowledge,
            achievements: this.achievements,
            completedLevels: this.completedLevels,
            currentLevel: this.currentLevel,
            wallet: safeWallet,
            mining: this.mining
        };
        
        // Save to localStorage
        localStorage.setItem('cryptoQuestProgress', JSON.stringify(progress));
        
        // Sync to API (also use the safe wallet without privateKey)
        try {
            const response = await fetch('/api/crypto-quest/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(progress)
            });
            console.log('Progress saved:', await response.json());
        } catch (err) {
            console.log('Offline mode - progress saved locally');
        }
    }
    
    loadProgress() {
        const saved = localStorage.getItem('cryptoQuestProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.coins = progress.coins || 0;
            this.knowledge = progress.knowledge || 0;
            this.achievements = progress.achievements || [];
            this.completedLevels = progress.completedLevels || [];
            this.currentLevel = progress.currentLevel || 1;
            this.wallet = progress.wallet || { address: '', privateKey: '', balance: 1000, tokens: {} };
            this.mining = progress.mining || { active: false, hashrate: 0, blocks: 0, clicks: 0 };
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CryptoQuestGame();
});
