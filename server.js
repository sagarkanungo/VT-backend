const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Node server running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
