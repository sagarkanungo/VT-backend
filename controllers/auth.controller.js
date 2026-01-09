const db = require('../config/db');
const generateToken = require('../utils/generateToken');

/* ---------- HELPERS ---------- */
const isValidPhone = (phone) => /^\d{10,15}$/.test(phone);
const isStrongPassword = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(password);

/* ====================== REGISTER ====================== */
exports.register = (req, res) => {
  try {
    const { full_name, phone, password, confirm_password, pin } = req.body;

    /* ---- REQUIRED FIELDS ---- */
    if (!full_name || !phone || !password || !confirm_password || !pin) {
      return res.status(400).json({ error: "All fields are required" });
    }

    /* ---- FULL NAME ---- */
    if (full_name.trim().length < 3) {
      return res.status(400).json({
        error: "Full name must be at least 3 characters",
      });
    }

    /* ---- PHONE ---- */
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        error: "Phone number must be 10–15 digits",
      });
    }

    /* ---- PASSWORD ---- */
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include letters & numbers",
      });
    }

    /* ---- CONFIRM PASSWORD ---- */
    if (password !== confirm_password) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    /* ---- PIN ---- */
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    }

    const idDocPath = req.file ? req.file.path : null;

    /* ---- CHECK PHONE EXISTS ---- */
    db.query(
      "SELECT id FROM users WHERE phone = ?",
      [phone],
      (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });

        if (existing.length > 0) {
          return res.status(400).json({ error: "Phone already registered" });
        }

        /* ---- INSERT USER ---- */
        db.query(
          `INSERT INTO users (full_name, phone, password, pin, id_document)
           VALUES (?, ?, ?, ?, ?)`,
          [full_name.trim(), phone, password, pin, idDocPath],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: "Database error" });
            }

            res.json({ message: "User registered successfully" });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

/* ====================== LOGIN ====================== */
exports.login = (req, res) => {
  try {
    let { phone, password } = req.body;

    /* ---- REQUIRED ---- */
    if (!phone || !password) {
      return res.status(400).json({
        error: "Phone and password are required",
      });
    }

    phone = phone.toString().trim();
    password = password.toString().trim();

    /* ---- PHONE FORMAT ---- */
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        error: "Invalid phone number format",
      });
    }

    /* ---- PASSWORD LENGTH ---- */
    if (password.length < 8) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const sql = `
      SELECT id, full_name, phone, password, role, is_blocked
      FROM users
      WHERE phone = ?
      LIMIT 1
    `;

    db.query(sql, [phone], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!result.length) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result[0];

      /* ---- PASSWORD CHECK (PLAIN) ---- */
      if (user.password.trim() !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      /* ---- BLOCK CHECK ---- */
      if (user.is_blocked) {
        return res.status(403).json({ error: "Your account is blocked" });
      }

      const token = generateToken({
        id: user.id,
        role: user.role,
        full_name: user.full_name, 
      });

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};




// exports.login = (req, res) => {
//   try {
//     let { phone, password } = req.body;
//     console.log("Login request body:", req.body);

//     if (!phone || !password) {
//       console.log("Missing phone or password");
//       return res.status(400).json({ error: "Phone and password required" });
//     }

//     phone = phone.toString().trim();
//     password = password.toString().trim();

//     const sql = `
//       SELECT id, full_name, phone, password, role, is_blocked
//       FROM users
//       WHERE phone = ?
//       LIMIT 1
//     `;

//     db.query(sql, [phone], (err, result) => {
//       if (err) {
//         console.error("DB query error:", err);
//         return res.status(500).json({ error: "Database error" });
//       }

//       if (!result.length) {
//         console.log("No user found with phone:", phone);
//         return res.status(401).json({ error: "Invalid credentials" });
//       }

//       const user = result[0];
//       console.log("User fetched from DB:", user);

//       if (user.password.trim() !== password) {
//         console.log("Password mismatch");
//         return res.status(401).json({ error: "Invalid credentials" });
//       }

//       if (user.is_blocked) {
//         console.log("User is blocked");
//         return res.status(403).json({ error: "Account blocked" });
//       }

//       const token = generateToken({
//         id: user.id,
//         role: user.role,
//         full_name: user.full_name,
//       });

//       console.log("Login successful for user:", user.phone);
//       return res.json({
//         message: "Login successful",
//         token,
//         user: {
//           id: user.id,
//           full_name: user.full_name,
//           phone: user.phone,
//           role: user.role,
//         },
//       });
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };
