const db = require("../config/db"); // Make sure db is mysql2 promise pool

/* ================= GET TIME SETTINGS ================= */
exports.getTimeSettings = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM time_settings ORDER BY id DESC LIMIT 1"
    );

    if (!rows.length) {
      return res.json({
        enabled: false,
        startTime: "00:00",
        endTime: "23:59",
        timezone: "Asia/Kolkata",
      });
    }

    const setting = rows[0];

    res.json({
      enabled: !!setting.enabled,
      startTime: setting.start_time.substring(0, 5),
      endTime: setting.end_time.substring(0, 5),
      timezone: setting.timezone,
    });
  } catch (err) {
    console.error("DB Error (getTimeSettings):", err);
    res.status(500).json({ error: "Failed to fetch time settings" });
  }
};

/* ================= UPDATE TIME SETTINGS ================= */
exports.updateTimeSettings = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    const { enabled, startTime, endTime, timezone } = req.body;

    console.log({ enabled, startTime, endTime, timezone });

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Invalid enabled value" });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: "Start time and end time are required",
      });
    }

    const startTimeFormatted = `${startTime}:00`;
    const endTimeFormatted = `${endTime}:00`;

    // Use a transaction to avoid issues if multiple queries run at the same time
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Delete old settings
      await conn.query("DELETE FROM time_settings");

      // Insert new settings
      await conn.query(
        `INSERT INTO time_settings (enabled, start_time, end_time, timezone)
         VALUES (?, ?, ?, ?)`,
        [enabled, startTimeFormatted, endTimeFormatted, timezone || "Asia/Kolkata"]
      );

      await conn.commit();

      res.json({
        success: true,
        message: "Time settings updated successfully",
      });
    } catch (err) {
      await conn.rollback();
      console.error("DB Transaction Error (updateTimeSettings):", err);
      res.status(500).json({ error: "Failed to update time settings" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("DB Error (updateTimeSettings):", err);
    res.status(500).json({ error: "Failed to update time settings" });
  }
};
