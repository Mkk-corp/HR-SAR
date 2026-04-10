import { apiFetch, buildQuery } from './client';

export const getAll = (params = {}) => apiFetch('/org-units' + buildQuery(params));
export const getTree = () => apiFetch('/org-units/tree');
export const getById = (id) => apiFetch(`/org-units/${id}`);
export const create = (dto) => apiFetch('/org-units', { method: 'POST', body: JSON.stringify(dto) });
export const update = (id, dto) => apiFetch(`/org-units/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
export const remove = (id) => apiFetch(`/org-units/${id}`, { method: 'DELETE' });
