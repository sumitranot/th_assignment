import { apiClient } from './apiClient.js';

export const documentService = {
  /**
   * Retrieves paginated document list.
   * @param {object} [params]
   * @param {'pending' | 'approved' | 'rejected'} [params.status]
   * @param {number} [params.page]
   * @param {number} [params.pageSize]
   */
  async listDocuments({ status, page = 1, pageSize = 10 } = {}) {
    return apiClient.get('/documents', { status, page, pageSize });
  },

  /**
   * Retrieves single document detail.
   * @param {string} id - Document UUID.
   */
  async getDocument(id) {
    return apiClient.request(`/documents/${id}`, { method: 'GET' });
  },

  /**
   * Submits a new document with multipart/form-data.
   * @param {FormData} formData
   */
  async createDocument(formData) {
    return apiClient.post('/documents', formData);
  },

  /**
   * Updates document review status (approved or rejected).
   * @param {string} id - Document UUID.
   * @param {object} params
   * @param {'approved' | 'rejected'} params.status
   * @param {string} [params.comment]
   */
  async updateStatus(id, { status, comment }) {
    return apiClient.patch(`/documents/${id}/status`, { status, comment });
  },

  /**
   * Downloads attached document file.
   * @param {string} id - Document UUID.
   * @param {string} [filename]
   */
  async downloadFile(id, filename) {
    return apiClient.downloadFile(`/documents/${id}/file`, filename);
  },
};

export default documentService;
