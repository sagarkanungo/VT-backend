const express = require("express");
const router = express.Router();
const {
  requestMoney,
  getUserBalance,
  getTransactions,
   getMoneyRequests,       // admin
  sendMoneyForRequest,
  getPendingRequestsCount, // admin count
} = require("../controllers/requestMoney.controller");

router.post("/request-money", requestMoney);
router.get("/user/:id/balance", getUserBalance);
router.get("/user/:id/transactions", getTransactions);
// Admin APIs
router.get("/admin/money-requests", getMoneyRequests);
router.get("/admin/money-requests/count", getPendingRequestsCount);
router.post("/admin/send-money", sendMoneyForRequest);

module.exports = router;
