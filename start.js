// Simple start script for Render deployment
const path = require('path');

console.log('Starting Attendance System...');
console.log('Current directory:', __dirname);

// Change to backend directory and require server
process.chdir(path.join(__dirname, 'backend'));
console.log('Changed to backend directory');

// Require the server file directly
try {
    require('./backend/server.js');
} catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
}