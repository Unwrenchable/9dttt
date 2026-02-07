/**
 * CRYPTO QUEST ACADEMY
 * Educational blockchain and cryptocurrency game for kids and beginners
 * Learn about crypto, blockchain, Satoshi Nakamoto, Layer 0, Layer 2, and more!
 */

class CryptoQuestGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'menu'; // menu, playing, quiz, info
        this.currentLevel = 0;
        this.completedLevels = new Set();
        
        // Player progress
        this.coins = 0;
        this.knowledge = 0;
        this.achievements = [];
        
        // Player character
        this.player = {
            x: 100,
            y: 300,
            width: 40,
            height: 40,
            speed: 5,
            sprite: '🧑‍🎓'
        };
        
        // Keyboard input
        this.keys = {};
        
        // Educational levels
        this.levels = [
            {
                id: 0,
                title: "What is Money?",
                icon: "💰",
                description: "Learn the basics of money and why we need it",
                unlocked: true,
                completed: false,
                coins: 100,
                knowledge: 5,
                type: 'quiz',
                content: this.getMoneyContent()
            },
            {
                id: 1,
                title: "Meet Satoshi Nakamoto",
                icon: "🕵️",
                description: "Discover the mystery creator of Bitcoin",
                unlocked: false,
                completed: false,
                coins: 150,
                knowledge: 10,
                type: 'story',
                content: this.getSatoshiContent()
            },
            {
                id: 2,
                title: "What is Blockchain?",
                icon: "⛓️",
                description: "Learn how blockchain technology works",
                unlocked: false,
                completed: false,
                coins: 200,
                knowledge: 15,
                type: 'interactive',
                content: this.getBlockchainContent()
            },
            {
                id: 3,
                title: "Mining Adventure",
                icon: "⛏️",
                description: "Understand how crypto mining works",
                unlocked: false,
                completed: false,
                coins: 250,
                knowledge: 10,
                type: 'minigame',
                content: this.getMiningContent()
            },
            {
                id: 4,
                title: "Bitcoin Basics",
                icon: "₿",
                description: "Learn about Bitcoin, the first cryptocurrency",
                unlocked: false,
                completed: false,
                coins: 300,
                knowledge: 15,
                type: 'quiz',
                content: this.getBitcoinContent()
            },
            {
                id: 5,
                title: "Ethereum & Smart Contracts",
                icon: "💎",
                description: "Discover programmable blockchain with Ethereum",
                unlocked: false,
                completed: false,
                coins: 350,
                knowledge: 15,
                type: 'interactive',
                content: this.getEthereumContent()
            },
            {
                id: 6,
                title: "Layer 0: The Foundation",
                icon: "🏗️",
                description: "Learn about Layer 0 blockchain infrastructure",
                unlocked: false,
                completed: false,
                coins: 400,
                knowledge: 20,
                type: 'story',
                content: this.getLayer0Content()
            },
            {
                id: 7,
                title: "Layer 1: Base Chains",
                icon: "🔗",
                description: "Understand Layer 1 blockchains like Bitcoin and Ethereum",
                unlocked: false,
                completed: false,
                coins: 400,
                knowledge: 20,
                type: 'quiz',
                content: this.getLayer1Content()
            },
            {
                id: 8,
                title: "Layer 2: Scaling Solutions",
                icon: "⚡",
                description: "Learn how Layer 2 makes crypto faster and cheaper",
                unlocked: false,
                completed: false,
                coins: 500,
                knowledge: 25,
                type: 'interactive',
                content: this.getLayer2Content()
            },
            {
                id: 9,
                title: "Create Your First Wallet",
                icon: "👛",
                description: "Build a real crypto wallet step-by-step",
                unlocked: false,
                completed: false,
                coins: 300,
                knowledge: 15,
                type: 'wallet-creation',
                content: this.getWalletCreationContent()
            },
            {
                id: 10,
                title: "NFTs & Digital Art",
                icon: "🎨",
                description: "Explore Non-Fungible Tokens and digital ownership",
                unlocked: false,
                completed: false,
                coins: 400,
                knowledge: 15,
                type: 'story',
                content: this.getNFTContent()
            },
            {
                id: 11,
                title: "DeFi: Banking 2.0",
                icon: "🏦",
                description: "Learn about Decentralized Finance",
                unlocked: false,
                completed: false,
                coins: 500,
                knowledge: 20,
                type: 'quiz',
                content: this.getDeFiContent()
            },
            {
                id: 12,
                title: "Gas Fees Explained",
                icon: "⛽",
                description: "Understand transaction costs in crypto",
                unlocked: false,
                completed: false,
                coins: 250,
                knowledge: 10,
                type: 'interactive',
                content: this.getGasContent()
            },
            {
                id: 13,
                title: "Staking & Rewards",
                icon: "🌾",
                description: "Earn passive income with staking",
                unlocked: false,
                completed: false,
                coins: 400,
                knowledge: 15,
                type: 'minigame',
                content: this.getStakingContent()
            },
            {
                id: 14,
                title: "Security & Safety",
                icon: "🔒",
                description: "Learn how to stay safe in crypto",
                unlocked: false,
                completed: false,
                coins: 300,
                knowledge: 20,
                type: 'quiz',
                content: this.getSecurityContent()
            },
            {
                id: 15,
                title: "Bull & Bear Markets",
                icon: "📈",
                description: "Understand market cycles",
                unlocked: false,
                completed: false,
                coins: 350,
                knowledge: 15,
                type: 'interactive',
                content: this.getMarketContent()
            },
            {
                id: 16,
                title: "Web3: The Future",
                icon: "🌐",
                description: "Discover the decentralized internet",
                unlocked: false,
                completed: false,
                coins: 500,
                knowledge: 20,
                type: 'story',
                content: this.getWeb3Content()
            },
            {
                id: 17,
                title: "DAOs: Digital Communities",
                icon: "🏛️",
                description: "Learn about Decentralized Autonomous Organizations",
                unlocked: false,
                completed: false,
                coins: 400,
                knowledge: 15,
                type: 'quiz',
                content: this.getDAOContent()
            },
            {
                id: 18,
                title: "The Metaverse",
                icon: "🥽",
                description: "Explore virtual worlds and digital economies",
                unlocked: false,
                completed: false,
                coins: 450,
                knowledge: 15,
                type: 'interactive',
                content: this.getMetaverseContent()
            },
            {
                id: 19,
                title: "Spot the Scammer!",
                icon: "🚨",
                description: "Learn to identify scams, rug pulls, and phishing",
                unlocked: false,
                completed: false,
                coins: 500,
                knowledge: 25,
                type: 'scam-game',
                content: this.getScamContent()
            },
            {
                id: 20,
                title: "Token Swap Challenge",
                icon: "🔄",
                description: "Use a DEX to swap tokens like a pro",
                unlocked: false,
                completed: false,
                coins: 400,
                knowledge: 20,
                type: 'swap-game',
                content: this.getSwapContent()
            },
            {
                id: 21,
                title: "Mint Your NFT",
                icon: "🎨",
                description: "Create and mint your own NFT artwork",
                unlocked: false,
                completed: false,
                coins: 500,
                knowledge: 20,
                type: 'nft-mint',
                content: this.getNFTMintContent()
            },
            {
                id: 22,
                title: "Bridge Master",
                icon: "🌉",
                description: "Move assets between different blockchains",
                unlocked: false,
                completed: false,
                coins: 450,
                knowledge: 20,
                type: 'bridge-game',
                content: this.getBridgeContent()
            },
            {
                id: 23,
                title: "DeFi Yield Farming",
                icon: "🚜",
                description: "Earn rewards by providing liquidity",
                unlocked: false,
                completed: false,
                coins: 600,
                knowledge: 25,
                type: 'defi-farm',
                content: this.getYieldFarmContent()
            },
            {
                id: 24,
                title: "Crypto Master Challenge",
                icon: "🏆",
                description: "Final exam - prove you're a crypto expert!",
                unlocked: false,
                completed: false,
                coins: 1000,
                knowledge: 50,
                type: 'quiz',
                content: this.getFinalContent()
            }
        ];
        
        this.init();
    }
    
    init() {
        this.loadProgress();
        this.setupEventListeners();
        this.renderLevelMap();
        this.updateUI();
        this.startGame();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Gamepad support
        if (window.gamepadManager) {
            window.gamepadManager.on('buttonDown', (button) => {
                if (button === 'start') this.togglePause();
            });
        }
    }
    
    renderLevelMap() {
        const grid = document.getElementById('levelGrid');
        grid.innerHTML = '';
        
        this.levels.forEach((level, index) => {
            const card = document.createElement('div');
            card.className = 'level-card';
            
            if (!level.unlocked) {
                card.classList.add('locked');
            }
            if (level.completed) {
                card.classList.add('completed');
            }
            
            card.innerHTML = `
                <div class="level-icon">${level.icon}</div>
                <div class="level-title">${level.title}</div>
                <div class="level-description">${level.description}</div>
                <div style="margin-top: 10px; color: #ffd700;">
                    🪙 ${level.coins} | 🎓 +${level.knowledge}%
                </div>
            `;
            
            if (level.unlocked) {
                card.onclick = () => this.startLevel(index);
            }
            
            grid.appendChild(card);
        });
    }
    
    startLevel(levelIndex) {
        this.currentLevel = levelIndex;
        const level = this.levels[levelIndex];
        
        this.state = 'playing';
        
        // Show level content based on type
        if (level.type === 'quiz') {
            this.showQuiz(level);
        } else if (level.type === 'story') {
            this.showStory(level);
        } else if (level.type === 'interactive') {
            this.showInteractive(level);
        } else if (level.type === 'minigame') {
            this.showMiniGame(level);
        } else if (level.type === 'wallet-creation') {
            this.showWalletCreation(level);
        } else if (level.type === 'scam-game') {
            this.showScamGame(level);
        } else if (level.type === 'swap-game') {
            this.showSwapGame(level);
        } else if (level.type === 'nft-mint') {
            this.showNFTMint(level);
        } else if (level.type === 'bridge-game') {
            this.showBridgeGame(level);
        } else if (level.type === 'defi-farm') {
            this.showDeFiFarm(level);
        }
    }
    
    showQuiz(level) {
        const content = level.content;
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw quiz title
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(level.title, canvas.width / 2, 60);
        
        // Draw question
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        this.wrapText(ctx, content.quiz.question, canvas.width / 2, 120, canvas.width - 100, 35);
        
        // Draw options
        const startY = 220;
        const optionHeight = 80;
        
        content.quiz.options.forEach((option, index) => {
            const y = startY + (index * optionHeight);
            
            // Option box
            ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
            ctx.fillRect(50, y, canvas.width - 100, 70);
            
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(50, y, canvas.width - 100, 70);
            
            // Option text
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${String.fromCharCode(65 + index)}. ${option}`, 70, y + 40);
        });
        
        // Handle user selection
        this.handleQuizInput(content.quiz, level);
    }
    
    handleQuizInput(quiz, level) {
        let selectedIndex = -1;
        
        const keyHandler = (e) => {
            const key = e.key.toUpperCase();
            
            if (key >= 'A' && key <= 'D') {
                selectedIndex = key.charCodeAt(0) - 65;
                
                if (selectedIndex < quiz.options.length) {
                    document.removeEventListener('keydown', keyHandler);
                    this.checkAnswer(selectedIndex, quiz.correct, quiz.explanation, level);
                }
            }
        };
        
        document.addEventListener('keydown', keyHandler);
    }
    
    checkAnswer(selected, correct, explanation, level) {
        if (selected === correct) {
            this.showFeedback('Correct! 🎉', explanation, true, level);
        } else {
            this.showFeedback('Not quite! 🤔', explanation, false, level);
        }
    }
    
    showFeedback(title, explanation, correct, level) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Dim background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Feedback box
        ctx.fillStyle = correct ? '#00ff00' : '#ff6600';
        ctx.fillRect(100, 150, canvas.width - 200, 300);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, 220);
        
        ctx.fillStyle = '#000000';
        ctx.font = '20px Arial';
        this.wrapText(ctx, explanation, canvas.width / 2, 280, canvas.width - 250, 30);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Press SPACE to continue', canvas.width / 2, 420);
        
        if (correct) {
            setTimeout(() => {
                const spaceHandler = (e) => {
                    if (e.key === ' ') {
                        document.removeEventListener('keydown', spaceHandler);
                        this.completeLevel(level);
                    }
                };
                document.addEventListener('keydown', spaceHandler);
            }, 100);
        } else {
            setTimeout(() => {
                const spaceHandler = (e) => {
                    if (e.key === ' ') {
                        document.removeEventListener('keydown', spaceHandler);
                        this.showQuiz(level);
                    }
                };
                document.addEventListener('keydown', spaceHandler);
            }, 100);
        }
    }
    
    showStory(level) {
        const content = level.content;
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(level.title, canvas.width / 2, 60);
        
        // Icon
        ctx.font = '80px Arial';
        ctx.fillText(level.icon, canvas.width / 2, 160);
        
        // Story text
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        this.wrapText(ctx, content.story, canvas.width / 2, 220, canvas.width - 100, 30);
        
        // Fun fact
        if (content.funFact) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'italic 18px Arial';
            ctx.fillText('💡 Fun Fact:', canvas.width / 2, canvas.height - 100);
            ctx.fillStyle = '#ffffff';
            this.wrapText(ctx, content.funFact, canvas.width / 2, canvas.height - 60, canvas.width - 100, 25);
        }
        
        // Continue prompt
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Press SPACE to continue', canvas.width / 2, canvas.height - 30);
        
        const spaceHandler = (e) => {
            if (e.key === ' ') {
                document.removeEventListener('keydown', spaceHandler);
                this.completeLevel(level);
            }
        };
        document.addEventListener('keydown', spaceHandler);
    }
    
    showInteractive(level) {
        const content = level.content;
        
        // Display interactive blockchain visualization or similar
        this.showStory(level); // Simplified for now
    }
    
    showMiniGame(level) {
        // Simplified mining or wallet mini-game
        this.showStory(level);
    }
    
    completeLevel(level) {
        if (!level.completed) {
            level.completed = true;
            this.completedLevels.add(level.id);
            this.coins += level.coins;
            this.knowledge += level.knowledge;
            
            // Unlock next level
            if (level.id < this.levels.length - 1) {
                this.levels[level.id + 1].unlocked = true;
            }
            
            this.checkAchievements();
            this.saveProgress();
            this.updateUI();
            this.showLevelComplete(level);
        }
    }
    
    showLevelComplete(level) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <h2 style="color: #ffd700; font-size: 36px; margin-bottom: 20px;">
                🎉 LEVEL COMPLETE! 🎉
            </h2>
            <p style="font-size: 24px; margin: 15px 0;">
                ${level.title}
            </p>
            <p style="font-size: 20px; color: #00ffff;">
                +${level.coins} 🪙 Crypto Coins
            </p>
            <p style="font-size: 20px; color: #00ff00;">
                +${level.knowledge}% 🎓 Knowledge
            </p>
            <button class="btn" onclick="this.parentElement.remove(); location.reload();">
                Continue Learning!
            </button>
        `;
        document.body.appendChild(popup);
    }
    
    checkAchievements() {
        const newAchievements = [];
        
        if (this.completedLevels.size === 1 && !this.achievements.includes('first')) {
            newAchievements.push({ id: 'first', name: 'First Steps', desc: 'Complete your first lesson!' });
        }
        if (this.completedLevels.size === 5 && !this.achievements.includes('learner')) {
            newAchievements.push({ id: 'learner', name: 'Eager Learner', desc: 'Complete 5 lessons!' });
        }
        if (this.completedLevels.size === 10 && !this.achievements.includes('novice')) {
            newAchievements.push({ id: 'novice', name: 'Crypto Novice', desc: 'Complete 10 lessons!' });
        }
        if (this.completedLevels.size === 15 && !this.achievements.includes('intermediate')) {
            newAchievements.push({ id: 'intermediate', name: 'Blockchain Enthusiast', desc: 'Complete 15 lessons!' });
        }
        if (this.completedLevels.size === 20 && !this.achievements.includes('expert')) {
            newAchievements.push({ id: 'expert', name: 'Web3 Expert', desc: 'Complete 20 lessons!' });
        }
        if (this.completedLevels.size === 25 && !this.achievements.includes('master')) {
            newAchievements.push({ id: 'master', name: 'Crypto Master', desc: 'Complete all 25 lessons!' });
        }
        
        newAchievements.forEach(achievement => {
            this.achievements.push(achievement.id);
            this.showAchievement(achievement);
        });
    }
    
    showAchievement(achievement) {
        // Show achievement notification
        console.log('Achievement unlocked:', achievement.name);
    }
    
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }
    
    updateUI() {
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('level').textContent = this.completedLevels.size + 1;
        document.getElementById('achievements').textContent = `${this.achievements.length}/25`;
        document.getElementById('knowledge').textContent = Math.min(100, this.knowledge) + '%';
        
        this.renderLevelMap();
    }
    
    saveProgress() {
        const progress = {
            coins: this.coins,
            knowledge: this.knowledge,
            achievements: this.achievements,
            completedLevels: Array.from(this.completedLevels),
            levels: this.levels
        };
        localStorage.setItem('cryptoQuestProgress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('cryptoQuestProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.coins = progress.coins || 0;
            this.knowledge = progress.knowledge || 0;
            this.achievements = progress.achievements || [];
            this.completedLevels = new Set(progress.completedLevels || []);
            
            // Update levels
            if (progress.levels) {
                progress.levels.forEach((savedLevel, index) => {
                    if (this.levels[index]) {
                        this.levels[index].completed = savedLevel.completed;
                        this.levels[index].unlocked = savedLevel.unlocked;
                    }
                });
            }
        }
    }
    
    startGame() {
        this.render();
    }
    
    render() {
        // Main render loop
        requestAnimationFrame(() => this.render());
    }
    
    togglePause() {
        // Pause game logic
    }
    
    // NEW WEB3 INTERACTIVE EXPERIENCES
    
    showWalletCreation(level) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        let step = 0;
        let wallet = {
            seedPhrase: [],
            password: '',
            address: '',
            privateKey: ''
        };
        
        const steps = [
            "Welcome to Wallet Creation!\n\nIn Web3, your wallet is YOUR bank. You're in control!\n\nPress SPACE to start",
            "Step 1: Generate Seed Phrase\n\nYour seed phrase is 12 random words that act as a master key.\nNEVER share these with ANYONE!\n\nPress SPACE to generate",
            "Step 2: Write Down Your Seed Phrase\n\nIn real life, you'd write these on PAPER, not digital!\nStore safely - if you lose them, your crypto is gone forever.\n\nPress SPACE to continue",
            "Step 3: Create Strong Password\n\nThis password encrypts your wallet on this device.\nMake it long, unique, and secure!\n\nPress SPACE to create",
            "Step 4: Your Wallet Address\n\nThis is like your email - safe to share publicly.\nPeople send crypto TO this address.\n\nPress SPACE to see it",
            "🎉 Wallet Created!\n\nYou now understand:\n✅ Seed phrases are the ultimate key\n✅ Never store them digitally\n✅ Your address is public, keys are private\n✅ You are your own bank!\n\nPress SPACE to complete"
        ];
        
        const renderWallet = () => {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Title
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔐 Wallet Creation Workshop 👛', canvas.width / 2, 50);
            
            // Progress bar
            const progress = (step / (steps.length - 1)) * 100;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(100, 80, canvas.width - 200, 20);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(100, 80, ((canvas.width - 200) * progress) / 100, 20);
            
            // Current step content
            ctx.fillStyle = '#ffffff';
            ctx.font = '22px Arial';
            this.wrapText(ctx, steps[step], canvas.width / 2, 150, canvas.width - 150, 35);
            
            // Show wallet details based on step
            if (step === 2 && wallet.seedPhrase.length > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(150, 300, canvas.width - 300, 200);
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.strokeRect(150, 300, canvas.width - 300, 200);
                
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'left';
                
                wallet.seedPhrase.forEach((word, i) => {
                    const x = 180 + (i % 4) * 220;
                    const y = 330 + Math.floor(i / 4) * 40;
                    ctx.fillText(`${i + 1}. ${word}`, x, y);
                });
            }
            
            if (step === 3) {
                ctx.fillStyle = '#00ffff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Password: ' + '•'.repeat(12), canvas.width / 2, 350);
                
                ctx.fillStyle = '#00ff00';
                ctx.font = '18px Arial';
                ctx.fillText('✓ Strong password created', canvas.width / 2, 400);
            }
            
            if (step === 4 && wallet.address) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(150, 300, canvas.width - 300, 150);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(150, 300, canvas.width - 300, 150);
                
                ctx.fillStyle = '#00ffff';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Your Wallet Address:', canvas.width / 2, 340);
                
                ctx.fillStyle = '#ffd700';
                ctx.font = '16px Courier';
                this.wrapText(ctx, wallet.address, canvas.width / 2, 380, canvas.width - 350, 25);
            }
        };
        
        const handleInput = (e) => {
            if (e.key === ' ') {
                step++;
                
                // Generate seed phrase at step 1
                if (step === 2) {
                    const words = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 
                                  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
                                  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'];
                    for (let i = 0; i < 12; i++) {
                        wallet.seedPhrase.push(words[Math.floor(Math.random() * words.length)]);
                    }
                }
                
                // Generate password at step 3
                if (step === 3) {
                    wallet.password = 'Str0ng_P@ssw0rd_' + Math.random().toString(36).substring(7);
                }
                
                // Generate address at step 4
                if (step === 4) {
                    wallet.address = '0x' + Array(40).fill(0).map(() => 
                        Math.floor(Math.random() * 16).toString(16)).join('');
                }
                
                if (step >= steps.length) {
                    document.removeEventListener('keydown', handleInput);
                    this.completeLevel(level);
                    return;
                }
                
                renderWallet();
            }
        };
        
        document.addEventListener('keydown', handleInput);
        renderWallet();
    }
    
    showScamGame(level) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        let currentScenario = 0;
        let score = 0;
        
        const scenarios = [
            {
                title: "Suspicious DM",
                description: "Someone messages you: 'Hi! I'm from MetaMask support. We detected suspicious activity. Please verify your seed phrase here: bit.ly/verify123'",
                isScam: true,
                explanation: "🚨 SCAM! Real crypto companies NEVER ask for seed phrases. Support teams can't see or need your keys. This is a phishing attempt!",
                redFlags: ["Unsolicited DM", "Asking for seed phrase", "Suspicious link", "Claims to be support"]
            },
            {
                title: "Free NFT Airdrop!",
                description: "Tweet: 'We're giving away FREE NFTs! Just connect your wallet to mint: totallylegit-nft.com. Hurry, only 100 available!'",
                isScam: true,
                explanation: "🚨 SCAM! This is likely a drainer contract. When you 'connect', it empties your wallet. Real projects use official domains and verified accounts.",
                redFlags: ["Urgency tactics", "Unknown domain", "Too good to be true", "No verification badge"]
            },
            {
                title: "Investment Opportunity",
                description: "Discord: 'New token $MOON launching! 1000x guaranteed! Dev doxxed, liquidity locked! Get in early! Only $100 minimum!'",
                isScam: true,
                explanation: "🚨 RUG PULL WARNING! No investment is 'guaranteed'. 'Doxxed dev' and 'locked liquidity' are often lies. Could pump then dump, leaving you with worthless tokens.",
                redFlags: ["Guaranteed returns", "Pressure to invest", "Unknown token", "FOMO tactics"]
            },
            {
                title: "Official Announcement",
                description: "From verified @ethereum Twitter: 'Ethereum is upgrading to Ethereum 2.0. No action needed. Your ETH remains yours. More info: ethereum.org/eth2'",
                isScam: false,
                explanation: "✅ LEGITIMATE! This is from the official verified account, uses the real domain, doesn't ask for anything, and provides actual information.",
                redFlags: []
            },
            {
                title: "Giveaway Contest",
                description: "Elon Muск: 'Doing Bitcoin giveaway! Send 1 BTC to this address, get 2 BTC back! Limited time!' [Similar profile pic but slightly different name]",
                isScam: true,
                explanation: "🚨 SCAM! Classic impersonator scam. Real people don't do 'send crypto to get more back' deals. Check the username carefully - fake accounts copy profile pics.",
                redFlags: ["Send crypto to get more", "Impersonator account", "Too good to be true", "Urgency"]
            },
            {
                title: "Pancake Swap Notification",
                description: "Email from noreply@pancakeswap.com: 'Your pending swap is ready. Login to complete: pancakeswap.finance/swap'",
                isScam: false,
                explanation: "✅ LIKELY LEGITIMATE! Email is from official domain, using real website. But ALWAYS double-check URLs (look for subtle misspellings) and never click email links if uncertain - go directly to the site.",
                redFlags: []
            }
        ];
        
        const renderScam = () => {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (currentScenario >= scenarios.length) {
                // Show final score
                ctx.fillStyle = '#00ffff';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🎉 Scam Spotter Complete!', canvas.width / 2, 150);
                
                const percentage = (score / scenarios.length) * 100;
                ctx.fillStyle = percentage >= 80 ? '#00ff00' : percentage >= 60 ? '#ffff00' : '#ff6600';
                ctx.font = 'bold 36px Arial';
                ctx.fillText(`Score: ${score}/${scenarios.length} (${percentage.toFixed(0)}%)`, canvas.width / 2, 250);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '24px Arial';
                if (percentage >= 80) {
                    ctx.fillText('🏆 Excellent! You can spot scams like a pro!', canvas.width / 2, 320);
                } else if (percentage >= 60) {
                    ctx.fillText('👍 Good job! Stay vigilant!', canvas.width / 2, 320);
                } else {
                    ctx.fillText('⚠️ Review the red flags and try again!', canvas.width / 2, 320);
                }
                
                ctx.fillStyle = '#00ffff';
                ctx.font = 'bold 20px Arial';
                ctx.fillText('Press SPACE to continue', canvas.width / 2, 450);
                
                return;
            }
            
            const scenario = scenarios[currentScenario];
            
            // Title
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🚨 SPOT THE SCAM! 🚨', canvas.width / 2, 50);
            
            // Scenario number
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.fillText(`Scenario ${currentScenario + 1} of ${scenarios.length}`, canvas.width / 2, 90);
            
            // Scenario box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(100, 120, canvas.width - 200, 200);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(100, 120, canvas.width - 200, 200);
            
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(scenario.title, canvas.width / 2, 155);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px Arial';
            this.wrapText(ctx, scenario.description, canvas.width / 2, 195, canvas.width - 250, 28);
            
            // Options
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(200, 360, 350, 80);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(200, 360, 350, 80);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('Press S for SCAM', 375, 410);
            
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(650, 360, 350, 80);
            ctx.strokeRect(650, 360, 350, 80);
            
            ctx.fillStyle = '#000000';
            ctx.fillText('Press L for LEGIT', 825, 410);
            
            // Score
            ctx.fillStyle = '#ffd700';
            ctx.font = '20px Arial';
            ctx.fillText(`Score: ${score}/${currentScenario}`, canvas.width / 2, 480);
        };
        
        const handleInput = (e) => {
            const key = e.key.toUpperCase();
            
            if (currentScenario >= scenarios.length) {
                if (key === ' ') {
                    document.removeEventListener('keydown', handleInput);
                    this.completeLevel(level);
                }
                return;
            }
            
            const scenario = scenarios[currentScenario];
            
            if (key === 'S' || key === 'L') {
                const userSaysScam = key === 'S';
                const correct = userSaysScam === scenario.isScam;
                
                if (correct) score++;
                
                // Show explanation
                ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = correct ? '#00ff00' : '#ff6600';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(correct ? '✅ CORRECT!' : '❌ INCORRECT', canvas.width / 2, 100);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '22px Arial';
                this.wrapText(ctx, scenario.explanation, canvas.width / 2, 170, canvas.width - 150, 35);
                
                if (scenario.redFlags.length > 0) {
                    ctx.fillStyle = '#ff6666';
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText('🚩 Red Flags:', canvas.width / 2, 300);
                    
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '18px Arial';
                    scenario.redFlags.forEach((flag, i) => {
                        ctx.fillText('• ' + flag, canvas.width / 2, 335 + (i * 30));
                    });
                }
                
                ctx.fillStyle = '#00ffff';
                ctx.font = 'bold 24px Arial';
                ctx.fillText('Press SPACE for next scenario', canvas.width / 2, 520);
                
                // Wait for space
                const spaceHandler = (e) => {
                    if (e.key === ' ') {
                        document.removeEventListener('keydown', spaceHandler);
                        currentScenario++;
                        renderScam();
                    }
                };
                document.addEventListener('keydown', spaceHandler);
            }
        };
        
        document.addEventListener('keydown', handleInput);
        renderScam();
    }
    
    showSwapGame(level) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        let step = 0;
        let fromToken = { name: 'ETH', amount: 1.0, icon: '💎' };
        let toToken = { name: 'USDC', amount: 0, icon: '💵' };
        let exchangeRate = 3500; // 1 ETH = 3500 USDC
        let slippage = 0.5;
        let gasFee = 15;
        
        const steps = [
            'Welcome to DEX Swap!\n\nDEX = Decentralized Exchange\nSwap tokens without middlemen using smart contracts.\n\nPress SPACE to start',
            'Step 1: Connect Wallet\n\nIn real life, you\'d click "Connect Wallet"\nand approve the connection in MetaMask or Phantom.\n\nPress SPACE to connect',
            'Step 2: Select Tokens\n\nChoose what you\'re swapping FROM and TO.\nWe\'ll swap 1 ETH for USDC!\n\nPress SPACE',
            'Step 3: Set Slippage Tolerance\n\nSlippage = price change during swap.\n0.5% means you accept up to 0.5% worse price.\nLower = safer but might fail. Higher = always works but riskier.\n\nPress SPACE',
            'Step 4: Review Transaction\n\nCheck everything carefully!\nExchange rate, gas fees, total you\'ll receive.\n\nPress SPACE to confirm',
            'Step 5: Approve Swap\n\nSmart contract needs permission to use your tokens.\nThis costs a small gas fee.\n\nPress SPACE to approve',
            'Step 6: Execute Swap\n\nNow do the actual swap!\nThis also costs gas. Total of 2 transactions!\n\nPress SPACE to swap',
            '🎉 Swap Complete!\n\nYou learned:\n✅ How DEX swaps work\n✅ Slippage protection\n✅ Gas fees for approvals\n✅ Always verify before confirming!\n\nPress SPACE to finish'
        ];
        
        const renderSwap = () => {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Title
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔄 Token Swap Academy 💱', canvas.width / 2, 50);
            
            // Instructions
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            this.wrapText(ctx, steps[step], canvas.width / 2, 100, canvas.width - 150, 32);
            
            // Swap interface (show from step 2 onwards)
            if (step >= 2) {
                // From token
                ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
                ctx.fillRect(200, 280, 800, 80);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
                ctx.strokeRect(200, 280, 800, 80);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '24px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('From:', 220, 310);
                ctx.font = 'bold 28px Arial';
                ctx.fillText(`${fromToken.icon} ${fromToken.amount} ${fromToken.name}`, 220, 345);
                
                // Swap arrow
                ctx.fillStyle = '#ffd700';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('↓', canvas.width / 2, 400);
                
                // To token
                ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
                ctx.fillRect(200, 420, 800, 80);
                ctx.strokeStyle = '#00ff00';
                ctx.strokeRect(200, 420, 800, 80);
                
                const receiveAmount = (fromToken.amount * exchangeRate * (1 - slippage / 100) - gasFee).toFixed(2);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '24px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('To:', 220, 450);
                ctx.font = 'bold 28px Arial';
                ctx.fillText(`${toToken.icon} ${receiveAmount} ${toToken.name}`, 220, 485);
            }
            
            // Show details at step 4
            if (step >= 4) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '16px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(`Exchange Rate: 1 ETH = ${exchangeRate} USDC`, 220, 525);
                ctx.fillText(`Slippage Tolerance: ${slippage}%`, 220, 550);
                ctx.fillText(`Gas Fee: ~$${gasFee} USDC`, 600, 525);
                ctx.fillText(`Total Received: ${((fromToken.amount * exchangeRate * (1 - slippage / 100)) - gasFee).toFixed(2)} USDC`, 600, 550);
            }
        };
        
        const handleInput = (e) => {
            if (e.key === ' ') {
                step++;
                if (step >= steps.length) {
                    document.removeEventListener('keydown', handleInput);
                    this.completeLevel(level);
                    return;
                }
                renderSwap();
            }
        };
        
        document.addEventListener('keydown', handleInput);
        renderSwap();
    }
    
    showNFTMint(level) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        let step = 0;
        let nft = {
            name: '',
            description: '',
            image: '🎨',
            attributes: [],
            minted: false
        };
        
        const steps = [
            'Welcome to NFT Minting!\n\nCreate your own unique digital collectible.\nYou\'ll mint it to the blockchain!\n\nPress SPACE to start',
            'Step 1: Create Your Art\n\nIn real life, you\'d upload an image file.\nFor this demo, we\'ll use an emoji art piece!\n\nPress SPACE',
            'Step 2: Add Metadata\n\nNFTs have properties stored on-chain:\n• Name\n• Description\n• Traits/Attributes\n\nPress SPACE',
            'Step 3: Choose Blockchain\n\nEthereum (expensive, most common)\nPolygon (cheap, growing)\nSolana (very cheap, fast)\n\nPress SPACE to choose Polygon',
            'Step 4: Pay Gas Fee\n\nMinting costs gas!\nEthereum: $50-200\nPolygon: $0.01-0.50\nSolana: $0.001\n\nPress SPACE to pay',
            'Step 5: Mint Transaction\n\nYour NFT is being written to the blockchain!\nThis creates a permanent, unique token that YOU own.\n\nPress SPACE',
            '🎉 NFT Minted!\n\nYour NFT is now on the blockchain!\nYou can:\n✅ View in wallet\n✅ List on marketplace\n✅ Transfer to others\n✅ Keep forever!\n\nPress SPACE to complete'
        ];
        
        const renderNFT = () => {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Title
            ctx.fillStyle = '#ff00ff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎨 NFT Minting Studio ✨', canvas.width / 2, 50);
            
            // Instructions
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            this.wrapText(ctx, steps[step], canvas.width / 2, 100, canvas.width - 150, 32);
            
            // Show NFT preview from step 1
            if (step >= 1) {
                // NFT Card
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(400, 280, 400, 280);
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 4;
                ctx.strokeRect(400, 280, 400, 280);
                
                // Art
                ctx.fillStyle = '#ffffff';
                ctx.font = '120px Arial';
                ctx.fillText('🎨', 600, 380);
                
                if (step >= 2) {
                    nft.name = 'Crypto Quest NFT #001';
                    nft.description = 'A unique collectible from your learning journey!';
                    
                    ctx.fillStyle = '#00ffff';
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText(nft.name, 600, 450);
                    
                    ctx.fillStyle = '#aaaaaa';
                    ctx.font = '14px Arial';
                    this.wrapText(ctx, nft.description, 600, 480, 350, 20);
                }
                
                if (step >= 3) {
                    ctx.fillStyle = '#ffd700';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText('Blockchain: Polygon', 420, 540);
                    ctx.fillText('Gas Fee: $0.15', 650, 540);
                }
            }
        };
        
        const handleInput = (e) => {
            if (e.key === ' ') {
                step++;
                if (step >= steps.length) {
                    document.removeEventListener('keydown', handleInput);
                    this.completeLevel(level);
                    return;
                }
                renderNFT();
            }
        };
        
        document.addEventListener('keydown', handleInput);
        renderNFT();
    }
    
    showBridgeGame(level) {
        // Simplified bridge simulation
        this.showStory(level);
    }
    
    showDeFiFarm(level) {
        // Simplified DeFi farming simulation
        this.showStory(level);
    }
    
    togglePause() {
        // Pause game logic
    }
    
    // LEVEL CONTENT GENERATORS
    getMoneyContent() {
        return {
            quiz: {
                question: "Why do humans use money instead of trading goods directly?",
                options: [
                    "Because money is shiny and fun to collect",
                    "To make trading easier - money is a common value everyone agrees on",
                    "Because banks force us to use it",
                    "Money doesn't really have a purpose"
                ],
                correct: 1,
                explanation: "Money makes trade easier! Instead of needing to find someone who wants exactly what you have AND has what you want (hard!), money lets us buy and sell anything easily. It's like a universal 'trading card' everyone accepts!"
            }
        };
    }
    
    getSatoshiContent() {
        return {
            story: "In 2008, a mysterious person (or group!) named Satoshi Nakamoto published a paper describing Bitcoin - the first cryptocurrency! Nobody knows who Satoshi really is - they disappeared in 2011 and have never been found. Some think Satoshi is one person, others believe it's a team of programmers. It's one of the internet's greatest mysteries! Satoshi created Bitcoin to give people a new kind of money that no government or bank controls.",
            funFact: "Satoshi owns about 1 million Bitcoin (worth billions!) but has never spent a single coin. This adds to the mystery!"
        };
    }
    
    getBlockchainContent() {
        return {
            story: "Imagine a notebook that EVERYONE can read, but NO ONE can erase or change what's written! That's a blockchain! Every time someone sends crypto, it gets written in this magic notebook as a 'block'. The blocks link together in a chain (blockchain!). Because everyone has a copy, no one can cheat. It's like having thousands of witnesses watching every transaction!",
            funFact: "The Bitcoin blockchain is over 400GB - that's like 100,000 songs worth of transaction data!"
        };
    }
    
    getMiningContent() {
        return {
            story: "Crypto mining is like being a detective solving super hard math puzzles! Miners use powerful computers to solve these puzzles. The first one to solve it gets to add the next 'block' of transactions to the blockchain AND receives new crypto coins as a reward! This is how new coins are created and how transactions get confirmed. It's called 'mining' because it's like digging for digital gold!",
            funFact: "Early Bitcoin miners could use regular laptops. Today, you need massive rooms full of special computers!"
        };
    }
    
    getBitcoinContent() {
        return {
            quiz: {
                question: "What makes Bitcoin special compared to regular money like dollars?",
                options: [
                    "It's digital and exists only on computers",
                    "No single person, company, or government controls it",
                    "Only 21 million Bitcoin will ever exist",
                    "All of the above!"
                ],
                correct: 3,
                explanation: "All of these make Bitcoin special! It's fully digital, decentralized (no one's in charge), and there's a limited supply. Regular money can be printed whenever governments want, but Bitcoin's supply is fixed forever. This scarcity is part of what gives it value!"
            }
        };
    }
    
    getEthereumContent() {
        return {
            story: "Ethereum is like Bitcoin's smart younger sibling! Created by Vitalik Buterin in 2015, Ethereum isn't just money - it's a 'world computer' that can run programs called 'smart contracts'. These are like automatic vending machines: put money in, and IF certain conditions are met, THEN something happens automatically. No middleman needed! This lets people build apps, games, and even entire virtual worlds on the blockchain.",
            funFact: "Vitalik was only 19 years old when he wrote the Ethereum whitepaper!"
        };
    }
    
    getLayer0Content() {
        return {
            story: "Think of blockchain like a house: Layer 0 is the FOUNDATION - the land and concrete base everything sits on! Layer 0 provides the basic infrastructure that different blockchains use to talk to each other. Projects like Polkadot and Cosmos are Layer 0 - they let different blockchains connect and share information. It's like the internet of blockchains! Without Layer 0, each blockchain would be an isolated island.",
            funFact: "Layer 0 protocols can host hundreds of different Layer 1 blockchains on top of them!"
        };
    }
    
    getLayer1Content() {
        return {
            quiz: {
                question: "What is a Layer 1 blockchain?",
                options: [
                    "The first crypto ever made",
                    "A main blockchain that processes and finalizes transactions",
                    "A type of crypto wallet",
                    "A mining machine"
                ],
                correct: 1,
                explanation: "Layer 1 is the BASE blockchain - like Bitcoin, Ethereum, or Solana. These are the main chains that process transactions and secure the network. They're like the main highways of the crypto world. Everything is verified and stored here!"
            }
        };
    }
    
    getLayer2Content() {
        return {
            story: "Imagine a busy restaurant (Layer 1 blockchain) where everyone waits in line to order. It's slow and expensive! Layer 2 is like adding a food truck outside that takes orders super fast and cheap, then batches them to send to the main kitchen. Layer 2 solutions like Lightning Network (Bitcoin) and Polygon (Ethereum) process transactions OFF the main chain, then bundle them together to record on the main chain later. This makes crypto MUCH faster and cheaper while keeping it secure!",
            funFact: "Layer 2 can process thousands of transactions per second, vs dozens on Layer 1!"
        };
    }
    
    getWalletContent() {
        return {
            story: "A crypto wallet is like a super secure digital backpack for your crypto! But here's the cool part: the wallet doesn't actually HOLD your crypto - the crypto stays on the blockchain. Your wallet holds special KEYS (like secret passwords) that prove you own that crypto. There are two types: HOT wallets (connected to internet, convenient) and COLD wallets (offline, more secure). NEVER share your 'seed phrase' (recovery words) - that's like giving someone the keys to your house!",
            funFact: "If you lose your seed phrase AND your wallet, your crypto is gone FOREVER! No one can recover it."
        };
    }
    
    getWalletCreationContent() {
        return {
            interactive: true,
            description: "Interactive wallet creation experience"
        };
    }
    
    getScamContent() {
        return {
            interactive: true,
            description: "Learn to spot scams, phishing, and rug pulls"
        };
    }
    
    getSwapContent() {
        return {
            interactive: true,
            description: "Learn how decentralized exchanges work"
        };
    }
    
    getNFTMintContent() {
        return {
            interactive: true,
            description: "Mint your first NFT"
        };
    }
    
    getBridgeContent() {
        return {
            story: "Blockchain bridges are like magical portals between different blockchain worlds! Have ETH on Ethereum but want to use a cheap Layer 2 like Arbitrum? Use a bridge! Bridges lock your tokens on one chain and mint equivalent ones on another. When you come back, they unlock your original tokens. It's how you move assets between Ethereum, Polygon, Avalanche, etc. But WARNING: bridges can be hacked because they hold lots of value. Only use trusted, audited bridges!",
            funFact: "Over $2 BILLION has been stolen from bridge hacks! Always use official, well-known bridges."
        };
    }
    
    getYieldFarmContent() {
        return {
            story: "Yield farming is like being a crypto farmer! You provide liquidity (deposit tokens) to DeFi protocols, and they pay you interest + rewards. How? When you deposit into a liquidity pool (like ETH-USDC), traders use that pool to swap tokens and pay fees. You get a share of those fees! Plus many protocols give you their tokens as rewards. It's how people earn 5-50%+ APY! But risks: impermanent loss (prices change), smart contract bugs, and rug pulls. Never farm with money you can't afford to lose!",
            funFact: "Some yield farms offer 1000%+ APY but are usually scams or will crash quickly. Sustainable yields are usually 5-20%."
        };
    }
    
    getNFTContent() {
        return {
            story: "NFT stands for Non-Fungible Token - a fancy way of saying 'one-of-a-kind digital item'! While Bitcoin or dollars are 'fungible' (one dollar equals another dollar), NFTs are unique. Think of them like digital trading cards, art, or even concert tickets. Each NFT has a unique code on the blockchain proving WHO owns it. You can own digital art, music, videos, game items, or even virtual land! It's proof of ownership for digital stuff.",
            funFact: "The most expensive NFT ever sold for $69 MILLION! It was digital art by an artist called Beeple."
        };
    }
    
    getDeFiContent() {
        return {
            quiz: {
                question: "What does DeFi (Decentralized Finance) mean?",
                options: [
                    "Digital money for buying games",
                    "Banking without banks - smart contracts handle everything",
                    "A type of cryptocurrency",
                    "Definitely finding iron"
                ],
                correct: 1,
                explanation: "DeFi lets you do banking stuff (save, borrow, lend, trade) without traditional banks! Smart contracts handle everything automatically. You can earn interest on your crypto, get loans, or trade - all peer-to-peer. It's like if apps replaced banks!"
            }
        };
    }
    
    getGasContent() {
        return {
            story: "Gas fees are like paying for gas in a car - they're the cost to 'fuel' your transaction on the blockchain! When you send crypto or interact with smart contracts, miners/validators need to be paid for using their computers to process and verify your transaction. When the blockchain is busy (lots of people trying to transact), gas fees go UP. When it's quiet, they're cheaper. It's supply and demand! Layer 2 solutions help make gas fees much cheaper.",
            funFact: "During busy times, Ethereum gas fees have cost over $100 just to move $10 worth of crypto!"
        };
    }
    
    getStakingContent() {
        return {
            story: "Staking is like putting money in a savings account that helps secure the blockchain! Instead of mining (solving puzzles), some blockchains use 'Proof of Stake' - you 'stake' (lock up) your crypto to help validate transactions. In return, you earn rewards - more crypto! It's like getting interest at a bank, but you're also helping the network stay secure. The more you stake, the more you can earn. But be careful - your crypto is locked up for a while!",
            funFact: "Ethereum switched from mining to staking in 2022, reducing its energy use by 99.95%!"
        };
    }
    
    getSecurityContent() {
        return {
            quiz: {
                question: "What's the MOST important rule for keeping your crypto safe?",
                options: [
                    "Never tell anyone your seed phrase or private keys",
                    "Only use crypto on Tuesdays",
                    "Keep all your crypto on exchanges",
                    "Write your password on a sticky note"
                ],
                correct: 0,
                explanation: "NEVER EVER share your seed phrase (recovery words) or private keys! They're like the master key to ALL your crypto. Not even crypto company support teams should ask for them. If someone gets these, they can steal EVERYTHING. Keep them written down somewhere safe, offline, and NEVER type them into websites or apps!"
            }
        };
    }
    
    getMarketContent() {
        return {
            story: "In crypto, we talk about 'bulls' and 'bears'! A BULL MARKET is when prices are going UP - everyone's excited and optimistic (like a bull charging forward). A BEAR MARKET is when prices are going DOWN - people are scared and pessimistic (like a bear hibernating). Markets go in cycles - sometimes up, sometimes down. Smart investors know that BOTH are normal and part of crypto! The key is to learn, be patient, and never invest more than you can afford to lose.",
            funFact: "Bitcoin has had multiple 80%+ crashes, but has always recovered to reach new highs eventually!"
        };
    }
    
    getWeb3Content() {
        return {
            story: "Web3 is the next evolution of the internet! Web1 was read-only (just looking at websites), Web2 is read-write (social media, posting content), and Web3 is read-write-OWN! In Web3, YOU own your data, digital items, and content - not big companies. It's built on blockchain, so it's decentralized. Imagine a Facebook where YOU own your posts, a game where YOU truly own your items, or music where artists get paid directly without middlemen. That's Web3!",
            funFact: "In Web3, your crypto wallet is your identity - one login for everything!"
        };
    }
    
    getDAOContent() {
        return {
            quiz: {
                question: "What is a DAO (Decentralized Autonomous Organization)?",
                options: [
                    "A new type of cryptocurrency",
                    "An organization run by code and voted on by members, not bosses",
                    "A crypto mining machine",
                    "Digital Art Online"
                ],
                correct: 1,
                explanation: "A DAO is like a club where EVERYONE gets to vote on decisions! Instead of a CEO or board making all the choices, DAOs use smart contracts and token holders vote on everything. It's democracy meets blockchain! DAOs can pool money together, invest, build products, or even buy things collectively (like a sports team!)."
            }
        };
    }
    
    getMetaverseContent() {
        return {
            story: "The Metaverse is a virtual world where you can hang out, play, work, and own stuff - all online! Think of it like a video game mixed with the internet, powered by crypto and blockchain. In the Metaverse, you can buy virtual land (as NFTs), attend concerts, go to school, meet friends, and play games. Your avatar is YOU, and you truly OWN your digital items because they're on the blockchain. Companies like Meta (Facebook) and games like Decentraland are building the Metaverse right now!",
            funFact: "Virtual land in the Metaverse has sold for MILLIONS of dollars!"
        };
    }
    
    getFinalContent() {
        return {
            quiz: {
                question: "Which of these is TRUE about the future of crypto and finance?",
                options: [
                    "Crypto might become as common as using credit cards",
                    "Blockchain could change how we vote, own property, and share data",
                    "We're still in the early days - like the internet in the 1990s",
                    "All of the above could happen!"
                ],
                correct: 3,
                explanation: "You've mastered crypto! All of these are possible futures. Crypto and blockchain are still very new technologies. Just like the internet changed everything over the past 30 years, crypto and Web3 could reshape money, ownership, and how we interact online. The future is being built right now, and now YOU understand it! Congratulations, Crypto Master! 🎉"
            }
        };
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.cryptoQuest = new CryptoQuestGame();
});

function closeInfo() {
    document.getElementById('infoPanel').style.display = 'none';
}
