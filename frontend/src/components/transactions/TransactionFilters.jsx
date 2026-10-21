import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/constants';

export default function TransactionFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}) {
  const categories =
    type === 'income'
      ? INCOME_CATEGORIES
      : type === 'expense'
      ? EXPENSE_CATEGORIES
      : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={type}
            onChange={(e) => {
              onTypeChange(e.target.value);
              onCategoryChange('all');
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white text-slate-700 font-medium"
          >
            <option value="all">All Types (Income & Expense)</option>
            <option value="expense">Expenses only</option>
            <option value="income">Income only</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white text-slate-700 font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white text-slate-700 font-medium"
          >
            <option value="date-desc">Date (Newest first)</option>
            <option value="date-asc">Date (Oldest first)</option>
            <option value="amount-desc">Amount (Highest first)</option>
            <option value="amount-asc">Amount (Lowest first)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
