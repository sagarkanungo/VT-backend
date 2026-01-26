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
// exports.getMoneyRequests = (req, res) => {
//   db.query(
//     `
//     SELECT
//       u.id AS user_id,
//       u.full_name,
//       u.phone,
//       COUNT(cm.id) AS unread_count
//     FROM users u
//     LEFT JOIN chat_requests cr 
//       ON cr.user_id = u.id
//     LEFT JOIN chat_messages cm
//       ON cm.request_id = cr.id
//       AND cm.sender = 'user'
//       AND cm.is_read = 0
//     GROUP BY u.id, u.full_name, u.phone
//     ORDER BY unread_count DESC
//     `,
//     (err, results) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ error: "DB Error" });
//       }
//       res.json(results);
//     }
//   );
// };



// 2️⃣ Approve / Send money for a request OR Direct payment
// --- Send money for request (admin) ---
exports.sendMoneyForRequest = (req, res) => {
  const { request_id, amount, user_id, direct_payment } = req.body;

  const creditAmount = Number(amount);
  if (!creditAmount || creditAmount <= 0)
    return res.status(400).json({ error: "Invalid amount" });

  // Handle direct payment
  if (direct_payment && user_id) {
    return handleDirectPayment(req, res, user_id, creditAmount);
  }

  // Regular request approval
  if (!request_id) {
    return res.status(400).json({ error: "Missing request ID" });
  }

  // Get a connection from the pool
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: err.message });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ error: err.message });
      }

      // 1️⃣ Get pending request
      connection.query(
        "SELECT * FROM chat_requests WHERE id = ? AND status = 'pending'",
        [request_id],
        (err, result) => {
          if (err)
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ error: "DB Error" });
            });

          if (result.length === 0)
            return connection.rollback(() => {
              connection.release();
              res.status(404).json({
                error: "Request not found or already processed",
              });
            });

          const userId = result[0].user_id;

          // 2️⃣ Process payment
          processPayment(connection, userId, creditAmount, "Admin approved request", (err) => {
            if (err)
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ error: err.message });
              });

            // 3️⃣ Update request status
            connection.query(
              "UPDATE chat_requests SET status = 'approved' WHERE id = ?",
              [request_id],
              (err) => {
                if (err)
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: "Failed to update request status" });
                  });

                // 4️⃣ Commit transaction
                connection.commit((err) => {
                  if (err)
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({ error: err.message });
                    });

                  connection.release();
                  res.json({ success: true, message: "Money sent successfully" });
                });
              }
            );
          });
        }
      );
    });
  });
};

// --- Handle direct payment ---
const handleDirectPayment = (req, res, userId, creditAmount) => {
  const note = req.body.note || '';
  const description = note
    ? `Direct payment from admin: ${note}`
    : "Direct payment from admin";

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: err.message });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ error: err.message });
      }

      processPayment(connection, userId, creditAmount, description, (err) => {
        if (err)
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ error: err.message });
          });

        connection.commit((err) => {
          if (err)
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ error: err.message });
            });

          connection.release();
          res.json({ success: true, message: "Payment sent successfully" });
        });
      });
    });
  });
};

// --- Process payment (credits user, adds transaction & notification) ---
const processPayment = (connection, userId, creditAmount, description, callback) => {
  // 1️⃣ Update user balance
  connection.query(
    "UPDATE users SET total_balance = total_balance + ? WHERE id = ?",
    [creditAmount, userId],
    (err) => {
      if (err) return callback(new Error("Failed to update balance"));

      // 2️⃣ Insert transaction
      connection.query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES (?, 'credit', ?, ?)`,
        [userId, creditAmount, description],
        (err) => {
          if (err) return callback(new Error("Failed to create transaction"));

          // 3️⃣ Insert notification
          connection.query(
            `INSERT INTO notifications (user_id, type, message, data, is_read, created_at, updated_at)
             VALUES (?, 'credit', ?, '{}', 0, NOW(), NOW())`,
            [userId, description],
            (err) => {
              if (err) return callback(new Error("Failed to create notification"));

              // Success
              callback(null);
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

// Get chat messages for a specific money request
exports.getChatMessages = (req, res) => {
  const requestId = req.params.requestId;

  db.query(
    "SELECT * FROM chat_messages WHERE request_id = ? ORDER BY created_at ASC",
    [requestId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(results);
    }
  );
};



// Send a message (from admin or user)
exports.sendChatMessage = (req, res) => {
  const { request_id, sender, message } = req.body;

  if (!request_id || !sender || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const isRead =  0;

  db.query(
    "INSERT INTO chat_messages (request_id, sender, message, is_read) VALUES (?, ?, ?, ?)",
    [request_id, sender, message,isRead],
    (err) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json({ success: true, message: "Message sent" });
    }
  );
};
// Mark messages as read
exports.markChatAsRead = (req, res) => {
  const { request_id, role } = req.body;

  const senderToMark = role === "admin" ? "user" : "admin";

  db.query(
    `UPDATE chat_messages 
     SET is_read = 1 
     WHERE request_id = ? AND sender = ?`,
    [request_id, senderToMark],
    (err) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json({ success: true });
    }
  );
};





