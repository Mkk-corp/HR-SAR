import { apiFetch, buildQuery } from './client';

export const getAll = (params = {}) => apiFetch('/positions' + buildQuery(params));
export const getById = (id) => apiFetch(`/positions/${id}`);
export const getEmployees = (id) => apiFetch(`/positions/${id}/employees`);
export const create = (dto) => apiFetch('/positions', { method: 'POST', body: JSON.stringify(dto) });
export const update = (id, dto) => apiFetch(`/positions/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
export const remove = (id) => apiFetch(`/positions/${id}`, { method: 'DELETE' });
export const assignEmployee = (dto) => apiFetch('/positions/assign', { method: 'POST', body: JSON.stringify(dto) });
export const transferEmployee = (dto) => apiFetch('/positions/transfer', { method: 'POST', body: JSON.stringify(dto) });
