const express = require("express");
const router = express.Router();
const {
  requestMoney,
  getUserBalance,
  getTransactions,
  getMoneyRequests, // admin
  sendMoneyForRequest,
  getPendingRequestsCount, // admin count
  getChatMessages,
  sendChatMessage,
  markChatAsRead,
} = require("../controllers/requestMoney.controller");

router.post("/request-money", requestMoney);
router.get("/user/:id/balance", getUserBalance);
router.get("/user/:id/transactions", getTransactions);
// Admin APIs
router.get("/admin/money-requests", getMoneyRequests);
router.get("/admin/money-requests/count", getPendingRequestsCount);
router.post("/admin/send-money", sendMoneyForRequest);
// Admin routes
router.get("/admin/money-requests/:requestId/chat", getChatMessages);
router.post("/admin/money-requests/chat", sendChatMessage);
router.post("/admin/money-requests/chat/read", markChatAsRead);

// User routes
router.get("/user/money-requests/:requestId/chat", getChatMessages);
router.post("/user/money-requests/chat", sendChatMessage);
router.post("/user/money-requests/chat/read", markChatAsRead);

module.exports = router;
