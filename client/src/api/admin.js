import API from './axios';

export const getAdminStats = async () => {
  const response = await API.get('/admin/stats');
  return response.data;
};

export const getAdminUsers = async (page = 1, limit = 20, search = '', sort = '-createdAt') => {
  const params = { page, limit, sort };
  if (search) params.search = search;
  const response = await API.get('/admin/users', { params });
  return response.data;
};

export const getAdminUserDetail = async (id) => {
  const response = await API.get(`/admin/users/${id}`);
  return response.data;
};

export const toggleUserRole = async (id) => {
  const response = await API.put(`/admin/users/${id}/role`);
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await API.delete(`/admin/users/${id}`);
  return response.data;
};
