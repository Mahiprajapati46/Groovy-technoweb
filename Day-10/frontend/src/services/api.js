import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('📡 API Service Initialized');
console.log('🌐 Target:', API_URL);

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('pdfFile', file);

  const response = await api.post('/api/pdf/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const askQuestion = async (question, contextText) => {
  const response = await api.post('/api/query/ask', {
    question,
    contextText,
  });
  return response.data;
};

export const getCosts = async () => {
  const response = await api.get('/api/query/costs');
  return response.data;
};

export const resetCosts = async () => {
  const response = await api.post('/api/query/costs/reset');
  return response.data;
};

export default api;
