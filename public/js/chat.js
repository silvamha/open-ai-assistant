class ChatManager {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageForm = document.getElementById('messageForm');
        this.messageInput = document.getElementById('messageInput');
        this.clearButton = document.getElementById('clearChat');
        this.userId = 'default-user'; // In a real app, this would come from authentication
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        // Load conversations from MongoDB
        await this.loadConversations();
        
        // Add event listeners
        this.messageForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.clearButton.addEventListener('click', () => this.clearChat());
        this.messageInput.addEventListener('input', () => this.adjustTextareaHeight());
        
        // Handle enter key
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.messageForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        const message = this.messageInput.value.trim();
        
        if (!message || this.isLoading) return;

        try {
            this.setLoading(true);

            // Add user message
            this.addMessage('user', message);
            this.messageInput.value = '';
            this.adjustTextareaHeight();

            // Send message to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message,
                    userId: this.userId
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            // Add assistant message
            this.addMessage('assistant', data.response);
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    addMessage(role, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role);
        
        // Add timestamp
        const timestamp = new Date().toLocaleTimeString();
        const timeElement = document.createElement('div');
        timeElement.classList.add('timestamp');
        timeElement.textContent = timestamp;
        
        // Add content
        const contentElement = document.createElement('div');
        contentElement.classList.add('content');
        contentElement.textContent = content;
        
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
        
        this.chatContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    async loadConversations() {
        try {
            const response = await fetch(`/api/conversations/${this.userId}`);
            if (!response.ok) throw new Error('Failed to load conversations');
            
            const conversations = await response.json();
            
            this.chatContainer.innerHTML = '';
            conversations.forEach(conversation => {
                conversation.messages.forEach(message => {
                    this.addMessage(message.role, message.content);
                });
            });
            
            this.scrollToBottom();
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    async clearChat() {
        try {
            this.chatContainer.innerHTML = '';
            // In a real app, you'd delete the conversation from MongoDB here
        } catch (error) {
            console.error('Error clearing chat:', error);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const submitButton = this.messageForm.querySelector('button[type="submit"]');
        submitButton.disabled = loading;
        submitButton.textContent = loading ? 'Sending...' : 'Send';
        
        if (loading) {
            const loadingMessage = document.createElement('div');
            loadingMessage.classList.add('message', 'assistant', 'loading');
            loadingMessage.textContent = 'Thinking...';
            this.chatContainer.appendChild(loadingMessage);
            this.scrollToBottom();
        } else {
            const loadingMessage = this.chatContainer.querySelector('.loading');
            if (loadingMessage) {
                loadingMessage.remove();
            }
        }
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    }
}

// Initialize chat manager
new ChatManager();
