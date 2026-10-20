const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Standardized API client error.
 */
export class ApiError extends Error {
  /**
   * @param {object} params
   * @param {number} params.status - HTTP status code.
   * @param {string} params.code - Error code from backend envelope.
   * @param {string} params.message - Human-readable summary.
   * @param {Record<string, string[]>|null} [params.details] - Detailed validation errors.
   */
  constructor({ status, code, message, details = null }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Centralized Fetch API wrapper.
 * Automatically attaches JWT, parses responses, supports FormData,
 * normalizes backend error envelopes, and handles 401 logouts.
 */
class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  /**
   * Dispatches unauthorized event to log out user.
   */
  handleUnauthorized() {
    this.setToken(null);
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  /**
   * Core request method.
   * @param {string} endpoint
   * @param {RequestInit} [options]
   * @returns {Promise<any>}
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = { ...options.headers };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const isFormData = options.body instanceof FormData;
    if (!isFormData && options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    let response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch {
      throw new ApiError({
        status: 0,
        code: 'network_error',
        message: 'Unable to connect to server. Please check your internet connection.',
      });
    }

    // Handle 401 Unauthorized globally
    if (response.status === 401) {
      this.handleUnauthorized();
    }

    // Attempt to parse JSON response body
    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const errorObj = data?.error || {};
      throw new ApiError({
        status: response.status,
        code: errorObj.code || 'unknown_error',
        message: errorObj.message || `Request failed with status ${response.status}`,
        details: errorObj.details || null,
      });
    }

    return data;
  }

  get(endpoint, query = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(fullEndpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  /**
   * Downloads a binary file using an authorized Fetch request and creates a browser download link.
   * @param {string} endpoint
   * @param {string} defaultFilename
   */
  async downloadFile(endpoint, defaultFilename = 'download') {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (response.status === 401) {
        this.handleUnauthorized();
      }
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      throw new ApiError({
        status: response.status,
        code: errorData?.error?.code || 'download_failed',
        message: errorData?.error?.message || 'Failed to download file',
      });
    }

    // Extract filename from Content-Disposition header if available
    let filename = defaultFilename;
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
      }
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
