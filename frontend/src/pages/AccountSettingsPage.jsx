import React, { useState } from 'react';
import { User, Mail, Save, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/ui/Toast';

export default function AccountSettingsPage() {
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name cannot be empty');
      return;
    }

    try {
      setIsUpdating(true);
      setError('');
      await updateProfile(name.trim());
      setMessage('Display name updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your PaisaPlan account profile and session
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Profile Details Form */}
        <form onSubmit={handleUpdate} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Personal Details
          </h3>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Email address cannot be changed once registered.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Display Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isUpdating ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

        {/* Log Out Section */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Session Management</h4>
            <p className="text-xs text-slate-500">Sign out of your active browser session</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      <Toast message={message} onClose={() => setMessage('')} />
    </div>
  );
}
