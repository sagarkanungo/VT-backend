const express = require("express");
const router = express.Router();
const { getEntryNumberAnalytics } = require("../controllers/analytics.controller");

router.get("/admin/entry-analytics", getEntryNumberAnalytics);

module.exports = router;
