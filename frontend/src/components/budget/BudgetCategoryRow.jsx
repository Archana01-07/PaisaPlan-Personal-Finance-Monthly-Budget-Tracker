import React from 'react';
import { formatINR } from '../../utils/currency';
import Badge from '../ui/Badge';

export default function BudgetCategoryRow({ categoryData }) {
  const {
    category,
    allocatedRupees,
    spentRupees,
    remainingRupees,
    percentageUsed,
    progressPercent,
    status,
    isUnallocated,
  } = categoryData;

  const isOver = status === 'Over budget' || remainingRupees < 0;
  const isApproaching = status === 'Approaching limit';

  // Badge variant
  const badgeVariant = isOver ? 'rose' : isApproaching ? 'amber' : 'teal';

  // Progress bar color
  const progressBg = isOver
    ? 'bg-rose-500'
    : isApproaching
    ? 'bg-amber-500'
    : 'bg-teal-600';

  return (
    <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs transition-all hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{category}</span>
          {isUnallocated && (
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              Unallocated spending
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">
            {percentageUsed}% used
          </span>
          <Badge variant={badgeVariant} size="sm">
            {status}
          </Badge>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-300 ${progressBg}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Numeric Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
        <div>
          <span className="text-[11px] text-slate-400 block">Allocated</span>
          <span className="font-semibold text-slate-700">
            {isUnallocated ? '₹0' : formatINR(allocatedRupees)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Spent</span>
          <span className="font-semibold text-slate-800">{formatINR(spentRupees)}</span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">
            {isOver ? 'Over budget' : 'Remaining'}
          </span>
          <span
            className={`font-bold ${
              isOver ? 'text-rose-600' : 'text-slate-800'
            }`}
          >
            {formatINR(Math.abs(remainingRupees))}
          </span>
        </div>
      </div>
    </div>
  );
}
