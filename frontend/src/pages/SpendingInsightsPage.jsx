import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  HelpCircle,
  Award,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { useDate } from '../context/DateContext';
import { insightsApi } from '../api/insightsApi';
import { formatINR } from '../utils/currency';
import { formatReadableDate } from '../utils/dateUtils';
import { MONTH_NAMES, CATEGORY_COLORS } from '../utils/constants';

import PageHeader from '../components/layout/PageHeader';
import SummaryCard from '../components/ui/SummaryCard';
import ChartContainer from '../components/ui/ChartContainer';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

export default function SpendingInsightsPage() {
  const { selectedYear, selectedMonth } = useDate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSurplusTooltip, setShowSurplusTooltip] = useState(false);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await insightsApi.getInsights(selectedMonth, selectedYear);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch spending insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedYear, selectedMonth]);

  if (loading) return <LoadingState message="Analyzing transaction patterns and computing statistics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchInsights} />;

  const {
    totalSpendingRupees = 0,
    dailyAverageRupees = 0,
    elapsedDays = 0,
    daysInMonth = 30,
    largestExpense = null,
    totalIncomeRupees = 0,
    monthlySurplusRate = null,
    weeklySpending = [],
    categoryRankings = [],
    previousMonthComparison = null,
    observations = [],
  } = data || {};

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-md text-xs">
          <p className="font-semibold text-slate-800">{label}</p>
          <p className="text-teal-700 font-bold mt-1">
            Spent: {formatINR(payload[0]?.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <PageHeader
        title="Spending Insights"
        subtitle={`Factual analytical metrics and observations for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Spending */}
        <SummaryCard
          title="Total Spending"
          value={formatINR(totalSpendingRupees)}
          subtitle={`${daysInMonth} days in ${MONTH_NAMES[selectedMonth - 1]}`}
          icon={TrendingDown}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />

        {/* Daily Average Spending */}
        <SummaryCard
          title="Daily Average Spending"
          value={formatINR(dailyAverageRupees)}
          subtitle={`Calculated over ${elapsedDays} elapsed days`}
          icon={Clock}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
        />

        {/* Largest Single Expense */}
        <SummaryCard
          title="Largest Single Expense"
          value={largestExpense ? formatINR(largestExpense.amountRupees) : 'None'}
          subtitle={
            largestExpense
              ? `${largestExpense.description} (${largestExpense.category})`
              : 'No recorded expenses'
          }
          icon={Award}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />

        {/* Monthly Surplus Rate with Tooltip */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Surplus Rate
              </span>
              <button
                type="button"
                onClick={() => setShowSurplusTooltip(!showSurplusTooltip)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Explain calculation"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {monthlySurplusRate !== null ? `${monthlySurplusRate}%` : 'Not available'}
            </h3>
            {monthlySurplusRate !== null && (
              <Badge
                variant={monthlySurplusRate >= 0 ? 'emerald' : 'rose'}
                size="sm"
              >
                {monthlySurplusRate >= 0 ? 'Positive' : 'Deficit'}
              </Badge>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {totalIncomeRupees > 0
              ? `Calculated from ${formatINR(totalIncomeRupees)} total income`
              : 'Requires recorded monthly income'}
          </p>

          {/* Tooltip explaining calculation */}
          {showSurplusTooltip && (
            <div className="absolute left-4 right-4 top-full mt-2 z-30 p-3 bg-slate-900 text-white rounded-lg text-xs shadow-xl animate-in fade-in duration-150">
              <p className="font-semibold mb-1">Surplus Rate Formula:</p>
              <code className="text-teal-300 font-mono text-[11px] block bg-slate-800 p-1.5 rounded mb-2">
                (Income - Expenses) / Income × 100
              </code>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Represents the percentage of your monthly income remaining unspent. This
                reflects cash flow margin, not funds verified as deposited into a bank savings
                account.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Spending and Previous Month Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Spending Chart */}
        <ChartContainer
          title="Weekly Spending Distribution"
          subtitle="Expense grouping across 7-day intervals"
          className="lg:col-span-2"
        >
          {weeklySpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklySpending} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="amountRupees" name="Weekly Spent" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No weekly transactions recorded yet.
            </div>
          )}
        </ChartContainer>

        {/* Previous Month Comparison */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100">
              Month-over-Month Comparison
            </h3>

            {previousMonthComparison?.hasData ? (
              <div className="mt-4 space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[11px] text-slate-500 block">
                    {previousMonthComparison.previousMonthName}{' '}
                    {previousMonthComparison.previousYear} Expenses
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    {formatINR(previousMonthComparison.previousTotalRupees)}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[11px] text-slate-500 block">
                    Spending Difference
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span
                      className={`text-lg font-bold ${
                        previousMonthComparison.isHigher
                          ? 'text-rose-600'
                          : previousMonthComparison.isLower
                          ? 'text-emerald-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {previousMonthComparison.isHigher ? '+' : ''}
                      {formatINR(previousMonthComparison.differenceRupees)}
                    </span>
                    <Badge
                      variant={
                        previousMonthComparison.isHigher
                          ? 'rose'
                          : previousMonthComparison.isLower
                          ? 'emerald'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {previousMonthComparison.percentChange > 0 ? '+' : ''}
                      {previousMonthComparison.percentChange}%
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {previousMonthComparison.isHigher
                    ? `You spent ${formatINR(
                        Math.abs(previousMonthComparison.differenceRupees)
                      )} more than in ${previousMonthComparison.previousMonthName}.`
                    : previousMonthComparison.isLower
                    ? `You spent ${formatINR(
                        Math.abs(previousMonthComparison.differenceRupees)
                      )} less than in ${previousMonthComparison.previousMonthName}.`
                    : `Spending is exactly equal to ${previousMonthComparison.previousMonthName}.`}
                </p>
              </div>
            ) : (
              <div className="mt-8 text-center">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {previousMonthComparison?.message ||
                    'No transaction data available for the previous month to compare.'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Comparisons are calculated authoritatively from stored transaction history.
          </div>
        </div>
      </div>

      {/* Data-Backed Factual Observations */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs mb-6">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Data-Backed Spending Observations
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Direct factual findings derived strictly from your recorded transactions and monthly budget
        </p>

        {observations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {observations.map((obs, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">{obs}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Add transactions and configure a budget to generate factual spending observations.
          </p>
        )}
      </div>

      {/* Category Rankings Breakdown Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            Category Spending Comparison
          </h3>
          <p className="text-xs text-slate-500">
            Ranked by expenditure volume for {MONTH_NAMES[selectedMonth - 1]}
          </p>
        </div>

        {categoryRankings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {categoryRankings.map((cat, idx) => (
              <div
                key={cat.category}
                className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900">{cat.category}</h4>
                    <span className="text-[11px] text-slate-400">
                      {cat.percentage}% of total monthly expenditure
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900">{formatINR(cat.amountRupees)}</span>
                  <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden ml-auto">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No expenses recorded for this month yet.
          </div>
        )}
      </div>
    </div>
  );
}
