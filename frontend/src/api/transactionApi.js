import api from './client';

export const transactionApi = {
  async getTransactions(params = {}) {
    const res = await api.get('/transactions', { params });
    return res.data;
  },
  async getTransactionById(id) {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  },
  async createTransaction(data) {
    const res = await api.post('/transactions', data);
    return res.data;
  },
  async updateTransaction(id, data) {
    const res = await api.patch(`/transactions/${id}`, data);
    return res.data;
  },
  async deleteTransaction(id) {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },
};
