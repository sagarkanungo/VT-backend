app.post("/api/request-money", async (req, res) => {
    const { user_id, message } = req.body;
  
    db.query(
      "INSERT INTO chat_requests (user_id, message) VALUES (?,?)",
      [user_id, message],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Request sent to admin" });
      }
    );
  });

  
  app.post("/api/request-money", async (req, res) => {
    const { user_id, message } = req.body;
  
    db.query(
      "INSERT INTO chat_requests (user_id, message) VALUES (?,?)",
      [user_id, message],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Request sent to admin" });
      }
    );
  });

  
  app.get("/api/user/:id/balance", (req,res) => {
    const user_id = req.params.id;
    db.query(
      "SELECT total_balance FROM users WHERE id = ?",
      [user_id],
      (err, result) => {
        if(err) return res.status(500).json({error:"DB Error"});
        res.json({ balance: result[0]?.total_balance || 0 });
      }
    );
  });

  
  app.get("/api/user/:id/transactions", (req,res) => {
    const user_id = req.params.id;
    db.query(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC",
      [user_id],
      (err,result) => {
        if(err) return res.status(500).json({error:"DB Error"});
        res.json(result);
      }
    );
  });
  