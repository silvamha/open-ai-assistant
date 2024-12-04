const app = require('./app');
const config = require('./config/config');

const PORT = config.server.port;

// Handle server errors gracefully
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Trying port ${PORT + 1}`);
        app.listen(PORT + 1);
    } else {
        console.error('Server error:', err);
    }
});
