import React, { useState } from 'react';
import { Menu, X, Wallet } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="lg:hidden h-16 bg-slate-900 text-white flex items-center justify-between px-4 border-b border-slate-800 sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0">
          <Wallet className="w-4 h-4" />
        </div>
        <span className="font-bold text-base tracking-tight">PaisaPlan</span>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Navigation Drawer"
        className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-900 h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
            <Sidebar onCloseMobile={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
