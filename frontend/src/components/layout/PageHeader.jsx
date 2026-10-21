import React from 'react';
import MonthSelector from './MonthSelector';

export default function PageHeader({
  title,
  subtitle,
  showMonthSelector = true,
  action,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showMonthSelector && <MonthSelector />}
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
