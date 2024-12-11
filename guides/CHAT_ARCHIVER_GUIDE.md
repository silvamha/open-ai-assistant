# Chat History Archiver Project Guide

## Project Overview
A Node.js application that takes chat session JSON data, converts it to HTML for easy viewing, and optionally stores in MongoDB. This allows frontend AI agents to access previous conversation context through a simple HTML page.

## Project Structure
```
chat-archiver/
├── package.json
├── server.js
├── public/
│   └── sessions/        # Generated HTML files go here
├── src/
│   ├── archiver.js      # HTML generation logic
│   └── db-manager.js    # MongoDB integration (optional)
└── README.md
```

## Step 1: Project Setup
```bash
mkdir chat-archiver
cd chat-archiver
npm init -y
npm install express mongodb
```

## Step 2: JSON Structure
```javascript
// Example chat session JSON structure
{
  "sessionInfo": {
    "date": "2024-02-XX",
    "sessionId": "unique-id",
    "topic": "sound-engineering-session-1"
  },
  "conversations": [
    {
      "timestamp": "ISO-timestamp",
      "speaker": "user/assistant",
      "content": "message",
      "context": {
        "topic": "mixing",
        "references": ["previous-session-id"],
        "tags": ["eq", "compression", "vocals"]
      }
    }
  ],
  "summary": {
    "keyPoints": [],
    "decisions": [],
    "nextSteps": []
  }
}
```

## Step 3: Core Files Implementation

### server.js
```javascript
const express = require('express');
const path = require('path');
const ChatArchiver = require('./src/archiver');
const DBManager = require('./src/db-manager');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Save chat session endpoint
app.post('/save-session', async (req, res) => {
    try {
        const jsonData = req.body;
        const htmlFile = ChatArchiver.saveToHTML(jsonData);
        
        // Optional: Save to MongoDB
        // await DBManager.saveSession(jsonData);
        
        res.json({ 
            success: true, 
            htmlUrl: `/sessions/${htmlFile}`,
            message: 'Session saved and HTML generated'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### src/archiver.js
```javascript
const fs = require('fs');
const path = require('path');

class ChatArchiver {
    static saveToHTML(jsonData) {
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Session: ${jsonData.sessionInfo.topic}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        .chat-container { 
                            max-width: 800px; 
                            margin: 20px auto;
                            padding: 20px;
                        }
                        .message { 
                            padding: 15px;
                            margin: 10px 0;
                            border-radius: 8px;
                        }
                        .user { 
                            background: #e3f2fd;
                            margin-left: 20px;
                        }
                        .assistant { 
                            background: #f5f5f5;
                            margin-right: 20px;
                        }
                        .metadata {
                            font-size: 0.8em;
                            color: #666;
                            margin-top: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="chat-container">
                        <h1>${jsonData.sessionInfo.topic}</h1>
                        <div class="metadata">
                            Session Date: ${jsonData.sessionInfo.date}<br>
                            Session ID: ${jsonData.sessionInfo.sessionId}
                        </div>
                        ${jsonData.conversations.map(msg => `
                            <div class="message ${msg.speaker}">
                                <strong>${msg.speaker}</strong>
                                <p>${msg.content}</p>
                                ${msg.context ? `
                                    <div class="metadata">
                                        Topics: ${msg.context.tags.join(', ')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                        ${jsonData.summary ? `
                            <div class="summary">
                                <h2>Summary</h2>
                                <h3>Key Points</h3>
                                <ul>${jsonData.summary.keyPoints.map(point => `<li>${point}</li>`).join('')}</ul>
                                <h3>Next Steps</h3>
                                <ul>${jsonData.summary.nextSteps.map(step => `<li>${step}</li>`).join('')}</ul>
                            </div>
                        ` : ''}
                    </div>
                </body>
            </html>
        `;
        
        const filename = `session-${jsonData.sessionInfo.sessionId}.html`;
        const filePath = path.join(__dirname, '..', 'public', 'sessions', filename);
        
        // Ensure sessions directory exists
        const dir = path.join(__dirname, '..', 'public', 'sessions');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, html);
        return filename;
    }
}

module.exports = ChatArchiver;
```

### src/db-manager.js (Optional MongoDB Integration)
```javascript
const { MongoClient } = require('mongodb');

class DBManager {
    static async saveSession(jsonData) {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db('chat-sessions');
        await db.collection('sessions').insertOne(jsonData);
        client.close();
    }

    static async getSessionByTopic(topic) {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db('chat-sessions');
        const session = await db.collection('sessions')
            .find({ 'sessionInfo.topic': topic })
            .toArray();
        client.close();
        return session;
    }
}

module.exports = DBManager;
```

## Usage Instructions

1. **Setup**
   - Create new directory and initialize project
   - Install dependencies
   - Copy core files into appropriate directories

2. **Running the Server**
   ```bash
   node server.js
   ```

3. **Sending Chat Data**
   ```javascript
   // Example API call
   fetch('http://localhost:3000/save-session', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json'
       },
       body: JSON.stringify(chatSessionData)
   })
   .then(response => response.json())
   .then(data => {
       // data.htmlUrl contains the URL to view the chat
       console.log('Chat archived:', data.htmlUrl);
   });
   ```

4. **Viewing Chat History**
   - Access generated HTML files at: `http://localhost:3000/sessions/[filename]`

## Optional Enhancements
1. Add authentication for API endpoints
2. Implement search functionality across sessions
3. Add real-time chat archiving
4. Create a session browser interface
5. Add export functionality for different formats

## Notes
- Keep the JSON structure consistent
- HTML files are generated in `public/sessions/`
- MongoDB integration is optional
- Consider adding rate limiting for production use
- Add error handling as needed

Remember to create appropriate error handling and input validation before deploying to production.
