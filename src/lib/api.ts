import axios from 'axios';

const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`;
  }
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

// ── Public (guest) client ──────────────────────────────────────
export const api = axios.create({
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: false,
});

// Dynamic baseURL assignment + participant token injection
api.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('participant_token');
    if (token) config.headers['X-Participant-Token'] = token;
  }
  return config;
});

// Clear invalid session and redirect to Join on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('participant_name');
      localStorage.removeItem('participant_token');
      localStorage.removeItem('participant_slug');

      const pathParts = window.location.pathname.split('/');
      const slugIndex = pathParts.indexOf('e') + 1;
      if (slugIndex > 0 && slugIndex < pathParts.length) {
        const slug = pathParts[slugIndex];
        window.location.href = `/e/${slug}`;
      } else {
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

// ── Admin (organizer) client ───────────────────────────────────
export const adminApi = axios.create({
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Dynamic baseURL assignment + admin token injection
adminApi.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
