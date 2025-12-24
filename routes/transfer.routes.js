const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transfer.controller");

router.post("/transfer", transferController.transferMoney);

module.exports = router;
