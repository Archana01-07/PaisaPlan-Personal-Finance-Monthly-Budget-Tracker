const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');
const { validate, transactionSchema } = require('../middleware/validate');

// All transaction routes require authentication
router.use(requireAuth);

router.get('/', transactionController.getTransactions);
router.post('/', validate(transactionSchema), transactionController.createTransaction);
router.get('/:id', transactionController.getTransactionById);
router.patch('/:id', validate(transactionSchema), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
