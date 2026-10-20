import { apiClient } from './apiClient.js';

export const authService = {
  /**
   * Logs in a user with credentials.
   * @param {{ username: string, password: string }} credentials
   * @returns {Promise<{ token: string, user: { id: string, username: string, name: string, role: 'submitter' | 'reviewer' } }>}
   */
  async login({ username, password }) {
    const data = await apiClient.post('/auth/login', { username, password });
    if (data?.token) {
      apiClient.setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Retrieves profile of current authenticated user.
   * @returns {Promise<{ id: string, username: string, name: string, role: string }>}
   */
  async getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  /**
   * Clears stored credentials and session.
   */
  logout() {
    apiClient.setToken(null);
    localStorage.removeItem('user');
  },
};

export default authService;
