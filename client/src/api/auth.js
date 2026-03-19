import API from './axios';

export const registerUser = async (data) => {
  const response = await API.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await API.post('/auth/login', data);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await API.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await API.post('/auth/reset-password', data);
  return response.data;
};

export const getProfile = async () => {
  const response = await API.get('/auth/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await API.put('/auth/profile', data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await API.put('/auth/password', data);
  return response.data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await API.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const removeAvatar = async () => {
  const response = await API.delete('/auth/avatar');
  return response.data;
};

export const deleteAccount = async () => {
  const response = await API.delete('/auth/account');
  return response.data;
};
