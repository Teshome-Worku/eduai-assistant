import API from './axios';

export const askQuestion = async (question, documentIds = []) => {
  const response = await API.post('/ai/ask', { question, documentIds });
  return response.data;
};

export const summarizeDocument = async (documentId) => {
  const response = await API.post('/ai/summarize', { documentId });
  return response.data;
};

export const compareDocuments = async (documentIdA, documentIdB) => {
  const response = await API.post('/ai/compare-documents', { documentIdA, documentIdB });
  return response.data;
};

export const extractTopics = async (documentId) => {
  const response = await API.post('/ai/extract-topics', { documentId });
  return response.data;
};

export const generateQuiz = async (topic = 'auto', questionCount = 5) => {
  const response = await API.post('/ai/generate-quiz', { topic, questionCount });
  return response.data;
};

export const submitQuiz = async (quizData) => {
  const response = await API.post('/ai/submit-quiz', quizData);
  return response.data;
};
