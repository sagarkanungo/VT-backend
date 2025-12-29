const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const upload = require("../middleware/upload.middleware");

// Admin routes
router.get("/admin/users", usersController.getAllUsers);
router.get("/admin/users/:id", usersController.getUserById);
router.put("/admin/users/:id", upload.single("id_document"), usersController.updateUser);router.delete("/admin/users/:id", usersController.deleteUser);
router.put("/admin/users/block/:id", usersController.toggleBlockUser);


module.exports = router;
