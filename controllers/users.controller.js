const db = require("../config/db");
const path = require("path");
const fs = require("fs");

// Get all users
exports.getAllUsers = (req, res) => {
  db.query("SELECT id, full_name, phone, role, total_balance,pin,id_document,password ,created_at,is_blocked FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(results);
  });
};

// Get single user
exports.getUserById = (req, res) => {
  const userId = req.params.id;
  db.query(
    "SELECT id, full_name, phone, role, total_balance, created_at,id_document  FROM users WHERE id=?",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      if (result.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(result[0]);
    }
  );
};

// Update user (approve/edit role)
// Update user (approve/edit role)
exports.updateUser = (req, res) => {
  const userId = req.params.id;

  // Make sure req.body exists
  const body = req.body || {};
  const { full_name, phone, role, total_balance, password, pin } = body;

  // If a new file is uploaded
  let id_document = req.file ? req.file.path.replace(/\\/g, "/") : null;

  // Delete old document if new file is uploaded
  if (id_document) {
    db.query("SELECT id_document FROM users WHERE id = ?", [userId], (err, result) => {
      if (!err && result[0]?.id_document) {
        const oldFile = path.join(__dirname, "..", result[0].id_document);
        fs.unlink(oldFile, (err) => {
          if (err) console.warn("Failed to delete old document:", err);
        });
      }
    });
  }

  // Build dynamic query
  const fields = [];
  const params = [];

  if (full_name) {
    fields.push("full_name = ?");
    params.push(full_name);
  }
  if (phone) {
    fields.push("phone = ?");
    params.push(phone);
  }
  if (role) {
    fields.push("role = ?");
    params.push(role);
  }
  if (total_balance !== undefined) {
    fields.push("total_balance = ?");
    params.push(total_balance);
  }
  if (password) {
    fields.push("password = ?");
    params.push(password);
  }
  if (pin) {
    fields.push("pin = ?");
    params.push(pin);
  }
  if (id_document) {
    fields.push("id_document = ?");
    params.push(id_document);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  params.push(userId);

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "DB Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  });
};




// Delete user
exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  db.query("DELETE FROM users WHERE id=?", [userId], (err) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json({ message: "User deleted successfully" });
  });
};


// Block / Unblock user
exports.toggleBlockUser = (req, res) => {
  const userId = req.params.id;
  const { block } = req.body; // true = block, false = unblock

  if (block === undefined) {
    return res.status(400).json({ error: "Missing block status" });
  }

  db.query(
    "UPDATE users SET is_blocked = ? WHERE id = ?",
    [block ? 1 : 0, userId],
    (err) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json({ message: `User has been ${block ? "blocked" : "unblocked"}` });
    }
  );
};
