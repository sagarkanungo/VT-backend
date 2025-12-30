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

// 2️⃣ Approve / Send money for a request OR Direct payment
exports.sendMoneyForRequest = (req, res) => {
  const { request_id, amount, user_id, direct_payment } = req.body;

  // Handle direct payment (from user table)
  if (direct_payment && user_id && amount) {
    return handleDirectPayment(req, res, user_id, amount);
  }

  // Handle regular money request approval
  if (!request_id || !amount) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const creditAmount = Number(amount);
  if (creditAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err.message });

    // 1️⃣ Get pending request
    db.query(
      "SELECT * FROM chat_requests WHERE id = ? AND status = 'pending'",
      [request_id],
      (err, result) => {
        if (err)
          return db.rollback(() =>
            res.status(500).json({ error: "DB Error" })
          );

        if (result.length === 0)
          return db.rollback(() =>
            res
              .status(404)
              .json({ error: "Request not found or already processed" })
          );

        const request = result[0];
        const userId = request.user_id;

        // Process payment
        processPayment(res, userId, creditAmount, "Admin approved request", () => {
          // Update request status after successful payment
          db.query(
            "UPDATE chat_requests SET status = 'approved' WHERE id = ?",
            [request_id],
            (err) => {
              if (err)
                return db.rollback(() =>
                  res.status(500).json({
                    error: "Failed to update request status",
                  })
                );

              // Commit transaction
              db.commit(() => {
                res.json({
                  success: true,
                  message: "Money sent successfully",
                });
              });
            }
          );
        });
      }
    );
  });
};

// Helper function for direct payment
const handleDirectPayment = (req, res, userId, amount) => {
  const creditAmount = Number(amount);
  if (creditAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const note = req.body.note || '';
  const description = note 
    ? `Direct payment from admin: ${note}` 
    : "Direct payment from admin";

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err.message });

    processPayment(res, userId, creditAmount, description, () => {
      // Commit transaction
      db.commit(() => {
        res.json({
          success: true,
          message: "Payment sent successfully",
        });
      });
    });
  });
};

// Common payment processing function
const processPayment = (res, userId, creditAmount, description, callback) => {
  // 1️⃣ Credit user balance
  db.query(
    "UPDATE users SET total_balance = total_balance + ? WHERE id = ?",
    [creditAmount, userId],
    (err) => {
      if (err)
        return db.rollback(() =>
          res.status(500).json({ error: "Failed to update balance" })
        );

      // 2️⃣ Insert transaction
      db.query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES (?, 'credit', ?, ?)`,
        [userId, creditAmount, description],
        (err) => {
          if (err)
            return db.rollback(() =>
              res
                .status(500)
                .json({ error: "Failed to create transaction" })
            );

          // 3️⃣ Insert notification (with proper columns)
          db.query(
            `INSERT INTO notifications (user_id, type, message, data, is_read, created_at, updated_at)
             VALUES (?, 'credit', ?, '{}', 0, NOW(), NOW())`,
            [userId, description],
            (err) => {
              if (err)
                return db.rollback(() =>
                  res
                    .status(500)
                    .json({ error: "Failed to create notification" })
                );

              // Call the callback for additional operations
              callback();
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

