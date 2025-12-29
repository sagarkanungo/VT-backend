const express = require("express");
const router = express.Router();
const { getTimeSettings ,updateTimeSettings} = require("../controllers/timeSettings.controller");
const authenticateUser = require("../middleware/authenticateAdmin");

router.get("/time-settings", authenticateUser, getTimeSettings);
router.post("/time-settings", authenticateUser, updateTimeSettings);

module.exports = router;
