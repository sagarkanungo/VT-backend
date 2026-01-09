const db = require("../config/db"); // Make sure this is a mysql2 promise pool

exports.transferMoney = async (req, res) => {
  try {
    const { user_id, phone, amount, pin, note } = req.body;

    if (!user_id || !phone || !amount || !pin) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (pin.length !== 4) {
      return res.status(400).json({ error: "Invalid PIN" });
    }

    const transferAmount = Number(amount);
    if (transferAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const conn = await db.getConnection(); // get a connection from pool
    try {
      await conn.beginTransaction();

      // 1️⃣ Fetch sender
      const [senderRows] = await conn.query(
        "SELECT id, full_name, total_balance, pin FROM users WHERE id = ?",
        [user_id]
      );

      if (!senderRows.length) throw { status: 404, message: "Sender not found" };

      const sender = senderRows[0];
      const senderBalance = Number(sender.total_balance || 0);

      if (sender.pin !== pin) throw { status: 400, message: "Incorrect PIN" };
      if (senderBalance < transferAmount)
        throw { status: 400, message: "Insufficient balance" };

      // 2️⃣ Fetch receiver
      const [receiverRows] = await conn.query(
        "SELECT id, full_name FROM users WHERE phone = ?",
        [phone]
      );

      if (!receiverRows.length) throw { status: 404, message: "Receiver not found" };

      const receiver = receiverRows[0];
      if (receiver.id === user_id)
        throw { status: 400, message: "You cannot transfer money to yourself" };

      const cleanNote = note ? note.trim() : "";
      const senderDesc = cleanNote
        ? `Sent ${transferAmount} to ${phone}. ${cleanNote}`
        : `Sent ${transferAmount} to ${phone}.`;
      const receiverDesc = cleanNote
        ? `Received ${transferAmount} from ${sender.full_name}. ${cleanNote}`
        : `Received ${transferAmount} from ${sender.full_name}.`;

      // 3️⃣ Deduct sender balance
      await conn.query(
        "UPDATE users SET total_balance = total_balance - ? WHERE id = ?",
        [transferAmount, user_id]
      );

      // 4️⃣ Credit receiver balance
      await conn.query(
        "UPDATE users SET total_balance = total_balance + ? WHERE id = ?",
        [transferAmount, receiver.id]
      );

      // 5️⃣ Insert sender transaction
      await conn.query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES (?, 'debit', ?, ?)`,
        [user_id, transferAmount, senderDesc]
      );

      // 6️⃣ Insert receiver transaction
      await conn.query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES (?, 'credit', ?, ?)`,
        [receiver.id, transferAmount, receiverDesc]
      );

      // 7️⃣ Insert notifications
      await conn.query(
        `INSERT INTO notifications (user_id, type, message, is_read, created_at)
         VALUES (?, 'debit', ?, 0, NOW()), 
                (?, 'credit', ?, 0, NOW())`,
        [user_id, senderDesc, receiver.id, receiverDesc]
      );

      await conn.commit();
      res.json({ success: true, message: "Money transferred successfully" });
    } catch (err) {
      await conn.rollback();
      if (err.status) return res.status(err.status).json({ error: err.message });
      console.error("DB Error (transferMoney):", err);
      res.status(500).json({ error: "Transaction failed" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("DB Connection Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
