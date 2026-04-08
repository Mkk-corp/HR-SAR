import { apiFetch, buildQuery } from './client';

export function getAll(params = {}) {
  return apiFetch('/facilities' + buildQuery(params));
}

export function getById(id) {
  return apiFetch(`/facilities/${id}`);
}

export function create(dto) {
  return apiFetch('/facilities', { method: 'POST', body: JSON.stringify(dto) });
}

export function update(id, dto) {
  return apiFetch(`/facilities/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function remove(id) {
  return apiFetch(`/facilities/${id}`, { method: 'DELETE' });
}
