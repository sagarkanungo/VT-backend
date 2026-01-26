const express = require('express');
const cors = require('cors');
const path = require("path");
const fs = require('fs'); // For manual log file
require('dotenv').config(); // Load .env

// ----------------------------
// Logging helper
// ----------------------------
const logFolder = path.join(__dirname, 'logs');
if (!fs.existsSync(logFolder)) fs.mkdirSync(logFolder);

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} | ${message}`);
  try {
    fs.appendFileSync(path.join(logFolder, 'server.log'), `${timestamp} | ${message}\n`);
  } catch (err) {
    console.error('❌ Log write failed:', err.message);
  }
}

// ----------------------------
// DB connection
// ----------------------------
let db;
try {
  db = require('./config/db');
  log('✅ DB loaded successfully');
} catch (err) {
  log(`❌ DB load failed: ${err.message}`);
}

// ----------------------------
// Express app setup
// ----------------------------
const app = express();
app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "*"],
  credentials: true
}));

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

// Health check
app.get("/api/health", (req, res) => {
  log(`Health check called`);
  res.json({
    status: "ok",
    message: "Server is running",
    port: process.env.PORT || 'MISSING',
    time: new Date().toISOString()
  });
});

// ----------------------------
// API Routes
// ----------------------------
app.use('/api', require('./routes/auth.routes'));
app.use("/api", require("./routes/money.routes"));
app.use("/api", require("./routes/entries.routes"));
app.use("/api", require("./routes/transfer.routes"));
app.use("/api", require("./routes/users.routes"));
app.use("/api", require("./routes/admin.routes"));
app.use('/api', require('./routes/notifications.routes'));
app.use("/api", require("./routes/analytics.routes"));

// ----------------------------
// MySQL keep-alive
// ----------------------------
if (db) {
  setInterval(() => {
    db.query("SELECT 1", err => {
      if (err) {
        log(`⚠️ MySQL keep-alive failed: ${err.message}`);
      } else {
        log("🫀 MySQL keep-alive OK");
      }
    });
  }, 5 * 60 * 1000);
}

// ----------------------------
// Start server
// ----------------------------
const PORT = process.env.PORT;
if (!PORT) {
  log('❌ No PORT defined in environment! Cannot start server.');
  process.exit(1);
}

try {
  app.listen(PORT, () => {
    log(`🚀 Server running on port ${PORT}`);
  });
} catch (err) {
  log(`❌ Server failed to start: ${err.message}`);
}
