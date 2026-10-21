import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800">
      {/* Mobile Top Navigation */}
      <MobileNavigation />

      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
