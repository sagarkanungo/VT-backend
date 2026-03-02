const db = require("../config/db");

// 🔹 Get all entries for a user
exports.getEntries = (req, res) => {
  const userId = req.params.userId;

  db.query(
    `SELECT 
       id,
       user_id,
       entry_number,
       amount,
       amount2,
       total_amount,
       created_at
     FROM entries
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("DB Error (getEntries):", err);
        return res.status(500).json({ error: "DB Error" });
      }
      res.json(results);
    }
  );
};

// 🔹 Create a new entry
// exports.createEntry = (req, res) => {
//   const userId = req.params.userId;
//   const { entry_number, amount, amount2, total_amount } = req.body;

//   if (entry_number === undefined || entry_number === null || entry_number === "") {
//     return res.status(400).json({ error: "Entry number is required" });
//   }

//   const entryNum = parseInt(entry_number);
//   if (isNaN(entryNum) || entryNum < 0 || entryNum > 9999) {
//     return res.status(400).json({ error: "Entry number must be between 0 and 9999" });
//   }

//   const amt1 = Number(amount || 0);
//   const amt2 = Number(amount2 || 0);

//   // ✅ Backend-safe total calculation
//   const finalTotal = total_amount !== undefined
//     ? Number(total_amount)
//     : amt1 + amt2;

//   db.query(
//     `INSERT INTO entries 
//      (user_id, entry_number, amount, amount2, total_amount) 
//      VALUES (?,?,?,?,?)`,
//     [userId, entryNum, amt1, amt2, finalTotal],
//     (err, result) => {
//       if (err) {
//         console.error("DB Error (createEntry):", err);
//         return res.status(500).json({ error: "DB Error" });
//       }
//       res.json({
//         message: "Entry created",
//         id: result.insertId
//       });
//     }
//   );
// };

exports.createEntry = (req, res) => {
  const userId = req.params.userId;
  const { entry_number, amount, amount2, total_amount } = req.body;

  if (entry_number === undefined || entry_number === null || entry_number === "") {
    return res.status(400).json({ error: "Entry number is required" });
  }

  const entryNum = parseInt(entry_number);
  if (isNaN(entryNum) || entryNum < 0 || entryNum > 9999) {
    return res.status(400).json({ error: "Entry number must be between 0 and 9999" });
  }

  const amt1 = Number(amount || 0);
  const amt2 = Number(amount2 || 0);

  const finalTotal =
    total_amount !== undefined ? Number(total_amount) : amt1 + amt2;

  if (finalTotal <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  // Get connection from pool
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: err.message });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ error: err.message });
      }

      // 1️⃣ Check user balance
      connection.query(
        "SELECT total_balance FROM users WHERE id = ?",
        [userId],
        (err, userResult) => {
          if (err)
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ error: err.message });
            });

          if (userResult.length === 0)
            return connection.rollback(() => {
              connection.release();
              res.status(404).json({ error: "User not found" });
            });

          const currentBalance = Number(userResult[0].total_balance || 0);

          if (currentBalance < finalTotal)
            return connection.rollback(() => {
              connection.release();
              res.status(400).json({ error: "Insufficient balance" });
            });

          // 2️⃣ Deduct balance
          connection.query(
            "UPDATE users SET total_balance = total_balance - ? WHERE id = ?",
            [finalTotal, userId],
            (err) => {
              if (err)
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ error: err.message });
                });

              // 3️⃣ Insert entry
              connection.query(
                `INSERT INTO entries 
                 (user_id, entry_number, amount, amount2, total_amount) 
                 VALUES (?,?,?,?,?)`,
                [userId, entryNum, amt1, amt2, finalTotal],
                (err, result) => {
                  if (err)
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({ error: err.message });
                    });

                  // 4️⃣ Insert transaction history
                  connection.query(
                    `INSERT INTO transactions (user_id, type, amount, description)
                     VALUES (?, 'debit', ?, ?)`,
                    [
                      userId,
                      finalTotal,
                      `Entry #${entryNum} expense`,
                    ],
                    (err) => {
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
                        res.json({
                          message: "Entry created & balance deducted",
                          entry_id: result.insertId,
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
    });
  });
};


// 🔹 Update an existing entry
exports.updateEntry = (req, res) => {
  const entryId = req.params.id;
  const { entry_number, amount, amount2, total_amount } = req.body;

  if (entry_number === undefined || entry_number === null || entry_number === "") {
    return res.status(400).json({ error: "Entry number is required" });
  }

  const entryNum = parseInt(entry_number);
  if (isNaN(entryNum) || entryNum < 0 || entryNum > 9999) {
    return res.status(400).json({ error: "Entry number must be between 0 and 9999" });
  }

  const amt1 = Number(amount || 0);
  const amt2 = Number(amount2 || 0);

  // ✅ Backend-safe total calculation
  const finalTotal = total_amount !== undefined
    ? Number(total_amount)
    : amt1 + amt2;

  db.query(
    `UPDATE entries 
     SET entry_number=?, amount=?, amount2=?, total_amount=? 
     WHERE id=?`,
    [entryNum, amt1, amt2, finalTotal, entryId],
    (err, result) => {
      if (err) {
        console.error("DB Error (updateEntry):", err);
        return res.status(500).json({ error: "DB Error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json({ message: "Entry updated" });
    }
  );
};

// 🔹 Delete an entry
exports.deleteEntry = (req, res) => {
  const entryId = req.params.id;

  db.query(
    "DELETE FROM entries WHERE id=?",
    [entryId],
    (err, result) => {
      if (err) {
        console.error("DB Error (deleteEntry):", err);
        return res.status(500).json({ error: "DB Error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json({ message: "Entry deleted" });
    }
  );
};
