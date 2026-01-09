const db = require("../config/db");

exports.getEntryNumberAnalytics = (req, res) => {
  db.query(
    `
    SELECT 
      entry_number,
      SUM(total_amount) AS total_amount
    FROM entries
    GROUP BY entry_number
    `,
    (err, results) => {
      if (err) {
        console.error("DB Error (analytics):", err);
        return res.status(500).json({ error: "DB Error" });
      }

      // Convert to numbers safely
      const formatted = results.map(r => ({
        entryNumber: r.entry_number,
        totalAmount: Number(r.total_amount || 0)
      }));

      res.json(formatted);
    }
  );
};

exports.getEntryNumberDetails = (req, res) => {
  const { entryNumber } = req.params;

  const sql = `
    SELECT
      u.id AS userId,
      u.full_name AS userName,
      u.phone AS mobile,
      SUM(e.total_amount) AS totalAmount
    FROM entries e
    JOIN users u ON u.id = e.user_id
    WHERE e.entry_number = ?
    GROUP BY e.user_id, u.full_name, u.phone
  `;

  db.query(sql, [entryNumber], (err, results) => {
    if (err) {
      console.error("DB Error (entry details):", err);
      return res.status(500).json({ error: "DB Error" });
    }

    const users = results.map(row => ({
      userId: row.userId,
      name: row.userName,
      mobile: row.mobile,
      amount: Number(row.totalAmount || 0)
    }));

    const totalAmount = users.reduce(
      (sum, u) => sum + u.amount,
      0
    );

    res.json({
      entryNumber: Number(entryNumber),
      totalUsers: users.length,
      totalAmount,
      users
    });
  });
};



