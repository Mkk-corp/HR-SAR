const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('hr_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    if (token) {
      // Stored token is expired — clear session and redirect to login
      localStorage.removeItem('hr_token');
      localStorage.removeItem('hr_user');
      window.location.href = '/login';
      return;
    }
    // No token means this is a login attempt with wrong credentials — throw so the form can show the error
    const err = await res.json().catch(() => ({ message: 'بيانات الدخول غير صحيحة' }));
    throw new Error(err.message || 'Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function buildQuery(params) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();
  return q ? '?' + q : '';
}
