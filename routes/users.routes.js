const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");

// Admin routes
router.get("/admin/users", usersController.getAllUsers);
router.get("/admin/users/:id", usersController.getUserById);
router.put("/admin/users/:id", usersController.updateUser);
router.delete("/admin/users/:id", usersController.deleteUser);
router.put("/admin/users/block/:id", usersController.toggleBlockUser);


module.exports = router;
