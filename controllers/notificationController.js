const db = require("../config/db");

/**
 * -------------------------------------------------------
 * Get unread notification count
 * GET /api/notifications/count
 * -------------------------------------------------------
 */
exports.getNotificationCount = (req, res) => {
  const userId = req.user?.id || req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  db.query(
    `SELECT COUNT(*) AS unreadCount
     FROM notifications
     WHERE recipient_id = ? AND is_read = 0`,
    [userId],
    (err, result) => {
      if (err) {
        console.error("❌ getNotificationCount DB Error:", err);
        return res.status(500).json({ error: "DB Error" });
      }

      res.json({
        unreadCount: result[0]?.unreadCount || 0,
      });
    }
  );
};

/**
 * -------------------------------------------------------
 * Get user notifications (latest first)
 * GET /api/notifications
 * -------------------------------------------------------
 */
exports.getUserNotifications = (req, res) => {
  const userId = req.user?.id || req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  db.query(
    `SELECT id, type, title, message, amount, is_read, created_at
     FROM notifications
     WHERE recipient_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId],
    (err, result) => {
      if (err) {
        console.error("❌ getUserNotifications DB Error:", err);
        return res.status(500).json({ error: "DB Error" });
      }

      res.json(result);
    }
  );
};

/**
 * -------------------------------------------------------
 * Mark single notification as read
 * PATCH /api/notifications/:id/read
 * -------------------------------------------------------
 */
exports.markNotificationAsRead = (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user?.id || req.body.userId;

  if (!notificationId || !userId) {
    return res.status(400).json({ message: "Invalid request" });
  }

  db.query(
    `UPDATE notifications
     SET is_read = 1
     WHERE id = ? AND recipient_id = ?`,
    [notificationId, userId],
    (err, result) => {
      if (err) {
        console.error("❌ markNotificationAsRead DB Error:", err);
        return res.status(500).json({ error: "DB Error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ message: "Notification marked as read" });
    }
  );
};

/**
 * -------------------------------------------------------
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 * -------------------------------------------------------
 */
exports.markAllNotificationsAsRead = (req, res) => {
  const userId = req.user?.id || req.body.userId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  db.query(
    `UPDATE notifications
     SET is_read = 1
     WHERE recipient_id = ? AND is_read = 0`,
    [userId],
    (err, result) => {
      if (err) {
        console.error("❌ markAllNotificationsAsRead DB Error:", err);
        return res.status(500).json({ error: "DB Error" });
      }

      res.json({
        message: "All notifications marked as read",
        updated: result.affectedRows,
      });
    }
  );
};

/**
 * -------------------------------------------------------
 * Create notification (used internally)
 * -------------------------------------------------------
 */
exports.createNotification = ({
  type,
  title,
  message,
  sender_id = null,
  recipient_id = null,
  amount = null,
}) => {
  db.query(
    `INSERT INTO notifications
     (type, title, message, sender_id, recipient_id, amount, is_read)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [type, title, message, sender_id, recipient_id, amount],
    (err) => {
      if (err) {
        console.error("❌ createNotification DB Error:", err);
      }
    }
  );
};
