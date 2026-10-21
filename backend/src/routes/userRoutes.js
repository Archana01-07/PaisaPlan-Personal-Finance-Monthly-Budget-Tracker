const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { validate, updateProfileSchema } = require('../middleware/validate');

router.patch('/me', requireAuth, validate(updateProfileSchema), userController.updateMe);

module.exports = router;
