import api from './client';

export const dashboardApi = {
  async getDashboard(month, year) {
    const res = await api.get('/dashboard', { params: { month, year } });
    return res.data;
  },
};
