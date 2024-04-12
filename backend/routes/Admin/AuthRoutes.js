const express = require('express');
const router = express.Router();
const { authController } = require('../../controllers/Auth/AuthController');

router.route('/login', authController.loginUser);

module.exports = router;