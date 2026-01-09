const mysql = require('mysql2');
require('dotenv').config();

let db;

function handleDisconnect() {
    db = mysql.createConnection({
        host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST, // force IPv4
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    db.connect(err => {
        if (err) {
            console.error('DB connection failed:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('MySQL Connected');
        }
    });

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

handleDisconnect();

module.exports = db;
