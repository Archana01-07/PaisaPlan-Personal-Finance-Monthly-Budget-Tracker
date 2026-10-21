import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-1">{message}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
