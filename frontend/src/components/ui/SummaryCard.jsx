import React from 'react';

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-teal-600',
  iconBg = 'bg-teal-50',
  badge,
  badgeVariant = 'slate',
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-teal-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
        {badge && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              badgeVariant === 'emerald'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : badgeVariant === 'rose'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : badgeVariant === 'amber'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
