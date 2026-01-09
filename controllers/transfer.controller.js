const db = require("../config/db");

exports.transferMoney = (req, res) => {
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

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err.message });

    // 1️⃣ Fetch sender
    db.query(
      "SELECT id, full_name, total_balance, pin FROM users WHERE id = ?",
      [user_id],
      (err, senderResult) => {
        if (err)
          return db.rollback(() =>
            res.status(500).json({ error: err.message })
          );
        if (senderResult.length === 0)
          return db.rollback(() =>
            res.status(404).json({ error: "Sender not found" })
          );

        const sender = senderResult[0];
        const senderBalance = Number(sender.total_balance || 0);

        if (sender.pin !== pin)
          return db.rollback(() =>
            res.status(400).json({ error: "Incorrect PIN" })
          );
        if (senderBalance < transferAmount)
          return db.rollback(() =>
            res.status(400).json({ error: "Insufficient balance" })
          );

        // 2️⃣ Fetch receiver
        db.query(
          "SELECT id, full_name FROM users WHERE phone = ?",
          [phone],
          (err, receiverResult) => {
            if (err)
              return db.rollback(() =>
                res.status(500).json({ error: err.message })
              );
            if (receiverResult.length === 0)
              return db.rollback(() =>
                res.status(404).json({ error: "Receiver not found" })
              );

            const receiverId = receiverResult[0].id;
            const receiverName = receiverResult[0].full_name;

            if (receiverId === user_id)
              return db.rollback(() =>
                res
                  .status(400)
                  .json({ error: "You cannot transfer money to yourself" })
              );

            const cleanNote = note ? note.trim() : "";

            const senderDesc = cleanNote
              ? `Sent ${transferAmount} to ${phone}. ${cleanNote}`
              : `Sent ${transferAmount} to ${phone}.`;

            const receiverDesc = cleanNote
              ? `Received ${transferAmount} from ${sender.full_name}. ${cleanNote}`
              : `Received ${transferAmount} from ${sender.full_name}.`;

            // 3️⃣ Deduct sender balance
            db.query(
              "UPDATE users SET total_balance = total_balance - ? WHERE id = ?",
              [transferAmount, user_id],
              (err) => {
                if (err)
                  return db.rollback(() =>
                    res.status(500).json({ error: err.message })
                  );

                // 4️⃣ Credit receiver balance
                db.query(
                  "UPDATE users SET total_balance = total_balance + ? WHERE id = ?",
                  [transferAmount, receiverId],
                  (err) => {
                    if (err)
                      return db.rollback(() =>
                        res.status(500).json({ error: err.message })
                      );

                    // 5️⃣ Insert sender transaction
                    db.query(
                      `INSERT INTO transactions (user_id, type, amount, description)
                       VALUES (?, 'debit', ?, ?)`,
                      [user_id, transferAmount, senderDesc],
                      (err) => {
                        if (err)
                          return db.rollback(() =>
                            res.status(500).json({ error: err.message })
                          );

                        // 6️⃣ Insert receiver transaction
                        db.query(
                          `INSERT INTO transactions (user_id, type, amount, description)
                           VALUES (?, 'credit', ?, ?)`,
                          [receiverId, transferAmount, receiverDesc],
                          (err) => {
                            if (err)
                              return db.rollback(() =>
                                res.status(500).json({ error: err.message })
                              );

                            // 7️⃣ Insert notifications
                            // Insert sender notification
                            db.query(
                              `INSERT INTO notifications (user_id, type, message, is_read, created_at)
   VALUES (?, 'debit', ?, 0, NOW())`,
                              [user_id, senderDesc],
                              (err) => {
                                if (err) {
                                  console.error(
                                    "Sender notification error:",
                                    err
                                  );
                                  return db.rollback(() =>
                                    res
                                      .status(500)
                                      .json({
                                        error:
                                          "Transaction succeeded but failed to create sender notification",
                                      })
                                  );
                                }

                                // Insert receiver notification
                                db.query(
                                  `INSERT INTO notifications (user_id, type, message, is_read, created_at)
       VALUES (?, 'credit', ?, 0, NOW())`,
                                  [receiverId, receiverDesc],
                                  (err) => {
                                    if (err) {
                                      console.error(
                                        "Receiver notification error:",
                                        err
                                      );
                                      return db.rollback(() =>
                                        res
                                          .status(500)
                                          .json({
                                            error:
                                              "Transaction succeeded but failed to create receiver notification",
                                          })
                                      );
                                    }

                                    // Commit transaction
                                    db.commit((err) => {
                                      if (err)
                                        return db.rollback(() =>
                                          res
                                            .status(500)
                                            .json({ error: err.message })
                                        );

                                      res.json({
                                        success: true,
                                        message:
                                          "Money transferred successfully",
                                      });
                                    });
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};
