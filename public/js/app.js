// This file is for any additional app-wide functionality
// Currently, it's a placeholder for future features

// Chat history management
const chatStorage = {
    save: (message, isUser = true) => {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        history.push({
            content: message,
            timestamp: new Date().toISOString(),
            speaker: isUser ? 'user' : 'assistant',
            sessionId: chatStorage.getCurrentSessionId()
        });
        localStorage.setItem('chatHistory', JSON.stringify(history));
    },

    load: () => {
        return JSON.parse(localStorage.getItem('chatHistory') || '[]');
    },

    getCurrentSessionId: () => {
        let sessionId = localStorage.getItem('currentSessionId');
        if (!sessionId) {
            sessionId = new Date().toISOString();
            localStorage.setItem('currentSessionId', sessionId);
        }
        return sessionId;
    },

    clearCurrentSession: () => {
        localStorage.removeItem('currentSessionId');
        localStorage.removeItem('chatHistory');
    }
};

// Message display function
function displayMessage(content, isUser) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error('Chat messages container not found!');
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = content;
    
    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) {
        console.error('Message input not found!');
        return;
    }

    const message = messageInput.value.trim();
    if (message) {
        try {
            // Save and display user message
            chatStorage.save(message, true);
            displayMessage(message, true);
            messageInput.value = '';
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Save and display assistant response
            chatStorage.save(data.response, false);
            displayMessage(data.response, false);
            
        } catch (error) {
            console.error('Error:', error);
            displayMessage('Sorry, there was an error processing your request. ' + error.message, false);
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load chat history
    try {
        const history = chatStorage.load();
        const currentSessionId = chatStorage.getCurrentSessionId();
        
        history
            .filter(msg => msg.sessionId === currentSessionId)
            .forEach(msg => displayMessage(msg.content, msg.speaker === 'user'));
    } catch (error) {
        console.error('Error loading chat history:', error);
    }

    // Set up event listeners
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const clearButton = document.getElementById('clearChat');

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (sendButton) {
        sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            chatStorage.clearCurrentSession();
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = '';
            }
        });
    }
});
