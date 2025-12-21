/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints and base URL
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  API_V1_PREFIX: API_V1_PREFIX,
  FULL_API_URL: `${API_BASE_URL}${API_V1_PREFIX}`,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: `${API_CONFIG.FULL_API_URL}/auth/register`,
    LOGIN: `${API_CONFIG.FULL_API_URL}/auth/login`,
    LOGOUT: `${API_CONFIG.FULL_API_URL}/auth/logout`,
    ME: `${API_CONFIG.FULL_API_URL}/auth/me`,
  },
  // Sessions
  SESSIONS: {
    LIST: `${API_CONFIG.FULL_API_URL}/sessions`,
    GET: (id) => `${API_CONFIG.FULL_API_URL}/sessions/${id}`,
    CREATE: `${API_CONFIG.FULL_API_URL}/sessions`,
    UPDATE: (id) => `${API_CONFIG.FULL_API_URL}/sessions/${id}`,
    DELETE: (id) => `${API_CONFIG.FULL_API_URL}/sessions/${id}`,
  },
  // Domains
  DOMAINS: {
    LIST: `${API_CONFIG.FULL_API_URL}/domains`,
    GET: (id) => `${API_CONFIG.FULL_API_URL}/domains/${id}`,
    UPDATE: (id) => `${API_CONFIG.FULL_API_URL}/domains/${id}`,
    DELETE: (id) => `${API_CONFIG.FULL_API_URL}/domains/${id}`,
  },
};

export default API_CONFIG;
