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
// // Middleware
// app.use(cors({
//   origin: "https://app.breetta.com",
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
// }));

// app.use(express.json());

// // Static uploads
// app.use('/uploads', express.static(path.join(__dirname, "uploads")));


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

// // const notificationRoutes = require('./routes/notifications');

// // Add this line with your other route registrations
// // app.use('/api/notifications', notificationRoutes);
// // Serve React dist (AFTER APIs)
// // app.use(express.static(path.join(__dirname, "dist")));

// // // React router fallback
// // app.use((req, res) => {
// //   res.sendFile(path.join(__dirname, "dist", "index.html"));
// // });



// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


const express = require('express');
const cors = require('cors');
const path = require("path");
require('dotenv').config();

require('./config/db');

const authRoutes = require('./routes/auth.routes');
const entriesRoutes = require("./routes/entries.routes");
const usersRoutes = require("./routes/users.routes");

const app = express();
app.set("trust proxy", 1);

// ✅ CORS configuration
const allowedOrigins = ["https://app.breetta.com"];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like Postman or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// ✅ Preflight requests
app.options("*", cors());

// Middleware
app.use(express.json());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    time: new Date().toISOString()
  });
});

// API routes
app.use('/api', authRoutes);
app.use("/api", require("./routes/money.routes"));
app.use("/api", entriesRoutes);
app.use("/api", require("./routes/transfer.routes"));
app.use("/api", usersRoutes);
app.use("/api", require("./routes/admin.routes"));
const notificationRoutes = require('./routes/notifications.routes');
app.use('/api', notificationRoutes);
app.use("/api", require("./routes/analytics.routes"));

// Serve React dist (if needed later)
// app.use(express.static(path.join(__dirname, "dist")));
// app.use((req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
