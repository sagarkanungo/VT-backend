const express = require("express");
const router = express.Router();
const entriesController = require("../controllers/entries.controller");

// Get all entries for a user
router.get("/user/:userId/entries", entriesController.getEntries);

// Create a new entry
router.post("/user/:userId/entries", entriesController.createEntry);

// Update an entry
router.put("/entries/:id", entriesController.updateEntry);

// Delete an entry
router.delete("/entries/:id", entriesController.deleteEntry);

module.exports = router;
