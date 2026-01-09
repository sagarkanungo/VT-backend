const express = require("express");
const router = express.Router();
const { getEntryNumberAnalytics,getEntryNumberDetails } = require("../controllers/analytics.controller");

router.get("/admin/entry-analytics", getEntryNumberAnalytics);
router.get(
    "/admin/entry-analytics/:entryNumber",
    getEntryNumberDetails
  );

module.exports = router;
