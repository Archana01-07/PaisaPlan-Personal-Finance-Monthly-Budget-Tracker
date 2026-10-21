import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no entries to display for the selected filters.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-slate-200/80 rounded-xl shadow-xs">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
