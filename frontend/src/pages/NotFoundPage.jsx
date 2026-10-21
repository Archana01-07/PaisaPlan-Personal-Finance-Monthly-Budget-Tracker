import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-extrabold text-slate-300">404</h1>
      <h2 className="text-xl font-bold text-slate-800 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
