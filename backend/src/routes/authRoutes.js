const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
