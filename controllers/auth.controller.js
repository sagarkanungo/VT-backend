// controllers/auth.controller.js
const db = require("../config/db"); // updated db.js exports a promise pool
const generateToken = require("../utils/generateToken");

/* ---------- HELPERS ---------- */
const isValidPhone = (phone) => /^\d{10,15}$/.test(phone);
const isStrongPassword = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(password);

/* ====================== REGISTER ====================== */
exports.register = async (req, res) => {
  try {
    const { full_name, phone, password, confirm_password, pin } = req.body;
    const idDocPath = req.file ? req.file.path : null;

    // Validate required fields
    if (!full_name || !phone || !password || !confirm_password || !pin) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (full_name.trim().length < 3) {
      return res.status(400).json({ error: "Full name must be at least 3 characters" });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: "Phone number must be 10–15 digits" });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters and include letters & numbers" });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    }

    // Check if phone already exists
    const [existing] = await db.query("SELECT id FROM users WHERE phone = ? LIMIT 1", [phone]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Phone already registered" });
    }

    // Insert new user
    await db.query(
      `INSERT INTO users (full_name, phone, password, pin, id_document)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name.trim(), phone, password, pin, idDocPath]
    );

    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/* ====================== LOGIN ====================== */
exports.login = async (req, res) => {
  try {
    let { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required" });
    }

    phone = phone.toString().trim();
    password = password.toString().trim();

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }
    if (password.length < 8) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const [result] = await db.query(
      `SELECT id, full_name, phone, password, role, is_blocked
       FROM users
       WHERE phone = ?
       LIMIT 1`,
      [phone]
    );

    if (!result.length) return res.status(401).json({ error: "Invalid credentials" });

    const user = result[0];

    if (user.password.trim() !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.is_blocked) {
      return res.status(403).json({ error: "Your account is blocked" });
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      full_name: user.full_name,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
