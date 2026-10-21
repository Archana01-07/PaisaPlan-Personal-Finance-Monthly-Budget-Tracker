const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES } = require('../config/constants');

const categoryAllocationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: {
        values: EXPENSE_CATEGORIES,
        message: 'Category allocation must belong to expense categories',
      },
    },
    limitPaise: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v >= 0;
        },
        message: 'Category limit must be a non-negative integer in paise',
      },
    },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be valid'],
      max: [2100, 'Year must be valid'],
    },
    totalLimitPaise: {
      type: Number,
      required: [true, 'Total budget limit is required'],
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v > 0;
        },
        message: 'Total budget limit must be a positive integer in paise',
      },
    },
    categoryAllocations: {
      type: [categoryAllocationSchema],
      default: [],
      validate: {
        validator: function (allocations) {
          const sum = allocations.reduce((acc, curr) => acc + curr.limitPaise, 0);
          return sum <= this.totalLimitPaise;
        },
        message: 'Total category allocations cannot exceed the total monthly budget',
      },
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

// Ensure only one budget per user per month
budgetSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
