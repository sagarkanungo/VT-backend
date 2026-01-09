const mysql = require("mysql2");

let db;

function connectDB() {
  db = mysql.createConnection({
    host: process.env.DB_HOST === "localhost" ? "127.0.0.1" : process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  db.connect(err => {
    if (err) {
      console.error("❌ MySQL connection failed:", err.message);
      setTimeout(connectDB, 5000); // retry
    } else {
      console.log("✅ MySQL connected");
    }
  });

  db.on("error", err => {
    console.error("🔥 MySQL error:", err.code);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      connectDB();
    } else {
      throw err;
    }
  });
}

connectDB();

module.exports = db;
