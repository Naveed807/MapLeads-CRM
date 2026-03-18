/**
 * CRM API service — wraps all authenticated endpoints for businesses, imports,
 * templates, email settings and notifications.
 *
 * All calls attach the stored Bearer token automatically (same pattern as authApi.js).
 */

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

async function request(path, options = {}) {
  const token = localStorage.getItem('mapleads_token');
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });
  const json = await res.json();

  if (!json.success) {
    const err = new Error(json.error?.message || 'Request failed');
    err.code    = json.error?.code;
    err.status  = res.status;
    err.details = json.error?.details;
    throw err;
  }

  return json.data;
}

// ─── Businesses ───────────────────────────────────────────────────────────────
export const businessApi = {
  list:              (params = {}) => request('/businesses?' + new URLSearchParams(params).toString()),
  getStats:          ()            => request('/businesses/stats'),
  updateStatus:      (id, status)  => request(`/businesses/${id}/status`,  { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateNote:        (id, note)    => request(`/businesses/${id}/note`,    { method: 'PATCH', body: JSON.stringify({ note }) }),
  updateTags:        (id, tags)    => request(`/businesses/${id}/tags`,    { method: 'PATCH', body: JSON.stringify({ tags }) }),
  delete:            (id)          => request(`/businesses/${id}`,         { method: 'DELETE' }),
  bulkUpdateStatus:  (ids, status) => request('/businesses/bulk/status',   { method: 'POST', body: JSON.stringify({ ids, status }) }),
  bulkDelete:        (ids)         => request('/businesses/bulk/delete',   { method: 'POST', body: JSON.stringify({ ids }) }),
  clearAll:          ()            => request('/businesses',               { method: 'DELETE' }),
};

// ─── Imports ──────────────────────────────────────────────────────────────────
export const importApi = {
  /** Send pre-parsed businesses array to the API. source: 'google_maps' | 'excel' */
  importBusinesses: (businesses, source = 'google_maps') =>
    request('/imports', { method: 'POST', body: JSON.stringify({ businesses, source }) }),
  getHistory: () => request('/imports'),
  deleteBatch: (id) => request(`/imports/${id}`, { method: 'DELETE' }),
};

// ─── Templates ────────────────────────────────────────────────────────────────
export const templateApi = {
  list:       ()         => request('/templates'),
  getDefault: ()         => request('/templates/default'),
  create:     (data)     => request('/templates',          { method: 'POST',  body: JSON.stringify(data) }),
  update:     (id, data) => request(`/templates/${id}`,    { method: 'PATCH', body: JSON.stringify(data) }),
  delete:     (id)       => request(`/templates/${id}`,    { method: 'DELETE' }),
  setDefault: (id)       => request(`/templates/${id}/default`, { method: 'PATCH' }),
};

// ─── Email settings ───────────────────────────────────────────────────────────
export const emailApi = {
  getSettings:  ()       => request('/email/settings'),
  saveSettings: (data)   => request('/email/settings',     { method: 'PUT', body: JSON.stringify(data) }),
  send:         (data)   => request('/email/send',         { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationApi = {
  list:        ()   => request('/notifications'),
  markRead:    (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: ()   => request('/notifications/mark-all-read', { method: 'POST' }),
  dismiss:     (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
};

// ─── Plan limits (client-side mirror of PLAN_LIMITS) ─────────────────────────
export const PLAN_LIMITS = {
  BASIC:      { maxBusinesses: 100,   maxImportsPerMonth: 3,  canUseBulkActions: false, canExportCsv: false, canUseEmailjs: false, canUseReminders: false },
  FREELANCER: { maxBusinesses: 2000,  maxImportsPerMonth: 30, canUseBulkActions: true,  canExportCsv: true,  canUseEmailjs: true,  canUseReminders: true  },
  AGENCY:     { maxBusinesses: -1,    maxImportsPerMonth: -1, canUseBulkActions: true,  canExportCsv: true,  canUseEmailjs: true,  canUseReminders: true  },
};
