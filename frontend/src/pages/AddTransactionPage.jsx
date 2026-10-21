import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionApi } from '../api/transactionApi';
import { useDate } from '../context/DateContext';
import TransactionForm from '../components/transactions/TransactionForm';
import Toast from '../components/ui/Toast';

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { setMonthAndYear } = useDate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      await transactionApi.createTransaction(formData);
      if (formData.date) {
        const [y, m] = formData.date.split('-');
        setMonthAndYear(parseInt(m, 10), parseInt(y, 10));
      }
      setToastMessage('Transaction saved successfully');
      setTimeout(() => {
        navigate('/transactions');
      }, 500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Add Transaction
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Record manual income or expense with category and payment details
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <TransactionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
