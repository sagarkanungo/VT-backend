// controllers/entries.controller.js
const db = require("../config/db"); // now uses promise pool

// 🔹 Get all entries for a user
exports.getEntries = async (req, res) => {
  try {
    const userId = req.params.userId;

    const [results] = await db.query(
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
      [userId]
    );

    res.json(results);
  } catch (err) {
    console.error("DB Error (getEntries):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Create a new entry
exports.createEntry = async (req, res) => {
  try {
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
    const finalTotal = total_amount !== undefined ? Number(total_amount) : amt1 + amt2;

    const [result] = await db.query(
      `INSERT INTO entries 
       (user_id, entry_number, amount, amount2, total_amount) 
       VALUES (?,?,?,?,?)`,
      [userId, entryNum, amt1, amt2, finalTotal]
    );

    res.json({
      message: "Entry created",
      id: result.insertId
    });
  } catch (err) {
    console.error("DB Error (createEntry):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Update an existing entry
exports.updateEntry = async (req, res) => {
  try {
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
    const finalTotal = total_amount !== undefined ? Number(total_amount) : amt1 + amt2;

    const [result] = await db.query(
      `UPDATE entries 
       SET entry_number=?, amount=?, amount2=?, total_amount=? 
       WHERE id=?`,
      [entryNum, amt1, amt2, finalTotal, entryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry updated" });
  } catch (err) {
    console.error("DB Error (updateEntry):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Delete an entry
exports.deleteEntry = async (req, res) => {
  try {
    const entryId = req.params.id;

    const [result] = await db.query(
      "DELETE FROM entries WHERE id=?",
      [entryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error("DB Error (deleteEntry):", err);
    res.status(500).json({ error: "DB Error" });
  }
};
