const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload.middleware');
const authController = require('../controllers/auth.controller');

router.post('/register', upload.single('id_document'), authController.register);
router.post('/login', authController.login);

module.exports = router;
