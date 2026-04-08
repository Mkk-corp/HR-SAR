'use strict';

// ===== API Base URL (set in js/config.js) =====
const API_BASE = (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.API_BASE : 'http://localhost:5140/api');

// ===== Core Fetch Wrapper =====
async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('hr_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { headers, ...options });

    if (res.status === 401) {
        authManager.logout();
        return;
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
}

function buildQuery(params) {
    const q = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    return q ? '?' + q : '';
}

// ===== API Service =====
const api = {
    // ── Auth ──────────────────────────────────────────────────────────────────
    login:          (dto) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(dto) }),
    register:       (dto) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(dto) }),

    // ── Profile ───────────────────────────────────────────────────────────────
    getProfile:     ()        => apiFetch('/profile'),
    updateProfile:  (dto)     => apiFetch('/profile',          { method: 'PUT',  body: JSON.stringify(dto) }),
    changePassword: (dto)     => apiFetch('/profile/change-password', { method: 'POST', body: JSON.stringify(dto) }),

    // ── Users ─────────────────────────────────────────────────────────────────
    getUsers:       ()        => apiFetch('/users'),
    getUser:        (id)      => apiFetch(`/users/${id}`),
    createUser:     (dto)     => apiFetch('/users',            { method: 'POST', body: JSON.stringify(dto) }),
    updateUser:     (id, dto) => apiFetch(`/users/${id}`,      { method: 'PUT',  body: JSON.stringify(dto) }),
    deleteUser:     (id)      => apiFetch(`/users/${id}`,      { method: 'DELETE' }),
    resetPassword:  (id, dto) => apiFetch(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(dto) }),

    // ── Roles ─────────────────────────────────────────────────────────────────
    getRoles:           ()        => apiFetch('/roles'),
    getRole:            (id)      => apiFetch(`/roles/${id}`),
    getAllPermissions:   ()        => apiFetch('/roles/permissions'),
    createRole:         (dto)     => apiFetch('/roles',        { method: 'POST', body: JSON.stringify(dto) }),
    updateRole:         (id, dto) => apiFetch(`/roles/${id}`,  { method: 'PUT',  body: JSON.stringify(dto) }),
    deleteRole:         (id)      => apiFetch(`/roles/${id}`,  { method: 'DELETE' }),

    // ── Employees ────────────────────────────────────────────────────────────
    getEmployees:    (p = {}) => apiFetch(`/employees${buildQuery(p)}`),
    getEmployee:     (id)     => apiFetch(`/employees/${id}`),
    createEmployee:  (dto)    => apiFetch('/employees',        { method: 'POST', body: JSON.stringify(dto) }),
    updateEmployee:  (id, dto)=> apiFetch(`/employees/${id}`,  { method: 'PUT',  body: JSON.stringify(dto) }),
    deleteEmployee:  (id)     => apiFetch(`/employees/${id}`,  { method: 'DELETE' }),

    // ── Facilities ────────────────────────────────────────────────────────────
    getFacilities:   (p = {}) => apiFetch(`/facilities${buildQuery(p)}`),
    getFacility:     (id)     => apiFetch(`/facilities/${id}`),
    createFacility:  (dto)    => apiFetch('/facilities',       { method: 'POST', body: JSON.stringify(dto) }),
    updateFacility:  (id, dto)=> apiFetch(`/facilities/${id}`, { method: 'PUT',  body: JSON.stringify(dto) }),
    deleteFacility:  (id)     => apiFetch(`/facilities/${id}`, { method: 'DELETE' }),

    // ── Transfers ─────────────────────────────────────────────────────────────
    getTransfers:        (p = {}) => apiFetch(`/transfers${buildQuery(p)}`),
    getTransfer:         (id)     => apiFetch(`/transfers/${id}`),
    createTransfer:      (dto)    => apiFetch('/transfers',    { method: 'POST',  body: JSON.stringify(dto) }),
    updateTransferStatus:(id, dto)=> apiFetch(`/transfers/${id}/status`, { method: 'PATCH', body: JSON.stringify(dto) }),
    deleteTransfer:      (id)     => apiFetch(`/transfers/${id}`, { method: 'DELETE' }),

    // ── Dashboard ─────────────────────────────────────────────────────────────
    getDashboard: () => apiFetch('/dashboard'),
};
