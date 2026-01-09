// controllers/analytics.controller.js
const db = require("../config/db"); // updated config should export a pool now

// ====================== GET ENTRY NUMBER ANALYTICS ======================
exports.getEntryNumberAnalytics = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        entry_number,
        SUM(total_amount) AS total_amount
      FROM entries
      GROUP BY entry_number
    `);

    const formatted = results.map(r => ({
      entryNumber: r.entry_number,
      totalAmount: Number(r.total_amount || 0)
    }));

    res.json(formatted);
  } catch (err) {
    console.error("DB Error (analytics):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// ====================== GET ENTRY NUMBER DETAILS ======================
exports.getEntryNumberDetails = async (req, res) => {
  const { entryNumber } = req.params;

  try {
    const [results] = await db.query(
      `
      SELECT
        u.id AS userId,
        u.full_name AS userName,
        u.phone AS mobile,
        SUM(e.total_amount) AS totalAmount
      FROM entries e
      JOIN users u ON u.id = e.user_id
      WHERE e.entry_number = ?
      GROUP BY e.user_id, u.full_name, u.phone
      `,
      [entryNumber]
    );

    const users = results.map(row => ({
      userId: row.userId,
      name: row.userName,
      mobile: row.mobile,
      amount: Number(row.totalAmount || 0)
    }));

    const totalAmount = users.reduce((sum, u) => sum + u.amount, 0);

    res.json({
      entryNumber: Number(entryNumber),
      totalUsers: users.length,
      totalAmount,
      users
    });
  } catch (err) {
    console.error("DB Error (entry details):", err);
    res.status(500).json({ error: "DB Error" });
  }
};
