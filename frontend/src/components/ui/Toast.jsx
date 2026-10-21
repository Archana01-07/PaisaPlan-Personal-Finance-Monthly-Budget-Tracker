import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-3 duration-200 bg-white border-slate-200">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}
      >
        {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      </div>
      <p className="text-xs font-medium text-slate-800">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 ml-2 p-1 rounded-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
