const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/notifications/count", notificationController.getNotificationCount);
router.get("/notifications", notificationController.getUserNotifications);
router.patch(
  "/notifications/:id/read",
  notificationController.markNotificationAsRead
);
router.patch(
  "/notifications/read-all",
  notificationController.markAllNotificationsAsRead
);

module.exports = router;
