const express = require("express");
const router = express.Router();
const { getTimeSettings ,updateTimeSettings} = require("../controllers/timeSettings.controller");

router.get("/time-settings", getTimeSettings);
router.post("/time-settings", updateTimeSettings);

module.exports = router;
