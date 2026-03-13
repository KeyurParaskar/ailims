import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
