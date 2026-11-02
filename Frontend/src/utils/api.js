import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  beginRegistration: (data) => api.post('/auth/begin-registration', data),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verify: () => api.get('/auth/verify'),
  updateWallet: (walletAddress) => api.post('/auth/update-wallet', { walletAddress }),
  getProfile: () => api.get('/auth/profile')
};

// Face Recognition APIs
export const faceAPI = {
  registerFace: (data) => api.post('/face/register-face', data),
  authenticate: (data) => api.post('/face/authenticate', data),
  verifyForVoting: (data) => api.post('/face/verify-for-voting', data),
  registerAndCreate: (data) => api.post('/face/register-and-create', data)
};

// Election APIs
export const electionAPI = {
  create: (data) => api.post('/election/create', data),
  getAll: () => api.get('/election/all'),
  getById: (id) => api.get(`/election/${id}`),
  delete: (id) => api.delete(`/election/${id}`),
  stop: (id) => api.post(`/election/${id}/stop`),
  vote: (data) => api.post('/election/vote', data),
  getResults: (id) => api.get(`/election/${id}/results`)
};

// Feedback APIs
export const feedbackAPI = {
  submit: (data) => api.post('/feedback/submit', data),
  getAll: () => api.get('/feedback/all'),
  getMyFeedback: () => api.get('/feedback/my-feedback'),
  update: (id, data) => api.put(`/feedback/${id}`, data)
};

// Notification APIs
export const notificationAPI = {
  getMyNotifications: (params) => api.get('/notifications/my-notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

// Upload APIs
export const uploadAPI = {
  uploadImage: (formData) => {
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadImages: (formData) => {
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (publicId) => api.delete(`/upload/image/${publicId}`)
};

export default api;
