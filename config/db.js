// 🔹 Load environment variables from .env
require('dotenv').config();

const mysql = require('mysql2');

// 🔹 Debug environment variables
console.log('=== DB Environment Variables ===');
console.log('DB_HOST:', process.env.DB_HOST || 'MISSING');
console.log('DB_USER:', process.env.DB_USER || 'MISSING');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*****' : 'MISSING');
console.log('DB_NAME:', process.env.DB_NAME || 'MISSING');
console.log('================================');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('DB connection failed:', err);
        return;
    }
    console.log('MySQL Connected');
});

module.exports = db;
