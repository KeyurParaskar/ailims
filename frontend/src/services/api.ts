import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
  const response = await api.post('/auth/register', { email, password, firstName, lastName });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const updateUserRole = async (userId: number, role: string) => {
  const response = await api.put(`/auth/users/${userId}/role`, { role });
  return response.data;
};

// AI endpoints
export const parseWorkflowFromNL = async (input: string) => {
  const response = await api.post('/ai/parse', { input });
  return response.data;
};

export const suggestNextStep = async (currentSteps: any[], context?: string) => {
  const response = await api.post('/ai/suggest-step', { currentSteps, context });
  return response.data;
};

// Workflow endpoints
export const getWorkflows = async () => {
  const response = await api.get('/workflows');
  return response.data;
};

export const getWorkflow = async (id: string) => {
  const response = await api.get(`/workflows/${id}`);
  return response.data;
};

export const createWorkflow = async (workflow: any) => {
  const response = await api.post('/workflows', workflow);
  return response.data;
};

export const updateWorkflow = async (id: string, workflow: any) => {
  const response = await api.put(`/workflows/${id}`, workflow);
  return response.data;
};

export const deleteWorkflow = async (id: string) => {
  const response = await api.delete(`/workflows/${id}`);
  return response.data;
};

// Search endpoints
export const aiSearch = async (query: string) => {
  const response = await api.post('/search/search', { query });
  return response.data;
};

export const aiQuery = async (question: string, context?: string) => {
  const response = await api.post('/search/query', { question, context });
  return response.data;
};

// Notification endpoints
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id: number) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id: number) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

// Audit endpoints
export const getAuditLogs = async (filters?: {
  entityType?: string;
  action?: string;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const response = await api.get(`/audit?${params.toString()}`);
  return response.data;
};

export const getEntityAuditLogs = async (entityType: string, entityId: string) => {
  const response = await api.get(`/audit/${entityType}/${entityId}`);
  return response.data;
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
