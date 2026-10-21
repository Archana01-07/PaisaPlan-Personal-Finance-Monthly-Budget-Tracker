import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getPreviousMonth, getNextMonth } from '../utils/dateUtils';

const DateContext = createContext(null);

export function DateProvider({ children }) {
  const { user } = useAuth();
  const now = new Date();

  // Default to current month or September 2026 for demo account
  const initialYear = user?.email === 'demo@paisaplan.com' ? 2026 : now.getFullYear();
  const initialMonth = user?.email === 'demo@paisaplan.com' ? 9 : (now.getMonth() + 1);

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  // If user switches or logs in as demo, automatically set to September 2026
  useEffect(() => {
    if (user?.email === 'demo@paisaplan.com') {
      setSelectedYear(2026);
      setSelectedMonth(9);
    }
  }, [user?.email]);

  const setMonthAndYear = (month, year) => {
    setSelectedMonth(parseInt(month, 10));
    setSelectedYear(parseInt(year, 10));
  };

  const goToPrevious = () => {
    const prev = getPreviousMonth(selectedYear, selectedMonth);
    setSelectedYear(prev.year);
    setSelectedMonth(prev.month);
  };

  const goToNext = () => {
    const next = getNextMonth(selectedYear, selectedMonth);
    setSelectedYear(next.year);
    setSelectedMonth(next.month);
  };

  const value = {
    selectedYear,
    selectedMonth,
    setMonthAndYear,
    goToPrevious,
    goToNext,
  };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useDate() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
}
