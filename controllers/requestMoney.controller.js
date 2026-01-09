const db = require("../config/db"); // Make sure db is a mysql2 promise pool

// 🔹 Request money (chat)
exports.requestMoney = async (req, res) => {
  try {
    const { user_id, message } = req.body;
    if (!user_id || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await db.query(
      "INSERT INTO chat_requests (user_id, message, status) VALUES (?, ?, 'pending')",
      [user_id, message]
    );

    res.json({ message: "Request sent to admin" });
  } catch (err) {
    console.error("DB Error (requestMoney):", err);
    res.status(500).json({ error: "Database error" });
  }
};

// 🔹 Get user balance
exports.getUserBalance = async (req, res) => {
  try {
    const user_id = req.params.id;
    const [result] = await db.query(
      "SELECT total_balance FROM users WHERE id = ?",
      [user_id]
    );

    if (result.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json({ balance: result[0].total_balance || 0 });
  } catch (err) {
    console.error("DB Error (getUserBalance):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Get user transactions
exports.getTransactions = async (req, res) => {
  try {
    const user_id = req.params.id;
    const [transactions] = await db.query(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );
    res.json(transactions);
  } catch (err) {
    console.error("DB Error (getTransactions):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Admin: Get all pending money requests
exports.getMoneyRequests = async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT cr.id, cr.user_id, u.full_name, u.phone, cr.message, cr.status, cr.created_at
       FROM chat_requests cr
       JOIN users u ON u.id = cr.user_id
       ORDER BY cr.created_at DESC`
    );

    res.json(results);
  } catch (err) {
    console.error("DB Error (getMoneyRequests):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Admin: Approve / send money for request OR direct payment
exports.sendMoneyForRequest = async (req, res) => {
  const { request_id, amount, user_id, direct_payment, note } = req.body;

  try {
    if (direct_payment && user_id && amount) {
      return handleDirectPayment(req, res, user_id, amount, note);
    }

    if (!request_id || !amount) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const creditAmount = Number(amount);
    if (creditAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

    // Start transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Get pending request
      const [reqResult] = await conn.query(
        "SELECT * FROM chat_requests WHERE id = ? AND status = 'pending'",
        [request_id]
      );

      if (reqResult.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Request not found or already processed" });
      }

      const userId = reqResult[0].user_id;

      // Process payment
      await processPayment(conn, userId, creditAmount, "Admin approved request");

      // Update request status
      await conn.query(
        "UPDATE chat_requests SET status = 'approved' WHERE id = ?",
        [request_id]
      );

      await conn.commit();
      res.json({ success: true, message: "Money sent successfully" });
    } catch (err) {
      await conn.rollback();
      console.error("Transaction Error (sendMoneyForRequest):", err);
      res.status(500).json({ error: "Failed to send money" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("DB Error (sendMoneyForRequest):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Helper: Direct payment
const handleDirectPayment = async (req, res, userId, amount, note = '') => {
  const creditAmount = Number(amount);
  if (creditAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

  const description = note ? `Direct payment from admin: ${note}` : "Direct payment from admin";

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await processPayment(conn, userId, creditAmount, description);
    await conn.commit();
    res.json({ success: true, message: "Payment sent successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Transaction Error (handleDirectPayment):", err);
    res.status(500).json({ error: "Failed to send payment" });
  } finally {
    conn.release();
  }
};

// 🔹 Common payment processing
const processPayment = async (conn, userId, creditAmount, description) => {
  // 1️⃣ Update user balance
  await conn.query(
    "UPDATE users SET total_balance = total_balance + ? WHERE id = ?",
    [creditAmount, userId]
  );

  // 2️⃣ Insert transaction
  await conn.query(
    "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'credit', ?, ?)",
    [userId, creditAmount, description]
  );

  // 3️⃣ Insert notification
  await conn.query(
    `INSERT INTO notifications (user_id, type, message, data, is_read, created_at, updated_at)
     VALUES (?, 'credit', ?, '{}', 0, NOW(), NOW())`,
    [userId, description]
  );
};

// 🔹 Get pending money requests count
exports.getPendingRequestsCount = async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT COUNT(*) as pendingCount FROM chat_requests WHERE status = 'pending'"
    );
    res.json({ pendingCount: result[0].pendingCount });
  } catch (err) {
    console.error("DB Error (getPendingRequestsCount):", err);
    res.status(500).json({ error: "DB Error" });
  }
};
