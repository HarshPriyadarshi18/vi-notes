import apiClient from './authService.js';

export const sessionService = {
  saveSession: async (sessionData) => {
    const response = await apiClient.post('/api/sessions', sessionData);
    return response.data;
  },

  getSession: async () => {
    const response = await apiClient.get('/api/sessions');
    return response.data.session;
  },

  getStats: async () => {
    const response = await apiClient.get('/api/sessions/stats');
    return response.data.stats;
  }
};

export default sessionService;
