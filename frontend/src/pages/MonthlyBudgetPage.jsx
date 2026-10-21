import React, { useState, useEffect } from 'react';
import { PiggyBank, Edit3, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDate } from '../context/DateContext';
import { budgetApi } from '../api/budgetApi';
import { formatINR } from '../utils/currency';
import { MONTH_NAMES } from '../utils/constants';

import PageHeader from '../components/layout/PageHeader';
import SummaryCard from '../components/ui/SummaryCard';
import BudgetCategoryRow from '../components/budget/BudgetCategoryRow';
import BudgetFormModal from '../components/budget/BudgetFormModal';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Toast from '../components/ui/Toast';

export default function MonthlyBudgetPage() {
  const { selectedYear, selectedMonth } = useDate();

  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchBudget = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await budgetApi.getBudget(selectedMonth, selectedYear);
      setBudgetData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch monthly budget');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [selectedYear, selectedMonth]);

  const handleSaveBudget = async (formData) => {
    try {
      setIsSaving(true);
      await budgetApi.upsertBudget(selectedYear, selectedMonth, formData);
      setToastMessage('Monthly budget updated successfully');
      setIsModalOpen(false);
      await fetchBudget();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save monthly budget');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <LoadingState message="Calculating category allocations and spending..." />;
  if (error) return <ErrorState message={error} onRetry={fetchBudget} />;

  const hasBudget = budgetData && budgetData.hasBudget;

  return (
    <div>
      <PageHeader
        title="Monthly Budget"
        subtitle={`Plan spending limits and monitor category allocations for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {hasBudget ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            <span>{hasBudget ? 'Edit Budget' : 'Set Monthly Budget'}</span>
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Total Monthly Budget"
          value={hasBudget ? formatINR(budgetData.totalLimitRupees) : 'Not set'}
          subtitle={
            hasBudget
              ? budgetData.unallocatedBudgetRupees > 0
                ? `${formatINR(budgetData.unallocatedBudgetRupees)} unallocated`
                : '100% allocated to categories'
              : 'Set a budget for this month'
          }
          icon={PiggyBank}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
        />

        <SummaryCard
          title="Total Expenses"
          value={formatINR(budgetData?.totalSpentRupees || 0)}
          subtitle="Sum of recorded expense transactions"
          icon={PiggyBank}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />

        <SummaryCard
          title="Budget Remaining"
          value={
            hasBudget
              ? formatINR(Math.abs(budgetData.remainingRupees))
              : '₹0'
          }
          subtitle={
            hasBudget
              ? budgetData.remainingRupees >= 0
                ? 'Available within planned limits'
                : 'Exceeded planned limit'
              : 'Set a budget to see remaining'
          }
          badge={
            hasBudget
              ? budgetData.remainingRupees >= 0
                ? 'Within Limit'
                : 'Exceeded'
              : null
          }
          badgeVariant={
            hasBudget && budgetData.remainingRupees < 0 ? 'rose' : 'emerald'
          }
        />

        <SummaryCard
          title="Percentage Used"
          value={hasBudget ? `${budgetData.percentageUsed}%` : '0%'}
          subtitle={hasBudget ? budgetData.status : 'No budget set'}
          badge={hasBudget ? budgetData.status : 'No Budget'}
          badgeVariant={
            budgetData?.status === 'Over budget'
              ? 'rose'
              : budgetData?.status === 'Approaching limit'
              ? 'amber'
              : 'teal'
          }
        />
      </div>

      {/* Category Allocations Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200/60 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Category Allocations</h2>
            <p className="text-xs text-slate-500">
              Visual breakdown of allocated vs actual spending per category
            </p>
          </div>
          {hasBudget && budgetData.unallocatedBudgetRupees > 0 && (
            <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
              Unallocated Budget: <strong>{formatINR(budgetData.unallocatedBudgetRupees)}</strong>
            </span>
          )}
        </div>

        {budgetData?.categories && budgetData.categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetData.categories.map((catData) => (
              <BudgetCategoryRow key={catData.category} categoryData={catData} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PiggyBank}
            title="No budget configured for this month"
            description="Setting monthly category allocations allows you to monitor spending limits and avoid budget overruns."
            action={
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Monthly Budget</span>
              </button>
            }
          />
        )}
      </div>

      {/* Budget Create / Edit Modal */}
      <BudgetFormModal
        isOpen={isModalOpen}
        year={selectedYear}
        month={selectedMonth}
        currentBudget={budgetData}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBudget}
        isSaving={isSaving}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
