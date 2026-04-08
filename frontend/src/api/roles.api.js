import { apiFetch } from './client';

export function getAll() {
  return apiFetch('/roles');
}

export function getById(id) {
  return apiFetch(`/roles/${id}`);
}

export function getAllPermissions() {
  return apiFetch('/roles/permissions');
}

export function create(dto) {
  return apiFetch('/roles', { method: 'POST', body: JSON.stringify(dto) });
}

export function update(id, dto) {
  return apiFetch(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function remove(id) {
  return apiFetch(`/roles/${id}`, { method: 'DELETE' });
}
