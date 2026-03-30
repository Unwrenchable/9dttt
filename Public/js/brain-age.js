/**
 * Brain Age Training - DS Style Brain Games Collection
 */
class BrainAgeTraining {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentGame = null;
        this.gamesCompleted = [];
        this.totalScore = 0;
        this.startTime = null;
        this.currentProblem = 0;
        this.totalProblems = 20;
        this.answers = [];
    }
    
    // Calculation 20 - Solve 20 math problems as fast as possible
    startCalculation20() {
        this.problems = [];
        for (let i = 0; i < 20; i++) {
            let a = Math.floor(Math.random() * 20) + 1;
            let b = Math.floor(Math.random() * 20) + 1;
            const ops = ['+', '-', '×'];
            const op = ops[Math.floor(Math.random() * ops.length)];
            
            let answer;
            switch(op) {
                case '+': answer = a + b; break;
                case '-': 
                    if (a < b) [a, b] = [b, a];
                    answer = a - b;
                    break;
                case '×': answer = a * b; break;
            }
            
            this.problems.push({
                question: `${a} ${op} ${b}`,
                answer: answer
            });
        }
        
        this.currentProblem = 0;
        this.currentGame = 'calculation';
        this.startTime = Date.now();
        this.drawCalculationProblem();
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'answerInput';
        input.style.cssText = 'width: 100%; padding: 15px; font-size: 32px; text-align: center; margin: 10px 0; border: 3px solid #667eea; border-radius: 10px;';
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
        
        document.getElementById('gameControls').innerHTML = '';
        document.getElementById('gameControls').appendChild(input);
        input.focus();
    }
    
    drawCalculationProblem() {
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const problem = this.problems[this.currentProblem];
        
        // Draw problem number
        this.ctx.fillStyle = '#999';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `Problem ${this.currentProblem + 1} / ${this.totalProblems}`,
            this.canvas.width / 2,
            40
        );
        
        // Draw problem
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 72px Arial';
        this.ctx.fillText(
            problem.question,
            this.canvas.width / 2,
            150
        );
        
        // Draw equals sign
        this.ctx.font = 'bold 48px Arial';
        this.ctx.fillText('=', this.canvas.width / 2, 220);
    }
    
    checkCalculationAnswer() {
        const input = document.getElementById('answerInput');
        const userAnswer = parseInt(input.value);
        const correctAnswer = this.problems[this.currentProblem].answer;
        
        if (userAnswer === correctAnswer) {
            this.currentProblem++;
            
            if (this.currentProblem >= this.totalProblems) {
                const totalTime = Date.now() - this.startTime;
                const seconds = (totalTime / 1000).toFixed(1);
                const brainAge = Math.max(20, Math.min(80, Math.floor(seconds * 2)));
                
                this.displayResult('Calculation 20', seconds + 's', brainAge);
            } else {
                this.drawCalculationProblem();
                input.value = '';
                input.focus();
            }
        } else {
            // Show wrong answer shake
            input.style.borderColor = '#f00';
            setTimeout(() => {
                input.style.borderColor = '#667eea';
            }, 500);
        }
    }
    
    // Stroop Test - Color naming
    startStroopTest() {
        this.stroopProblems = [];
        const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];
        const colorCodes = {
            'RED': '#ff0000',
            'BLUE': '#0000ff',
            'GREEN': '#00ff00',
            'YELLOW': '#ffff00',
            'PURPLE': '#ff00ff',
            'ORANGE': '#ff8800'
        };
        
        for (let i = 0; i < 20; i++) {
            const word = colors[Math.floor(Math.random() * colors.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.stroopProblems.push({
                word: word,
                color: colorCodes[color],
                correctAnswer: color
            });
        }
        
        this.currentProblem = 0;
        this.startTime = Date.now();
        this.drawStroopProblem();
        
        const controls = document.getElementById('gameControls');
        controls.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 20px 0;">
                ${colors.map(c => `
                    <button onclick="checkStroopAnswer('${c}')" 
                        style="padding: 15px; font-size: 16px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; border: none; border-radius: 8px; cursor: pointer;">
                        ${c}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    drawStroopProblem() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const problem = this.stroopProblems[this.currentProblem];
        
        // Instructions
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('What COLOR is this word?', this.canvas.width / 2, 40);
        
        // Problem number
        this.ctx.fillStyle = '#999';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(
            `${this.currentProblem + 1} / 20`,
            this.canvas.width / 2,
            70
        );
        
        // Word in color
        this.ctx.fillStyle = problem.color;
        this.ctx.font = 'bold 64px Arial';
        this.ctx.fillText(problem.word, this.canvas.width / 2, 170);
    }
    
    checkStroopAnswerFunc(answer) {
        const correct = this.stroopProblems[this.currentProblem].correctAnswer;
        
        if (answer === correct) {
            this.currentProblem++;
            
            if (this.currentProblem >= 20) {
                const totalTime = Date.now() - this.startTime;
                const seconds = (totalTime / 1000).toFixed(1);
                const brainAge = Math.max(20, Math.min(80, Math.floor(seconds * 1.5)));
                
                this.displayResult('Stroop Test', seconds + 's', brainAge);
            } else {
                this.drawStroopProblem();
            }
        }
    }
    
    // Number Memory
    startNumberMemory() {
        const digits = 5 + Math.floor(Math.random() * 5);
        let numberString = '';
        for (let i = 0; i < digits; i++) {
            numberString += Math.floor(Math.random() * 10);
        }
        
        this.memorizeNumber = numberString;
        this.currentGame = 'counting';
        this.startTime = Date.now();
        
        // Show number
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Memorize this number:', this.canvas.width / 2, 80);
        
        this.ctx.font = 'bold 48px monospace';
        this.ctx.fillText(numberString, this.canvas.width / 2, 150);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#999';
        this.ctx.fillText('Number will disappear in 5 seconds...', this.canvas.width / 2, 220);
        
        setTimeout(() => {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText('What was the number?', this.canvas.width / 2, 100);
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'memoryInput';
            input.maxLength = numberString.length;
            input.style.cssText = 'width: 100%; padding: 15px; font-size: 32px; text-align: center; margin: 10px 0; border: 3px solid #667eea; border-radius: 10px; letter-spacing: 5px;';
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') checkAnswer();
            });
            
            document.getElementById('gameControls').innerHTML = '';
            document.getElementById('gameControls').appendChild(input);
            input.focus();
        }, 5000);
    }
    
    checkNumberMemory() {
        const input = document.getElementById('memoryInput');
        const userAnswer = input.value;
        
        if (userAnswer === this.memorizeNumber) {
            const totalTime = Date.now() - this.startTime;
            const seconds = (totalTime / 1000).toFixed(1);
            const brainAge = Math.max(20, Math.min(80, 60 - this.memorizeNumber.length * 2));
            
            this.displayResult('Number Memory', this.memorizeNumber.length + ' digits', brainAge);
        } else {
            alert('Incorrect! The number was: ' + this.memorizeNumber);
            document.getElementById('gameArea').style.display = 'none';
            document.getElementById('menu').style.display = '';
            brainGame = new BrainAgeTraining();
        }
    }
    
    displayResult(gameName, performance, brainAge) {
        document.getElementById('brainAge').textContent = brainAge;
        
        this.ctx.fillStyle = '#f0f8ff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('COMPLETE!', this.canvas.width / 2, 60);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(gameName, this.canvas.width / 2, 100);
        
        this.ctx.font = 'bold 36px Arial';
        this.ctx.fillStyle = '#667eea';
        this.ctx.fillText(performance, this.canvas.width / 2, 150);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Your Brain Age:', this.canvas.width / 2, 200);
        
        this.ctx.font = 'bold 64px Arial';
        this.ctx.fillStyle = brainAge < 40 ? '#0f0' : brainAge < 60 ? '#ff0' : '#f00';
        this.ctx.fillText(brainAge, this.canvas.width / 2, 270);
        
        document.getElementById('gameControls').innerHTML = '<p style="text-align: center; margin: 20px 0;">Press ◄ to return to menu</p>';
        
        // Update stats
        this.gamesCompleted.push({ game: gameName, brainAge: brainAge });
        document.getElementById('stats').style.display = 'grid';
        document.getElementById('gamesPlayed').textContent = this.gamesCompleted.length;
        
        const avgAge = Math.floor(
            this.gamesCompleted.reduce((sum, g) => sum + g.brainAge, 0) / this.gamesCompleted.length
        );
        document.getElementById('totalScore').textContent = avgAge;
    }
}

let brainGame = new BrainAgeTraining();

function loadBrainGame(type) {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    
    switch(type) {
        case 'calculation':
            brainGame.startCalculation20();
            break;
        case 'stroop':
            brainGame.startStroopTest();
            break;
        case 'counting':
            brainGame.startNumberMemory();
            break;
        default:
            alert('Coming soon!');
            document.getElementById('gameArea').style.display = 'none';
            document.getElementById('menu').style.display = '';
            brainGame = new BrainAgeTraining();
    }
}

function checkAnswer() {
    if (brainGame.currentGame === 'calculation') {
        brainGame.checkCalculationAnswer();
    } else if (brainGame.currentGame === 'counting') {
        brainGame.checkNumberMemory();
    }
}

function checkStroopAnswer(answer) {
    brainGame.checkStroopAnswerFunc(answer);
}
