const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { requireAuth } = require('../middleware/auth');
const { validate, budgetSchema } = require('../middleware/validate');

router.use(requireAuth);

router.get('/', budgetController.getBudget);
router.put('/:year/:month', validate(budgetSchema), budgetController.upsertBudget);

module.exports = router;
