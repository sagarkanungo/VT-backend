const mysql = require('mysql2');

// 🔹 Use Hostinger environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // max concurrent connections
  queueLimit: 0
});

// Use promise-based queries (better for async/await)
const db = pool.promise();

module.exports = db;
