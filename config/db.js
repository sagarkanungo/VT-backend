// Load environment variables
require('dotenv').config();

const mysql = require('mysql2');

// Debug environment variables
console.log('=== DB Environment Variables ===');
console.log('DB_HOST:', process.env.DB_HOST || 'MISSING');
console.log('DB_USER:', process.env.DB_USER || 'MISSING');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*****' : 'MISSING');
console.log('DB_NAME:', process.env.DB_NAME || 'MISSING');
console.log('================================');

let db;

function handleDisconnect() {
    db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    db.connect(err => {
        if (err) {
            console.error('DB connection failed:', err);
            // Retry after 2 seconds
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('MySQL Connected');
        }
    });

    // Reconnect on errors
    db.on('error', err => {
        console.error('DB error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
            console.log('Reconnecting to MySQL...');
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

// Initialize connection
handleDisconnect();

module.exports = db;
