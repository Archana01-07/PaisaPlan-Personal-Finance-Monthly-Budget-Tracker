import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error response is 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // If we are not already on auth pages, dispatch auth expired event
      if (!window.location.pathname.startsWith('/signin') && !window.location.pathname.startsWith('/signup')) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
