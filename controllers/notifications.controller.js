const db = require("../config/db");

// Get all notifications for a user
exports.getNotifications = (req, res) => {
  const userId = req.params.userId;

  db.query(
    "SELECT id, type, message, data, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      res.json(results);
    }
  );
};

// Mark notification as read
exports.markAsRead = (req, res) => {
  const notificationId = req.params.id;

  db.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ?",
    [notificationId],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Notification not found" });

      res.json({ message: "Notification marked as read" });
    }
  );
};

// Create notification (internal use)
exports.createNotification = (userId, type, message, data = {}) => {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO notifications (user_id, type, message, data, is_read, created_at, updated_at) VALUES (?, ?, ?, ?, 0, NOW(), NOW())",
      [userId, type, message, JSON.stringify(data)],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Admin: Send announcement to all users
exports.sendAnnouncement = (req, res) => {
  const { message, title } = req.body;

  if (!message || !title) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  // Get all users
  db.query("SELECT id FROM users", (err, users) => {
    if (err) return res.status(500).json({ error: "DB Error" });

    if (users.length === 0) {
      return res.json({ message: "No users found" });
    }

    // Create notification for each user
    const promises = users.map(user => 
      exports.createNotification(
        user.id, 
        'announcement', 
        message, 
        { title, admin_sent: true }
      )
    );

    Promise.all(promises)
      .then(() => {
        res.json({ 
          message: "Announcement sent to all users successfully",
          userCount: users.length 
        });
      })
      .catch(err => {
        console.error("Error sending announcements:", err);
        res.status(500).json({ error: "Failed to send announcements" });
      });
  });
};
