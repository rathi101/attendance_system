// Simple start script for Render deployment
const path = require('path');
const { spawn } = require('child_process');

console.log('Starting Attendance System...');
console.log('Current directory:', __dirname);
console.log('Backend path:', path.join(__dirname, 'backend'));

// Change to backend directory and start server
process.chdir(path.join(__dirname, 'backend'));
const server = spawn('node', ['server.js'], { stdio: 'inherit' });

server.on('error', (err) => {
    console.error('Failed to start server:', err);
});

server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});