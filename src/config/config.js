require('dotenv').config();

module.exports = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini-2024-07-18'
    },
    server: {
        port: process.env.PORT || 3000
    }
};
