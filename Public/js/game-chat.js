/**
 * Game Chat Component
 * In-game chat with quick messages, emojis, and GG button
 * Part of the 9DTTT Game Library
 */

class GameChat {
    constructor(options = {}) {
        this.containerId = options.containerId || 'game-chat';
        this.onSendMessage = options.onSendMessage || null;
        this.playerName = options.playerName || 'Player';
        this.isMultiplayer = options.isMultiplayer || false;
        this.messages = [];
        this.isMinimized = false;
        
        // Quick chat messages
        this.quickMessages = [
            { text: 'Good luck!', emoji: '🍀' },
            { text: 'Nice move!', emoji: '👏' },
            { text: 'Oops!', emoji: '😅' },
            { text: 'Thinking...', emoji: '🤔' },
            { text: 'Your turn!', emoji: '👉' },
            { text: 'Thanks!', emoji: '🙏' }
        ];
        
        // Emoji picker options
        this.emojis = ['😀', '😂', '🎉', '👍', '👎', '❤️', '🔥', '⭐', '💪', '🤝', '😎', '🙌'];
        
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = this.createChatHTML();
        this.attachEventListeners();
    }

    createChatHTML() {
        return `
            <div class="chat-widget ${this.isMinimized ? 'minimized' : ''}">
                <div class="chat-header" id="chat-header">
                    <span class="chat-title">💬 Chat</span>
                    <button class="chat-toggle" id="chat-toggle" aria-label="Toggle chat">
                        <span class="toggle-icon">−</span>
                    </button>
                </div>
                
                <div class="chat-body" id="chat-body">
                    <div class="chat-messages" id="chat-messages" role="log" aria-live="polite">
                        <div class="chat-welcome">
                            Welcome to the game! Say hi! 👋
                        </div>
                    </div>
                    
                    <div class="quick-actions">
                        <button class="gg-btn" id="gg-btn" aria-label="Say Good Game">
                            🎮 GG
                        </button>
                        <button class="emoji-toggle" id="emoji-toggle" aria-label="Toggle emoji picker">
                            😀
                        </button>
                    </div>
                    
                    <div class="emoji-picker" id="emoji-picker" style="display: none;">
                        ${this.emojis.map(e => `<button class="emoji-btn" data-emoji="${e}">${e}</button>`).join('')}
                    </div>
                    
                    <div class="quick-messages" id="quick-messages">
                        ${this.quickMessages.map(m => 
                            `<button class="quick-msg-btn" data-message="${m.text}">${m.emoji} ${m.text}</button>`
                        ).join('')}
                    </div>
                    
                    <div class="chat-input-area">
                        <input type="text" 
                               class="chat-input" 
                               id="chat-input" 
                               placeholder="Type a message..." 
                               maxlength="200"
                               aria-label="Chat message input">
                        <button class="send-btn" id="send-btn" aria-label="Send message">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Toggle chat
        document.getElementById('chat-toggle')?.addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        // Send message
        document.getElementById('send-btn')?.addEventListener('click', () => {
            this.sendCurrentMessage();
        });
        
        document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendCurrentMessage();
            }
        });
        
        // GG button
        document.getElementById('gg-btn')?.addEventListener('click', () => {
            this.sendMessage('Good Game! 🎮', 'gg');
        });
        
        // Emoji toggle
        document.getElementById('emoji-toggle')?.addEventListener('click', () => {
            const picker = document.getElementById('emoji-picker');
            if (picker) {
                picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
            }
        });
        
        // Emoji buttons
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('chat-input');
                if (input) {
                    input.value += btn.dataset.emoji;
                    input.focus();
                }
            });
        });
        
        // Quick message buttons
        document.querySelectorAll('.quick-msg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sendMessage(btn.dataset.message, 'quick');
            });
        });
    }

    toggleMinimize() {
        const widget = document.querySelector('.chat-widget');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (widget) {
            this.isMinimized = !this.isMinimized;
            widget.classList.toggle('minimized', this.isMinimized);
            if (toggleIcon) {
                toggleIcon.textContent = this.isMinimized ? '+' : '−';
            }
        }
    }

    sendCurrentMessage() {
        const input = document.getElementById('chat-input');
        if (input && input.value.trim()) {
            this.sendMessage(input.value.trim(), 'text');
            input.value = '';
        }
    }

    sendMessage(text, type = 'text') {
        if (!text) return;
        
        const message = {
            id: Date.now(),
            text,
            type,
            sender: this.playerName,
            timestamp: new Date().toISOString(),
            isOwn: true
        };
        
        this.addMessage(message);
        
        // Callback for multiplayer
        if (this.onSendMessage) {
            this.onSendMessage(message);
        }
    }

    receiveMessage(message) {
        message.isOwn = false;
        this.addMessage(message);
    }

    addMessage(message) {
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${message.isOwn ? 'own' : 'other'} ${message.type}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        msgEl.innerHTML = `
            <span class="msg-sender">${message.isOwn ? 'You' : this.escapeHtml(message.sender)}</span>
            <span class="msg-text">${this.escapeHtml(message.text)}</span>
            <span class="msg-time">${time}</span>
        `;
        
        container.appendChild(msgEl);
    }

    scrollToBottom() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    escapeHtml(text) {
        return text.replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    clearMessages() {
        this.messages = [];
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = '<div class="chat-welcome">Welcome to the game! Say hi! 👋</div>';
        }
    }
}

// Export for use in games
window.GameChat = GameChat;
