const db = require("../config/db");

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
exports.updateUser = (req, res) => {
  const userId = req.params.id;
  const { full_name, phone, role, total_balance, password } = req.body;
  
  // Build dynamic query based on provided fields
  let query = "UPDATE users SET full_name=?, phone=?, role=?, total_balance=?";
  let params = [full_name, phone, role, total_balance];
  
  // Add password if provided
  if (password) {
    query += ", password=?";
    params.push(password);
  }
  
  query += " WHERE id=?";
  params.push(userId);
  
  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: "DB Error" });
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
