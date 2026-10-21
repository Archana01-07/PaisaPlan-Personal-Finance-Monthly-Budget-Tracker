import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EXPENSE_CATEGORIES, MONTH_NAMES } from '../../utils/constants';
import { formatINR } from '../../utils/currency';

export default function BudgetFormModal({
  isOpen,
  year,
  month,
  currentBudget = null,
  onClose,
  onSave,
  isSaving = false,
}) {
  const [totalLimit, setTotalLimit] = useState('');
  const [allocations, setAllocations] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentBudget && currentBudget.hasBudget) {
      setTotalLimit(String(currentBudget.totalLimitRupees));
      const initialMap = {};
      EXPENSE_CATEGORIES.forEach((cat) => {
        const found = (currentBudget.categories || []).find((c) => c.category === cat);
        initialMap[cat] = found && found.allocatedRupees ? String(found.allocatedRupees) : '0';
      });
      setAllocations(initialMap);
    } else {
      setTotalLimit('');
      const initialMap = {};
      EXPENSE_CATEGORIES.forEach((cat) => {
        initialMap[cat] = '0';
      });
      setAllocations(initialMap);
    }
    setError('');
  }, [currentBudget, isOpen]);

  if (!isOpen) return null;

  const totalNum = parseFloat(totalLimit) || 0;
  const allocatedSum = Object.values(allocations).reduce((acc, curr) => {
    return acc + (parseFloat(curr) || 0);
  }, 0);

  const unallocated = totalNum - allocatedSum;
  const isExceeded = allocatedSum > totalNum;

  const handleAllocationChange = (category, value) => {
    setAllocations((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalNum <= 0) {
      setError('Total monthly budget must be greater than zero');
      return;
    }
    if (isExceeded) {
      setError('Total category allocations cannot exceed the total monthly budget');
      return;
    }

    const categoryAllocations = EXPENSE_CATEGORIES.map((cat) => ({
      category: cat,
      limit: parseFloat(allocations[cat]) || 0,
    }));

    onSave({
      totalLimit: totalNum,
      categoryAllocations,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {currentBudget?.hasBudget ? 'Edit Monthly Budget' : 'Set Monthly Budget'}
            </h3>
            <p className="text-xs text-slate-500">
              {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Total Budget Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Total Monthly Budget (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="25000"
                value={totalLimit}
                onChange={(e) => setTotalLimit(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white text-slate-900 font-semibold transition-all"
                required
              />
            </div>
          </div>

          {/* Allocation summary pill */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Allocated:</span>
              <span className="font-semibold text-slate-800">{formatINR(allocatedSum)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Unallocated:</span>
              <span
                className={`font-bold ${
                  isExceeded ? 'text-rose-600' : 'text-teal-700'
                }`}
              >
                {isExceeded ? 'Exceeded by ' : ''}
                {formatINR(Math.abs(unallocated))}
              </span>
            </div>
          </div>

          {/* Category Allocations Inputs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
              Category Allocations
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div key={cat} className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg">
                  <label className="block text-xs font-medium text-slate-700 truncate mb-1">
                    {cat}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={allocations[cat] ?? '0'}
                      onChange={(e) => handleAllocationChange(cat, e.target.value)}
                      className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isExceeded || totalNum <= 0}
              className="px-5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Budget</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
