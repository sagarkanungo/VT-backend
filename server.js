const express = require('express');
const cors = require('cors');
const path = require("path");
const fs = require('fs'); // For manual log file
require('dotenv').config(); // Load .env
const db = require('./config/db'); // Ensure db.js loads

const authRoutes = require('./routes/auth.routes');
const entriesRoutes = require("./routes/entries.routes");
const usersRoutes = require("./routes/users.routes");

const app = express();
app.set("trust proxy", 1);

// ----------------------------
// Logging helper
// ----------------------------
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} | ${message}`);
  fs.appendFileSync('server.log', `${timestamp} | ${message}\n`);
}

// ----------------------------
// Middleware
// ----------------------------
app.use(cors({
  origin: true, // allow ALL origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "*"],
  credentials: true
}));
app.options("*", cors());

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

// ----------------------------
// Debug / Env Check Routes
// ----------------------------
app.get('/api/env-check', (req, res) => {
  res.json({
    DB_HOST: process.env.DB_HOST || 'MISSING',
    DB_USER: process.env.DB_USER || 'MISSING',
    DB_PASSWORD: process.env.DB_PASSWORD ? '*****' : 'MISSING',
    DB_NAME: process.env.DB_NAME || 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'MISSING'
  });
});

// Test DB connection
app.get('/api/db-test', (req, res) => {
  const mysql = require('mysql2');
  const testDb = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  testDb.connect(err => {
    if (err) {
      log(`❌ MySQL connection failed: ${err.message}`);
      return res.json({ success: false, error: err.message });
    }
    testDb.query('SELECT 1 + 1 AS result', (err, rows) => {
      if (err) {
        log(`❌ MySQL query failed: ${err.message}`);
        return res.json({ success: false, error: err.message });
      }
      log(`✅ MySQL test query OK: ${JSON.stringify(rows)}`);
      res.json({ success: true, result: rows });
      testDb.end();
    });
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  log(`Health check called`);
  res.json({
    status: "ok",
    message: "Server is running",
    port: process.env.PORT || 5000,
    time: new Date().toISOString()
  });
});

// ----------------------------
// API Routes
// ----------------------------
app.use('/api', authRoutes);
app.use("/api", require("./routes/money.routes"));
app.use("/api", entriesRoutes);
app.use("/api", require("./routes/transfer.routes"));
app.use("/api", usersRoutes);
app.use("/api", require("./routes/admin.routes"));
const notificationRoutes = require('./routes/notifications.routes');
app.use('/api', notificationRoutes);
app.use("/api", require("./routes/analytics.routes"));

// ----------------------------
// MySQL keep-alive
// ----------------------------
setInterval(() => {
  db.query("SELECT 1", err => {
    if (err) {
      log(`⚠️ MySQL keep-alive failed: ${err.message}`);
    } else {
      log("🫀 MySQL keep-alive OK");
    }
  });
}, 5 * 60 * 1000);

// ----------------------------
// Start server
// ----------------------------
const PORT = process.env.PORT || 5000;
try {
  app.listen(PORT, () => {
    log(`🚀 Server running on port ${PORT}`);
  });
} catch (err) {
  log(`❌ Server failed to start: ${err.message}`);
}
