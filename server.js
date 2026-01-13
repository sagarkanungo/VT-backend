const express = require('express');
const cors = require('cors');
const path = require("path");
require('dotenv').config(); // Load .env
const db = require('./config/db'); // Ensure db.js loads

const authRoutes = require('./routes/auth.routes');
const entriesRoutes = require("./routes/entries.routes");
const usersRoutes = require("./routes/users.routes");

const app = express();
app.set("trust proxy", 1);

// Middleware
app.use(cors({
  origin: "https://breetta.com",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// 🔹 TEMP CORS for localhost testing (comment later)
// const allowedOrigins = [
//   "https://breetta.com",
//   "http://localhost:3000",
//   "http://localhost:5173",
//   "http://127.0.0.1:3000",
//   "http://127.0.0.1:5173"
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     // allow requests with no origin (Postman, mobile apps)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }

//     return callback(new Error("Not allowed by CORS"), false);
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   credentials: true
// }));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

// ========================
// 🔹 Debug / Env Check Routes
// ========================

// Check environment variables
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
      return res.json({ success: false, error: err.message });
    }
    testDb.query('SELECT 1 + 1 AS result', (err, rows) => {
      if (err) return res.json({ success: false, error: err.message });
      res.json({ success: true, result: rows });
      testDb.end();
    });
  });
});

// ========================
// ✅ Health check route
// ========================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    time: new Date().toISOString()
  });
});

// ========================
// API Routes
// ========================
app.use('/api', authRoutes);
app.use("/api", require("./routes/money.routes"));
app.use("/api", entriesRoutes);
app.use("/api", require("./routes/transfer.routes"));
app.use("/api", usersRoutes);
app.use("/api", require("./routes/admin.routes"));
const notificationRoutes = require('./routes/notifications.routes');
app.use('/api', notificationRoutes);
app.use("/api", require("./routes/analytics.routes"));

// ========================
// Start Server
// ========================
setInterval(() => {
  db.query("SELECT 1", err => {
    if (err) {
      console.error("⚠️ MySQL keep-alive failed:", err.message);
    } else {
      console.log("🫀 MySQL keep-alive OK");
    }
  });
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// const express = require('express');
// const cors = require('cors');
// const path = require("path");
// require('dotenv').config();

// require('./config/db');

// const authRoutes = require('./routes/auth.routes');
// const entriesRoutes = require("./routes/entries.routes");
// const usersRoutes = require("./routes/users.routes");

// const app = express();
// app.set("trust proxy", 1);

// // ✅ CORS configuration
// const allowedOrigins = ["https://app.breetta.com"];

// app.use(cors({
//   origin: function(origin, callback) {
//     // allow requests with no origin (like Postman or mobile apps)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) {
//       const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
// }));

// // ✅ Preflight requests
// app.options("*", cors());

// // Middleware
// app.use(express.json());

// // Static uploads
// app.use('/uploads', express.static(path.join(__dirname, "uploads")));

// // Health check route
// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "ok",
//     message: "Server is running",
//     time: new Date().toISOString()
//   });
// });

// // API routes
// app.use('/api', authRoutes);
// app.use("/api", require("./routes/money.routes"));
// app.use("/api", entriesRoutes);
// app.use("/api", require("./routes/transfer.routes"));
// app.use("/api", usersRoutes);
// app.use("/api", require("./routes/admin.routes"));
// const notificationRoutes = require('./routes/notifications.routes');
// app.use('/api', notificationRoutes);
// app.use("/api", require("./routes/analytics.routes"));

// // Serve React dist (if needed later)
// // app.use(express.static(path.join(__dirname, "dist")));
// // app.use((req, res) => {
// //   res.sendFile(path.join(__dirname, "dist", "index.html"));
// // });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
