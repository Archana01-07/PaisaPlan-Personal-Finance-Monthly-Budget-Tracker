const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } = require('../config/constants');
const { isValidCalendarDate } = require('../utils/dates');

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense',
      },
      required: [true, 'Transaction type is required'],
    },
    amountPaise: {
      type: Number,
      required: [true, 'Amount is required'],
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v > 0;
        },
        message: 'Amount must be a positive integer in paise',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ALL_CATEGORIES,
        message: 'Category is not recognized',
      },
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      validate: {
        validator: isValidCalendarDate,
        message: 'Date must be a valid calendar date in YYYY-MM-DD format',
      },
    },
    description: {
      type: String,
      required: [true, 'Merchant or description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: PAYMENT_METHODS,
        message: 'Payment method is not recognized',
      },
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index on userId and date for high-performance monthly and date-range queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
