const express = require("express");
const router = express.Router();
const { getEntryNumberAnalytics,getEntryNumberDetails,resetAllActiveEntries } = require("../controllers/analytics.controller");

router.get("/admin/entry-analytics", getEntryNumberAnalytics);
router.get(
    "/admin/entry-analytics/:entryNumber",
    getEntryNumberDetails
  );
  router.post("/admin/entry-analytics/reset-all-active", resetAllActiveEntries);

module.exports = router;
