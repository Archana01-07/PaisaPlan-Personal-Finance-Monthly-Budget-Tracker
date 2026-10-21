const { z } = require('zod');
const { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } = require('../config/constants');
const { isValidCalendarDate } = require('../utils/dates');
const { rupeesToPaise } = require('../utils/currency');

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Full name is required').max(100, 'Name cannot exceed 100 characters'),
    email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Full name cannot be empty').max(100, 'Name cannot exceed 100 characters'),
});

const transactionSchema = z
  .object({
    type: z.enum(['income', 'expense'], {
      errorMap: () => ({ message: 'Transaction type must be income or expense' }),
    }),
    amount: z
      .union([z.number(), z.string()])
      .refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      }, 'Amount must be greater than zero')
      .refine((val) => {
        const str = String(val);
        const parts = str.split('.');
        return parts.length === 1 || parts[1].length <= 2;
      }, 'Amount cannot have more than two decimal places'),
    category: z.string().trim().min(1, 'Category is required'),
    date: z.string().refine(isValidCalendarDate, 'Date must be a valid calendar date in YYYY-MM-DD format'),
    description: z.string().trim().min(1, 'Merchant or description is required').max(200, 'Description cannot exceed 200 characters'),
    paymentMethod: z.enum(PAYMENT_METHODS, {
      errorMap: () => ({ message: 'Invalid payment method' }),
    }),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === 'expense') {
        return EXPENSE_CATEGORIES.includes(data.category);
      }
      return INCOME_CATEGORIES.includes(data.category);
    },
    {
      message: 'Category is not valid for the selected transaction type',
      path: ['category'],
    }
  );

const budgetSchema = z
  .object({
    totalLimit: z
      .union([z.number(), z.string()])
      .refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      }, 'Total monthly budget must be greater than zero'),
    categoryAllocations: z
      .array(
        z.object({
          category: z.enum(EXPENSE_CATEGORIES, {
            errorMap: () => ({ message: 'Category must be a valid expense category' }),
          }),
          limit: z.union([z.number(), z.string()]).refine((val) => {
            const num = Number(val);
            return !isNaN(num) && num >= 0;
          }, 'Category allocation must be non-negative'),
        })
      )
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      const totalPaise = rupeesToPaise(data.totalLimit);
      const allocatedPaise = (data.categoryAllocations || []).reduce(
        (acc, item) => acc + rupeesToPaise(item.limit),
        0
      );
      return allocatedPaise <= totalPaise;
    },
    {
      message: 'Category allocations cannot exceed total monthly budget',
      path: ['categoryAllocations'],
    }
  );

function validate(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: formattedErrors[0]?.message || 'Validation failed',
          errors: formattedErrors,
        });
      }
      next(err);
    }
  };
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  transactionSchema,
  budgetSchema,
};
