import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionApi } from '../api/transactionApi';
import { useDate } from '../context/DateContext';
import TransactionForm from '../components/transactions/TransactionForm';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import Toast from '../components/ui/Toast';

export default function EditTransactionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setMonthAndYear } = useDate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transactionApi.getTransactionById(id);
      setTransaction(res.transaction);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve transaction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      await transactionApi.updateTransaction(id, formData);
      if (formData.date) {
        const [y, m] = formData.date.split('-');
        setMonthAndYear(parseInt(m, 10), parseInt(y, 10));
      }
      setToastMessage('Transaction updated successfully');
      setTimeout(() => {
        navigate('/transactions');
      }, 500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading transaction details..." />;
  if (error) return <ErrorState message={error} onRetry={fetchTransaction} />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Edit Transaction
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Update transaction details, amount, category or payment method
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <TransactionForm
          initialData={transaction}
          isEdit={true}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
