import { apiFetch, buildQuery } from './client';

export function getAll(params = {}) {
  return apiFetch('/transfers' + buildQuery(params));
}

export function getById(id) {
  return apiFetch(`/transfers/${id}`);
}

export function create(dto) {
  return apiFetch('/transfers', { method: 'POST', body: JSON.stringify(dto) });
}

export function updateStatus(id, dto) {
  return apiFetch(`/transfers/${id}/status`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function remove(id) {
  return apiFetch(`/transfers/${id}`, { method: 'DELETE' });
}
