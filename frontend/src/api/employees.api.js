import { apiFetch, buildQuery } from './client';

export function getAll(params = {}) {
  return apiFetch('/employees' + buildQuery(params));
}

export function getById(id) {
  return apiFetch(`/employees/${id}`);
}

export function create(dto) {
  return apiFetch('/employees', { method: 'POST', body: JSON.stringify(dto) });
}

export function update(id, dto) {
  return apiFetch(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function remove(id) {
  return apiFetch(`/employees/${id}`, { method: 'DELETE' });
}
