import api from './client';

export const budgetApi = {
  async getBudget(month, year) {
    const res = await api.get('/budgets', { params: { month, year } });
    return res.data;
  },
  async upsertBudget(year, month, data) {
    const res = await api.put(`/budgets/${year}/${month}`, data);
    return res.data;
  },
};
