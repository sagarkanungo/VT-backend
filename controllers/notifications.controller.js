const db = require("../config/db");

// 🔹 Get all notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;

    const [results] = await db.query(
      `SELECT id, type, message, data, is_read, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(results);
  } catch (err) {
    console.error("DB Error (getNotifications):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const [result] = await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ?",
      [notificationId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Notification not found" });

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("DB Error (markAsRead):", err);
    res.status(500).json({ error: "DB Error" });
  }
};

// 🔹 Create notification (internal use)
exports.createNotification = (userId, type, message, data = {}) => {
  return db.query(
    `INSERT INTO notifications 
     (user_id, type, message, data, is_read, created_at, updated_at) 
     VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
    [userId, type, message, JSON.stringify(data)]
  );
};

// 🔹 Admin: Send announcement to all users
exports.sendAnnouncement = async (req, res) => {
  try {
    const { message, title } = req.body;

    if (!message || !title) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    // Get all users
    const [users] = await db.query("SELECT id FROM users");

    if (users.length === 0) {
      return res.json({ message: "No users found" });
    }

    // Create notification for each user concurrently
    const promises = users.map(user => 
      exports.createNotification(
        user.id,
        'announcement',
        message,
        { title, admin_sent: true }
      )
    );

    await Promise.all(promises);

    res.json({ 
      message: "Announcement sent to all users successfully",
      userCount: users.length
    });
  } catch (err) {
    console.error("Error sending announcements:", err);
    res.status(500).json({ error: "Failed to send announcements" });
  }
};
