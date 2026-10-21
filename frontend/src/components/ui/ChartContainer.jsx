import React from 'react';

export default function ChartContainer({ title, subtitle, children, action, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="pt-4 flex-1 w-full min-h-[260px]">{children}</div>
    </div>
  );
}
