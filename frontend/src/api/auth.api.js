import { apiFetch } from './client';

export function login(dto) {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(dto) });
}

export function register(dto) {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(dto) });
}
