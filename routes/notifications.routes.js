const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications.controller");
const authenticateUser = require("../middleware/authenticateAdmin");

// Get all notifications for a user
router.get("/notifications/:userId", notificationsController.getNotifications);

// Mark notification as read
router.put("/notifications/:id/read", notificationsController.markAsRead);

// Admin: Send announcement to all users
router.post("/admin/send-announcement", authenticateUser, notificationsController.sendAnnouncement);

module.exports = router;
