import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  PiggyBank,
  PlusCircle,
  Receipt,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useDate } from '../context/DateContext';
import { dashboardApi } from '../api/dashboardApi';
import { budgetApi } from '../api/budgetApi';
import { formatINR } from '../utils/currency';
import { formatReadableDate } from '../utils/dateUtils';
import { CATEGORY_COLORS, MONTH_NAMES } from '../utils/constants';

import PageHeader from '../components/layout/PageHeader';
import SummaryCard from '../components/ui/SummaryCard';
import ChartContainer from '../components/ui/ChartContainer';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import BudgetFormModal from '../components/budget/BudgetFormModal';

export default function DashboardPage() {
  const { selectedYear, selectedMonth } = useDate();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getDashboard(selectedMonth, selectedYear);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedYear, selectedMonth]);

  const handleSaveBudget = async (budgetData) => {
    try {
      setIsSavingBudget(true);
      await budgetApi.upsertBudget(selectedYear, selectedMonth, budgetData);
      setIsBudgetModalOpen(false);
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setIsSavingBudget(false);
    }
  };

  if (loading) return <LoadingState message="Calculating monthly finances and analytics..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />;

  const { summary, sixMonthTrend = [], categoryBreakdown = [] } = data || {};
  const hasTransactions = summary && summary.transactionCount > 0;
  const budget = summary?.budget;

  // Custom Recharts Tooltip
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-md text-xs">
          <p className="font-bold text-slate-800 mb-1.5">{label}</p>
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Income: {formatINR(payload[0]?.value)}</span>
          </div>
          <div className="flex items-center gap-2 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Expenses: {formatINR(payload[1]?.value)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-md text-xs">
          <p className="font-semibold text-slate-800">{p.name}</p>
          <p className="text-slate-600 mt-0.5">
            {formatINR(p.value)} ({p.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Financial summary and spending breakdown for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
        action={
          <button
            type="button"
            onClick={() => navigate('/transactions/new')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        }
      />

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Income Card */}
        <SummaryCard
          title="Monthly Income"
          value={formatINR(summary?.incomeRupees || 0)}
          subtitle="Total recorded income for this month"
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />

        {/* Expenses Card */}
        <SummaryCard
          title="Monthly Expenses"
          value={formatINR(summary?.expenseRupees || 0)}
          subtitle="Total recorded expenses for this month"
          icon={TrendingDown}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />

        {/* Monthly Balance Card */}
        <SummaryCard
          title="Monthly Balance"
          value={formatINR(summary?.balanceRupees || 0)}
          subtitle="Selected-month income minus expenses"
          icon={Scale}
          iconColor={summary?.balanceRupees >= 0 ? 'text-teal-600' : 'text-rose-600'}
          iconBg={summary?.balanceRupees >= 0 ? 'bg-teal-50' : 'bg-rose-50'}
          badge={summary?.balanceRupees >= 0 ? 'Surplus' : 'Deficit'}
          badgeVariant={summary?.balanceRupees >= 0 ? 'emerald' : 'rose'}
        />

        {/* Budget Usage Card */}
        {budget && budget.hasBudget ? (
          <SummaryCard
            title="Monthly Budget Usage"
            value={`${budget.percentageUsed}%`}
            subtitle={
              budget.remainingRupees >= 0
                ? `${formatINR(budget.remainingRupees)} remaining of ${formatINR(budget.totalLimitRupees)}`
                : `${formatINR(Math.abs(budget.remainingRupees))} over budget`
            }
            icon={PiggyBank}
            iconColor={
              budget.status === 'Over budget'
                ? 'text-rose-600'
                : budget.status === 'Approaching limit'
                ? 'text-amber-600'
                : 'text-teal-600'
            }
            iconBg={
              budget.status === 'Over budget'
                ? 'bg-rose-50'
                : budget.status === 'Approaching limit'
                ? 'bg-amber-50'
                : 'bg-teal-50'
            }
            badge={budget.status}
            badgeVariant={
              budget.status === 'Over budget'
                ? 'rose'
                : budget.status === 'Approaching limit'
                ? 'amber'
                : 'teal'
            }
            onClick={() => navigate('/budget')}
          />
        ) : (
          <div className="bg-white border border-dashed border-teal-300 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:bg-teal-50/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Budget
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <p className="text-sm font-semibold text-slate-800">No budget planned yet</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Set monthly limits to keep spending on track
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Set a monthly budget</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 6-Month Income vs Expenses Bar Chart */}
        <ChartContainer
          title="Income vs Expenses (Last 6 Months)"
          subtitle="Monthly cash flow trends"
          className="lg:col-span-2"
        >
          {sixMonthTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sixMonthTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="shortMonth" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="incomeRupees" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenseRupees" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No trend data recorded yet.
            </div>
          )}
        </ChartContainer>

        {/* Category Spending Donut Chart */}
        <ChartContainer
          title="Spending by Category"
          subtitle={`Distribution for ${MONTH_NAMES[selectedMonth - 1]}`}
        >
          {categoryBreakdown.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="amountRupees"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {categoryBreakdown.map((entry) => (
                      <Cell
                        key={`cell-${entry.category}`}
                        fill={CATEGORY_COLORS[entry.category] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full mt-2 space-y-1.5 max-h-24 overflow-y-auto px-1">
                {categoryBreakdown.slice(0, 4).map((item) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#64748b' }}
                      />
                      <span className="truncate text-slate-700">{item.category}</span>
                    </div>
                    <span className="font-semibold text-slate-900 shrink-0">
                      {formatINR(item.amountRupees)} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No expenses recorded this month.
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">
              Latest transactions recorded for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
          >
            <span>View All Transactions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {summary.recentTransactions.map((t) => {
              const isIncome = t.type === 'income';
              return (
                <div key={t.id || t._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-900 truncate">{t.description}</span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {formatReadableDate(t.date)} • {t.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <Badge variant={isIncome ? 'emerald' : 'slate'} size="sm">
                      {t.category}
                    </Badge>
                    <span
                      className={`font-semibold text-sm ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatINR(t.amountRupees || (t.amountPaise ? t.amountPaise / 100 : 0))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No transactions for this month"
            description="Start by recording your income or recent expenses to see dashboard insights."
            action={
              <button
                type="button"
                onClick={() => navigate('/transactions/new')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add First Transaction</span>
              </button>
            }
          />
        )}
      </div>

      {/* Set Monthly Budget Modal */}
      <BudgetFormModal
        isOpen={isBudgetModalOpen}
        year={selectedYear}
        month={selectedMonth}
        currentBudget={budget}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        isSaving={isSavingBudget}
      />
    </div>
  );
}
