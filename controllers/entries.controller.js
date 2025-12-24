const db = require("../config/db");

// Get all entries for a user
exports.getEntries = (req, res) => {
  const userId = req.params.userId;

  db.query(
    "SELECT * FROM entries WHERE user_id = ? ORDER BY created_at DESC",
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

// Create a new entry
exports.createEntry = (req, res) => {
  const userId = req.params.userId;
  const { day, vehicle, amount, amount2 } = req.body;

  if (!day || !vehicle || amount === undefined) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  db.query(
    "INSERT INTO entries (user_id, `day`, vehicle, amount, amount2) VALUES (?,?,?,?,?)",
    [userId, day, vehicle, amount, amount2 ?? 0],
    (err, result) => {
      if (err) {
        console.error("DB Error (createEntry):", err);
        return res.status(500).json({ error: "DB Error" });
      }
      res.json({ message: "Entry created", id: result.insertId });
    }
  );
};


// Update an existing entry
exports.updateEntry = (req, res) => {
  const entryId = req.params.id;
  const { day, vehicle, amount, amount2 } = req.body;

  if (!day || !vehicle || amount === undefined) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  db.query(
    "UPDATE entries SET `day`=?, vehicle=?, amount=?, amount2=? WHERE id=?",
    [day, vehicle, amount, amount2 ?? 0, entryId],
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


// Delete an entry
exports.deleteEntry = (req, res) => {
  const entryId = req.params.id;

  db.query("DELETE FROM entries WHERE id=?", [entryId], (err, result) => {
    if (err) {
      console.error("DB Error (deleteEntry):", err);
      return res.status(500).json({ error: "DB Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry deleted" });
  });
};
