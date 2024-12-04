const express = require('express');
const cors = require('cors');
const path = require('path');
const assistantService = require('./services/assistant');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Create a new thread for each conversation
        const thread = await assistantService.createThread();
        
        // Add the user's message to the thread
        await assistantService.addMessage(thread.id, message);
        
        // Run the assistant
        await assistantService.runAssistant(thread.id);
        
        // Get the assistant's response
        const response = await assistantService.getResponse(thread.id);
        
        res.json({ response, threadId: thread.id });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

module.exports = app;
