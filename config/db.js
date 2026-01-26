const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  multipleStatements: true
});

// optional: just to see once at startup
db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL pool connection failed:", err.message);
  } else {
    console.log("✅ MySQL pool connected");
    conn.release();
  }
});

module.exports = db;
