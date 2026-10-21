import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DateProvider } from './context/DateContext';

import AppLayout from './components/layout/AppLayout';
import LoadingState from './components/ui/LoadingState';

import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AddTransactionPage from './pages/AddTransactionPage';
import EditTransactionPage from './pages/EditTransactionPage';
import MonthlyBudgetPage from './pages/MonthlyBudgetPage';
import SpendingInsightsPage from './pages/SpendingInsightsPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <DateProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/signin"
              element={
                <PublicRoute>
                  <SignInPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUpPage />
                </PublicRoute>
              }
            />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="transactions/new" element={<AddTransactionPage />} />
              <Route path="transactions/:id/edit" element={<EditTransactionPage />} />
              <Route path="budget" element={<MonthlyBudgetPage />} />
              <Route path="insights" element={<SpendingInsightsPage />} />
              <Route path="settings" element={<AccountSettingsPage />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </DateProvider>
    </AuthProvider>
  );
}
