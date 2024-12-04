require('dotenv').config();

module.exports = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4'
    },
    server: {
        port: process.env.PORT || 3000
    }
};
