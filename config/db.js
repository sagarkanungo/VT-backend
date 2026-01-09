const mysql = require('mysql2');
require('dotenv').config();

const dbHost = process.env.DB_HOST;

// Force IPv4 if 'localhost' is used
const hostToUse = (dbHost === 'localhost') ? '127.0.0.1' : dbHost;

const db = mysql.createConnection({
    host: hostToUse,
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
