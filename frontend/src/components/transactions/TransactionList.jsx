import React from 'react';
import { Edit2, Trash2, ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatReadableDate } from '../../utils/dateUtils';
import { formatINR } from '../../utils/currency';
import Badge from '../ui/Badge';

export default function TransactionList({
  transactions = [],
  page = 1,
  totalPages = 1,
  totalCount = 0,
  limit = 10,
  onPageChange,
  onEdit,
  onDelete,
}) {
  const startItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {transactions.map((t) => {
              const isIncome = t.type === 'income';
              return (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="truncate max-w-[220px]">{t.description}</span>
                        {t.notes && (
                          <span className="text-[11px] text-slate-400 font-normal truncate max-w-[220px]">
                            {t.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <Badge variant={isIncome ? 'emerald' : 'slate'} size="sm">
                      {t.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatReadableDate(t.date)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {t.paymentMethod}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-semibold whitespace-nowrap ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatINR(t.amountRupees)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(t)}
                        title="Edit Transaction"
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(t)}
                        title="Delete Transaction"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="block md:hidden divide-y divide-slate-100">
        {transactions.map((t) => {
          const isIncome = t.type === 'income';
          return (
            <div key={t.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{t.description}</h4>
                    <span className="text-[11px] text-slate-500">
                      {formatReadableDate(t.date)} • {t.paymentMethod}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold whitespace-nowrap ${
                    isIncome ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {formatINR(t.amountRupees)}
                </span>
              </div>

              {t.notes && <p className="text-[11px] text-slate-500 italic pl-9">{t.notes}</p>}

              <div className="flex items-center justify-between pt-1 pl-9">
                <Badge variant={isIncome ? 'emerald' : 'slate'} size="sm">
                  {t.category}
                </Badge>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    className="p-1 text-slate-500 hover:text-teal-600 rounded cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(t)}
                    className="p-1 text-slate-500 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-800">{startItem}</strong> to{' '}
          <strong className="text-slate-800">{endItem}</strong> of{' '}
          <strong className="text-slate-800">{totalCount}</strong> transactions
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
