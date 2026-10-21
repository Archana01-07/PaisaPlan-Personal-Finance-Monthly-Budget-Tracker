import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  PiggyBank,
  TrendingUp,
  Settings,
  LogOut,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ onCloseMobile }) {
  const { user, logout } = useAuth();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/transactions/new', label: 'Add transaction', icon: PlusCircle },
    { to: '/budget', label: 'Monthly budget', icon: PiggyBank },
    { to: '/insights', label: 'Spending insights', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm">
          <Wallet className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white text-base tracking-tight">PaisaPlan</span>
          <span className="text-[10px] text-slate-400 font-normal">Finance & Budget Tracker</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User & Settings Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-teal-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate flex-1">Account settings</span>
        </NavLink>

        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            logout();
          }}
          className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Log out</span>
        </button>

        {user && (
          <div className="mt-3 px-3 py-2 bg-slate-800/60 rounded-lg flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-teal-600/30 text-teal-300 border border-teal-500/40 flex items-center justify-center text-xs font-bold shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-white truncate">{user.name}</span>
              <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
