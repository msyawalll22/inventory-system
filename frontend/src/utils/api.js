// src/api.js
const BASE_URL = 'http://localhost:8080/api';

const apiRequest = async (endpoint, options = {}) => {
  // 1. Grab the "VIP Pass" from storage
  const token = localStorage.getItem('token');
  
  // 2. Setup the headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 3. If a token exists, attach it to the request
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 4. Make the actual call
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle session expiry (e.g., if token is old)
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/'; // Kick them back to login
    }

    return response;
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
};

export default apiRequest;