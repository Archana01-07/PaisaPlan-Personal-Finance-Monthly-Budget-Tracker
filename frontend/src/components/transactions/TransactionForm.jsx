import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Info, Calculator } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';
import { getTodayDateString } from '../../utils/dateUtils';
import { formatINR, paiseToRupees, rupeesToPaise } from '../../utils/currency';
import { budgetApi } from '../../api/budgetApi';
import { useDate } from '../../context/DateContext';

export default function TransactionForm({
  initialData = null,
  isEdit = false,
  onSubmit,
  isSubmitting = false,
}) {
  const navigate = useNavigate();
  const { selectedYear, selectedMonth } = useDate();

  const getDefaultDate = () => {
    if (initialData?.date) return initialData.date;
    const now = new Date();
    if (now.getFullYear() === selectedYear && (now.getMonth() + 1) === selectedMonth) {
      return getTodayDateString();
    }
    const day = String(Math.min(now.getDate(), 28)).padStart(2, '0');
    const m = String(selectedMonth).padStart(2, '0');
    return `${selectedYear}-${m}-${day}`;
  };

  const [type, setType] = useState(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData ? String(initialData.amountRupees) : '');
  const [category, setCategory] = useState(
    initialData?.category || (type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0])
  );
  const [date, setDate] = useState(getDefaultDate());
  const [description, setDescription] = useState(initialData?.description || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || 'UPI');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [formErrors, setFormErrors] = useState({});
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [loadingBudget, setLoadingBudget] = useState(false);

  // When type changes, adjust default category
  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'expense') {
      setCategory(EXPENSE_CATEGORIES[0]);
    } else {
      setCategory(INCOME_CATEGORIES[0]);
    }
  };

  // Fetch monthly budget to calculate the live Budget Preview
  useEffect(() => {
    if (type !== 'expense' || !date) {
      setBudgetStatus(null);
      return;
    }

    const parts = date.split('-');
    if (parts.length !== 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);

    let isMounted = true;
    async function fetchBudget() {
      try {
        setLoadingBudget(true);
        const res = await budgetApi.getBudget(month, year);
        if (isMounted && res.data) {
          setBudgetStatus(res.data);
        }
      } catch (err) {
        if (isMounted) setBudgetStatus(null);
      } finally {
        if (isMounted) setLoadingBudget(false);
      }
    }

    fetchBudget();
    return () => {
      isMounted = false;
    };
  }, [type, date]);

  // Calculate live budget preview for category
  let budgetPreview = null;
  if (type === 'expense' && budgetStatus && budgetStatus.hasBudget) {
    const categoryBudget = (budgetStatus.categories || []).find((c) => c.category === category);
    if (categoryBudget && categoryBudget.allocatedPaise > 0) {
      // Current spending stored in DB
      let currentSpentPaise = categoryBudget.spentPaise;
      // If editing this transaction, subtract original amount
      if (isEdit && initialData && initialData.category === category && initialData.type === 'expense') {
        currentSpentPaise = Math.max(0, currentSpentPaise - initialData.amountPaise);
      }

      const inputRupees = parseFloat(amount) || 0;
      const inputPaise = rupeesToPaise(inputRupees);
      const afterSavingSpentPaise = currentSpentPaise + inputPaise;
      const remainingPaise = categoryBudget.allocatedPaise - afterSavingSpentPaise;
      const isOver = remainingPaise < 0;

      budgetPreview = {
        hasAllocation: true,
        allocatedRupees: categoryBudget.allocatedRupees,
        afterSavingSpentRupees: paiseToRupees(afterSavingSpentPaise),
        remainingRupees: paiseToRupees(Math.abs(remainingPaise)),
        isOver,
      };
    } else {
      budgetPreview = {
        hasAllocation: false,
        message: 'No category budget set',
      };
    }
  } else if (type === 'expense' && budgetStatus && !budgetStatus.hasBudget) {
    budgetPreview = {
      hasAllocation: false,
      message: 'No monthly budget set for this month',
    };
  }

  const validate = () => {
    const errors = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Please enter a positive amount greater than 0';
    } else {
      const parts = String(amount).split('.');
      if (parts.length > 1 && parts[1].length > 2) {
        errors.amount = 'Amount cannot have more than two decimal places';
      }
    }

    if (!description.trim()) {
      errors.description = 'Merchant or description is required';
    } else if (description.length > 200) {
      errors.description = 'Description cannot exceed 200 characters';
    }

    if (!date) {
      errors.date = 'Date is required';
    }

    if (!category) {
      errors.category = 'Category is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      date,
      description: description.trim(),
      paymentMethod,
      notes: notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Toggle */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Transaction Type
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2.5 px-4 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              type === 'expense'
                ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs ring-1 ring-rose-400'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2.5 px-4 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              type === 'income'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs ring-1 ring-emerald-400'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Income
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Amount (₹ INR) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                formErrors.amount
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
          </div>
          {formErrors.amount && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {formErrors.amount}
            </p>
          )}
        </div>

        {/* Category Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
          >
            {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Date */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Transaction Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all text-slate-800 ${
              formErrors.date
                ? 'border-rose-300 focus:ring-rose-500'
                : 'border-slate-300 focus:ring-teal-500'
            }`}
          />
          {formErrors.date && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {formErrors.date}
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Payment Method <span className="text-rose-500">*</span>
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description / Merchant */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Merchant or Description <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Supermarket Grocery Store, Campus Cafeteria, Metro Pass"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
            formErrors.description
              ? 'border-rose-300 focus:ring-rose-500'
              : 'border-slate-300 focus:ring-teal-500'
          }`}
        />
        {formErrors.description && (
          <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {formErrors.description}
          </p>
        )}
      </div>

      {/* Optional Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Optional Notes
        </label>
        <textarea
          rows={2}
          placeholder="Add context or notes for your records..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
        />
      </div>

      {/* Live Budget Preview (For Expenses) */}
      {type === 'expense' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-slate-800">
              Budget Impact Preview ({category})
            </span>
          </div>

          {loadingBudget ? (
            <p className="text-xs text-slate-500">Checking category budget...</p>
          ) : budgetPreview ? (
            budgetPreview.hasAllocation ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Category allocation:</span>
                  <span className="font-semibold text-slate-800">
                    {formatINR(budgetPreview.allocatedRupees)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>After saving:</span>
                  <span
                    className={`font-bold ${
                      budgetPreview.isOver ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {budgetPreview.isOver
                      ? `${formatINR(budgetPreview.remainingRupees)} over budget`
                      : `${formatINR(budgetPreview.remainingRupees)} remaining`}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">{budgetPreview.message}</p>
            )
          ) : (
            <p className="text-xs text-slate-500 italic">No category budget set.</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{isEdit ? 'Update Transaction' : 'Save Transaction'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
