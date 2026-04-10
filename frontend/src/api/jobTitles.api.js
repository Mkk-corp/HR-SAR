import { apiFetch, buildQuery } from './client';

export const getAll = (params = {}) => apiFetch('/job-titles' + buildQuery(params));
export const getById = (id) => apiFetch(`/job-titles/${id}`);
export const create = (dto) => apiFetch('/job-titles', { method: 'POST', body: JSON.stringify(dto) });
export const update = (id, dto) => apiFetch(`/job-titles/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
export const remove = (id) => apiFetch(`/job-titles/${id}`, { method: 'DELETE' });
