import { apiFetch } from './client';

export function getAll() {
  return apiFetch('/users');
}

export function getById(id) {
  return apiFetch(`/users/${id}`);
}

export function create(dto) {
  return apiFetch('/users', { method: 'POST', body: JSON.stringify(dto) });
}

export function update(id, dto) {
  return apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function remove(id) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

export function resetPassword(id, dto) {
  return apiFetch(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(dto) });
}
