import api from './client';

export const userApi = {
  async updateProfile(data) {
    const res = await api.patch('/users/me', data);
    return res.data;
  },
};
