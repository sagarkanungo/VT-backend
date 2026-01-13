const db = require("../config/db");

/* ================= GET TIME SETTINGS ================= */
exports.getTimeSettings = (req, res) => {
  db.query(
    "SELECT * FROM time_settings ORDER BY id DESC LIMIT 1",
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to fetch time settings" });
      }

      if (!rows.length) {
        return res.json({
          enabled: false,
          forceDisable: false,
          startTime: "00:00",
          endTime: "23:59",
          timezone: "Asia/Kolkata",
        });
      }

      const setting = rows[0];

      res.json({
        enabled: !!setting.enabled,
        forceDisable: !!setting.force_disable,
        startTime: setting.start_time.substring(0, 5),
        endTime: setting.end_time.substring(0, 5),
        timezone: setting.timezone,
      });
    }
  );
};

/* ================= UPDATE TIME SETTINGS ================= */
/* ================= UPDATE TIME SETTINGS ================= */
exports.updateTimeSettings = (req, res) => {
  console.log("REQ BODY:", req.body);
  const { enabled, forceDisable, startTime, endTime, timezone } = req.body;

  if (typeof enabled !== "boolean" || typeof forceDisable !== "boolean") {
    return res.status(400).json({ error: "Invalid enabled or forceDisable value" });
  }

  const startTimeFormatted = startTime ? `${startTime}:00` : "00:00";
  const endTimeFormatted = endTime ? `${endTime}:00` : "23:59";

  // Keep only one row
  db.query("DELETE FROM time_settings", (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to reset settings" });
    }

    db.query(
      `INSERT INTO time_settings (enabled, force_disable, start_time, end_time, timezone)
       VALUES (?, ?, ?, ?, ?)`,
      [
        enabled,
        forceDisable, // <--- save force_disable
        startTimeFormatted,
        endTimeFormatted,
        timezone || "Asia/Kolkata",
      ],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Failed to update time settings" });
        }

        res.json({
          success: true,
          message: "Time settings updated successfully",
        });
      }
    );
  });
};

