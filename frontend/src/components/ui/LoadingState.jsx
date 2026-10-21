import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading financial records...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}
