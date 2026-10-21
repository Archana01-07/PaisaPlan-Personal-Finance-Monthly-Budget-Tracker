import api from './client';

export const insightsApi = {
  async getInsights(month, year) {
    const res = await api.get('/insights', { params: { month, year } });
    return res.data;
  },
};
