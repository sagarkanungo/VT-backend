const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST === "localhost" ? "127.0.0.1" : process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//  EXPORT POOL DIRECTLY (NOT promisee)
module.exports = pool;
