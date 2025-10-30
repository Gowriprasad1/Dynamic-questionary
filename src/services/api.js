import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Forms API
export const formsAPI = {
  getAll: () => api.get('/forms'),
  getById: (id) => api.get(`/forms/${id}`),
  create: (formData) => api.post('/forms', formData),
  update: (id, formData) => api.put(`/forms/${id}`, formData),
  delete: (id) => api.delete(`/forms/${id}`),
  createSample: () => api.post('/forms/sample'),
  addQuestion: (id, questionData) => api.post(`/forms/${id}/questions`, questionData),
};

// Submissions API
export const submissionsAPI = {
  submit: (submissionData) => api.post('/submissions', submissionData),
  getByFormId: (formId) => api.get(`/submissions/form/${formId}`),
  getById: (id) => api.get(`/submissions/${id}`),
  getAll: () => api.get('/submissions'),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getAllIncludingInactive: () => api.get('/categories/all'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (categoryData) => api.post('/categories', categoryData),
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/categories/${id}`),
  initializeDefaults: () => api.post('/categories/initialize-defaults'),
};

// User flow API (lookup, otp)
export const userAPI = {
  lookup: (payload) => api.post('/user/lookup', payload),
  sendOtp: (payload) => api.post('/user/send-otp', payload),
  verifyOtp: (payload) => api.post('/user/verify-otp', payload),
  getQuestions: (category) => api.get(`/user/questions/${encodeURIComponent(category)}`),
  submit: (payload) => api.post('/user/submit', payload),
};

export default api;
