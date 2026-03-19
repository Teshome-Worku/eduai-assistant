import API from './axios';

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await API.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getDocuments = async () => {
  const response = await API.get('/documents');
  return response.data;
};

export const getDocument = async (id) => {
  const response = await API.get(`/documents/${id}`);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await API.delete(`/documents/${id}`);
  return response.data;
};
