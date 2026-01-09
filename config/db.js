require('dotenv').config();
const mysql = require('mysql2');

// Debug environment variables
console.log('=== DB ENV ===');
console.log('DB_HOST:', process.env.DB_HOST || 'MISSING');
console.log('DB_USER:', process.env.DB_USER || 'MISSING');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*****' : 'MISSING');
console.log('DB_NAME:', process.env.DB_NAME || 'MISSING');
console.log('================');

// Create a pool
const pool = mysql.createPool({
    host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST, // force IPv4
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // max simultaneous connections
    queueLimit: 0
});

// Export pool as `db` to keep your current `db.query(...)` syntax
const db = pool.promise(); // using promise version if you want async/await
module.exports = db;

// Optional: test connection immediately
db.getConnection()
  .then(conn => {
    console.log('MySQL Pool Connected');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL Pool connection failed:', err);
  });
