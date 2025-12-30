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
