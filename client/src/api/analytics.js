import API from './axios';

export const getMastery = async () => {
  const response = await API.get('/analytics/mastery');
  return response.data;
};

export const getWeakTopics = async () => {
  const response = await API.get('/analytics/weak-topics');
  return response.data;
};

export const getExamReadiness = async () => {
  const response = await API.get('/analytics/exam-readiness');
  return response.data;
};

export const getStudyTime = async () => {
  const response = await API.get('/analytics/study-time');
  return response.data;
};

export const getRevisionPlan = async () => {
  const response = await API.get('/analytics/revision-plan');
  return response.data;
};

export const getHistory = async (page = 1, limit = 20, type = '') => {
  const params = { page, limit };
  if (type) params.type = type;
  const response = await API.get('/analytics/history', { params });
  return response.data;
};
