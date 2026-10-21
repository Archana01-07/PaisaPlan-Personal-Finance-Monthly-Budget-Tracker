import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useDate } from '../../context/DateContext';
import { MONTH_NAMES } from '../../utils/constants';

export default function MonthSelector() {
  const { selectedYear, selectedMonth, setMonthAndYear, goToPrevious, goToNext } = useDate();
  const [isOpen, setIsOpen] = useState(false);

  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="relative inline-flex items-center bg-white border border-slate-200 rounded-lg shadow-2xs p-0.5">
      <button
        type="button"
        onClick={goToPrevious}
        aria-label="Previous Month"
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <Calendar className="w-3.5 h-3.5 text-teal-600" />
        <span>
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </span>
      </button>

      <button
        type="button"
        onClick={goToNext}
        aria-label="Next Month"
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Month & Year Dropdown Popup */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-64 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700">Select Month & Year</span>
              <select
                value={selectedYear}
                onChange={(e) => setMonthAndYear(selectedMonth, parseInt(e.target.value, 10))}
                className="text-xs font-medium border border-slate-200 rounded px-2 py-0.5 bg-slate-50"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTH_NAMES.map((name, idx) => {
                const monthNum = idx + 1;
                const isSelected = selectedMonth === monthNum;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setMonthAndYear(monthNum, selectedYear);
                      setIsOpen(false);
                    }}
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg text-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {name.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
