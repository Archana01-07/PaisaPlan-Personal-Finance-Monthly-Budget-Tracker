import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Receipt, ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { useDate } from '../context/DateContext';
import { transactionApi } from '../api/transactionApi';
import { formatINR } from '../utils/currency';
import { MONTH_NAMES } from '../utils/constants';

import PageHeader from '../components/layout/PageHeader';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionList from '../components/transactions/TransactionList';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Toast from '../components/ui/Toast';

export default function TransactionsPage() {
  const { selectedYear, selectedMonth } = useDate();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ incomeRupees: 0, expenseRupees: 0, netRupees: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Delete modal state
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transactionApi.getTransactions({
        month: selectedMonth,
        year: selectedYear,
        search,
        type: type === 'all' ? undefined : type,
        category: category === 'all' ? undefined : category,
        sort,
        page,
        limit,
      });

      setTransactions(res.transactions || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
      setSummary(res.summary || { incomeRupees: 0, expenseRupees: 0, netRupees: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 when filters change
  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };
  const handleTypeChange = (val) => {
    setType(val);
    setPage(1);
  };
  const handleCategoryChange = (val) => {
    setCategory(val);
    setPage(1);
  };
  const handleSortChange = (val) => {
    setSort(val);
    setPage(1);
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedYear, selectedMonth, search, type, category, sort, page]);

  const handleEdit = (transaction) => {
    navigate(`/transactions/${transaction.id}/edit`);
  };

  const handleDeletePrompt = (transaction) => {
    setDeletingTransaction(transaction);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      setIsDeleting(true);
      await transactionApi.deleteTransaction(deletingTransaction.id);
      setToastMessage('Transaction deleted successfully');
      setDeletingTransaction(null);
      await fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`Review and manage recorded entries for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
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

      {/* Monthly Cash Flow Stats Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Selected-Month Income
            </span>
            <h4 className="text-lg font-bold text-emerald-600 mt-0.5">
              +{formatINR(summary.incomeRupees)}
            </h4>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Selected-Month Expenses
            </span>
            <h4 className="text-lg font-bold text-rose-600 mt-0.5">
              -{formatINR(summary.expenseRupees)}
            </h4>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Net Cash Flow
            </span>
            <h4
              className={`text-lg font-bold mt-0.5 ${
                summary.netRupees >= 0 ? 'text-teal-700' : 'text-rose-600'
              }`}
            >
              {summary.netRupees >= 0 ? '+' : ''}
              {formatINR(summary.netRupees)}
            </h4>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <TransactionFilters
        search={search}
        onSearchChange={handleSearchChange}
        type={type}
        onTypeChange={handleTypeChange}
        category={category}
        onCategoryChange={handleCategoryChange}
        sort={sort}
        onSortChange={handleSortChange}
      />

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Fetching transaction history..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTransactions} />
      ) : transactions.length > 0 ? (
        <TransactionList
          transactions={transactions}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          limit={limit}
          onPageChange={(p) => setPage(p)}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
        />
      ) : (
        <EmptyState
          icon={Receipt}
          title="No transactions match your search"
          description="Try clearing search filters or add a new transaction for this month."
          action={
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setType('all');
                setCategory('all');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg cursor-pointer"
            >
              Reset Filters
            </button>
          }
        />
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={!!deletingTransaction}
        title="Delete Transaction"
        message={`Are you sure you want to permanently delete "${deletingTransaction?.description}" of ${formatINR(
          deletingTransaction?.amountRupees || 0
        )}? This action will immediately adjust your monthly summaries and budget usage.`}
        confirmLabel="Delete Transaction"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTransaction(null)}
      />

      {/* Success Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
