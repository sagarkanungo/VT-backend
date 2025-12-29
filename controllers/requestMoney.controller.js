const db = require("../config/db");

// Request money (chat)
exports.requestMoney = (req, res) => {
  const { user_id, message } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.query(
    "INSERT INTO chat_requests (user_id, message, status) VALUES (?, ?, 'pending')",
    [user_id, message],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Request sent to admin" });
    }
  );
};

// Get user balance
exports.getUserBalance = (req, res) => {
  const user_id = req.params.id;

  db.query(
    "SELECT total_balance FROM users WHERE id = ?",
    [user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      if (result.length === 0)
        return res.status(404).json({ error: "User not found" });

      res.json({ balance: result[0].total_balance || 0 });
    }
  );
};

// User transactions
exports.getTransactions = (req, res) => {
  const user_id = req.params.id;

  db.query(
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC",
    [user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(result);
    }
  );
};



// --- Existing functions ---
// requestMoney, getUserBalance, getTransactions already here

// --- New admin APIs ---

// 1️⃣ Get all pending money requests
exports.getMoneyRequests = (req, res) => {
  db.query(
    `SELECT cr.id, cr.user_id, u.full_name, u.phone, cr.message, cr.status, cr.created_at
     FROM chat_requests cr
     JOIN users u ON u.id = cr.user_id
     ORDER BY cr.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(results);
    }
  );
};

// 2️⃣ Approve / Send money for a request
exports.sendMoneyForRequest = (req, res) => {
  const { request_id, amount } = req.body;

  if (!request_id || !amount) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // 1️⃣ Get request info
  db.query(
    "SELECT * FROM chat_requests WHERE id = ? AND status = 'pending'",
    [request_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      if (result.length === 0)
        return res.status(404).json({ error: "Request not found or already processed" });

      const request = result[0];
      const userId = request.user_id;

      // 2️⃣ Add amount to user's balance
      db.query(
        "UPDATE users SET total_balance = total_balance + ? WHERE id = ?",
        [amount, userId],
        (err) => {
          if (err) return res.status(500).json({ error: "Failed to update balance" });

          // 3️⃣ Save transaction
          db.query(
            "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'credit', ?, 'Admin approved request')",
            [userId, amount],
            (err) => {
              if (err) return res.status(500).json({ error: "Failed to create transaction" });

              // 4️⃣ Update request status
              db.query(
                "UPDATE chat_requests SET status = 'approved' WHERE id = ?",
                [request_id],
                (err) => {
                  if (err) return res.status(500).json({ error: "Failed to update request status" });

                  res.json({ message: "Money sent successfully" });
                }
              );
            }
          );
        }
      );
    }
  );
};

// 3️⃣ Get pending money requests count
exports.getPendingRequestsCount = (req, res) => {
  db.query(
    "SELECT COUNT(*) as pendingCount FROM chat_requests WHERE status = 'pending'",
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json({ pendingCount: result[0].pendingCount });
    }
  );
};

