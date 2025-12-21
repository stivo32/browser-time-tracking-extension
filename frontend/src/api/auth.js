/**
 * Authentication API
 * 
 * Functions for user authentication (register, login, logout)
 */

import apiClient from './client.js';
import { API_ENDPOINTS } from '../config/api.js';

/**
 * Register a new user
 * @param {Object} registerData - Registration data
 * @param {string} registerData.email - User email
 * @param {string} registerData.password - User password
 * @param {string} [registerData.full_name] - User full name
 * @returns {Promise<Object>} User data and session token
 */
export async function register(registerData) {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, registerData);
  
  // Store session token from response.session.session_token
  if (response.session && response.session.session_token) {
    apiClient.setSessionToken(response.session.session_token);
  }
  
  return response;
}

/**
 * Login user
 * @param {Object} loginData - Login credentials
 * @param {string} loginData.email - User email
 * @param {string} loginData.password - User password
 * @returns {Promise<Object>} User data and session token
 */
export async function login(loginData) {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, loginData);
  
  // Store session token from response.session.session_token
  if (response.session && response.session.session_token) {
    apiClient.setSessionToken(response.session.session_token);
  }
  
  return response;
}

/**
 * Logout user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear session token regardless of API response
    apiClient.setSessionToken(null);
  }
}

/**
 * Get current user
 * @returns {Promise<Object>} Current user data
 */
export async function getCurrentUser() {
  return apiClient.get(API_ENDPOINTS.AUTH.ME);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if session token exists
 */
export function isAuthenticated() {
  return !!apiClient.getSessionToken();
}
