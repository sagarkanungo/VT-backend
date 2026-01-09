const db = require("../config/db");
const path = require("path");
const fs = require("fs");

// 🔹 Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, full_name, phone, role, total_balance, pin, id_document, password, created_at, is_blocked FROM users"
    );
    res.json(users);
  } catch (err) {
    console.error("DB Error (getAllUsers):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Get single user
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await db.query(
      "SELECT id, full_name, phone, role, total_balance, created_at, id_document FROM users WHERE id = ?",
      [userId]
    );

    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("DB Error (getUserById):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Update user (approve / edit role / balance / password / pin / document)
exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { full_name, phone, role, total_balance, password, pin } = req.body;
  const id_document = req.file ? req.file.path.replace(/\\/g, "/") : null;

  if (!full_name && !phone && !role && total_balance === undefined && !password && !pin && !id_document) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Delete old document if new file uploaded
    if (id_document) {
      const [oldRows] = await conn.query("SELECT id_document FROM users WHERE id = ?", [userId]);
      const oldFile = oldRows[0]?.id_document;
      if (oldFile) {
        fs.unlink(path.join(__dirname, "..", oldFile), (err) => {
          if (err) console.warn("Failed to delete old document:", err);
        });
      }
    }

    // Build dynamic query
    const fields = [];
    const params = [];

    if (full_name) { fields.push("full_name = ?"); params.push(full_name); }
    if (phone) { fields.push("phone = ?"); params.push(phone); }
    if (role) { fields.push("role = ?"); params.push(role); }
    if (total_balance !== undefined) { fields.push("total_balance = ?"); params.push(total_balance); }
    if (password) { fields.push("password = ?"); params.push(password); }
    if (pin) { fields.push("pin = ?"); params.push(pin); }
    if (id_document) { fields.push("id_document = ?"); params.push(id_document); }

    params.push(userId);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    const [result] = await conn.query(query, params);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "User not found" });
    }

    await conn.commit();
    res.json({ message: "User updated successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("DB Error (updateUser):", err);
    res.status(500).json({ error: "DB Error" });
  } finally {
    conn.release();
  }
};

// 🔹 Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("DB Error (deleteUser):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Block / Unblock user
exports.toggleBlockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { block } = req.body;

    if (block === undefined) return res.status(400).json({ error: "Missing block status" });

    const [result] = await db.query(
      "UPDATE users SET is_blocked = ? WHERE id = ?",
      [block ? 1 : 0, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "User not found" });

    res.json({ message: `User has been ${block ? "blocked" : "unblocked"}` });
  } catch (err) {
    console.error("DB Error (toggleBlockUser):", err);
    res.status(500).json({ error: "DB Error" });
  }
};
