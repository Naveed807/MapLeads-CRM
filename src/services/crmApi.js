/**
 * CRM API service — wraps all authenticated endpoints for businesses, imports,
 * templates, email settings and notifications.
 *
 * All calls attach the stored Bearer token automatically (same pattern as authApi.js).
 */

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

// Refresh the access token using the HttpOnly refresh_token cookie.
// Returns the new access token, or throws if the session has fully expired.
let _refreshPromise = null;
async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;          // coalesce concurrent calls
  _refreshPromise = (async () => {
    try {
      const res  = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      const json = await res.json();
      if (!json.success) throw new Error('Session expired');
      localStorage.setItem('mapleads_token', json.data.accessToken);
      return json.data.accessToken;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('mapleads_token');
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });

  // Token expired — silently refresh and retry once (check status before parsing body)
  if (res.status === 401) {
    try {
      const newToken     = await refreshAccessToken();
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      const retryRes     = await fetch(`${BASE}${path}`, { ...options, headers: retryHeaders, credentials: 'include' });
      const retryJson    = await retryRes.json();
      if (!retryJson.success) {
        const err   = new Error(retryJson.error?.message || 'Request failed');
        err.code    = retryJson.error?.code;
        err.status  = retryRes.status;
        err.details = retryJson.error?.details;
        throw err;
      }
      return retryJson.data;
    } catch {
      // Refresh token also expired — clear session and redirect to login
      localStorage.removeItem('mapleads_token');
      localStorage.removeItem('mapleads_user');
      window.location.href = '/';
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Parse JSON safely — guard against non-JSON error responses
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server error (${res.status})`);
  }

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
  getAssignee:       (id)          => request(`/businesses/${id}/assignee`),
  setAssignee:       (id, memberId)=> request(`/businesses/${id}/assignee`, { method: 'PUT', body: JSON.stringify({ memberId: memberId ?? null }) }),
  getContactLogs:    (id)          => request(`/businesses/${id}/logs`),
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

// ─── Team / Organization members ─────────────────────────────────────────────
export const teamApi = {
  /** List all org members */
  listMembers: () =>
    request('/team'),

  /** Invite / create a new team member
   *  body: { email, name, role, password? }
   */
  inviteMember: (data) =>
    request('/team', { method: 'POST', body: JSON.stringify(data) }),

  /** Update a member's role: { role } */
  updateRole: (userId, role) =>
    request(`/team/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  /** Remove a member */
  removeMember: (userId) =>
    request(`/team/${userId}`, { method: 'DELETE' }),

  /** Get businesses assigned to a member (identified by OrgMember.id) */
  getMemberAssignments: (memberId) =>
    request(`/team/${memberId}/assignments`),

  /** Replace the full list of assigned businesses for a member */
  setMemberAssignments: (memberId, bizIds) =>
    request(`/team/${memberId}/assignments`, { method: 'PUT', body: JSON.stringify({ bizIds }) }),
};

// ─── Plan limits (client-side mirror of PLAN_LIMITS) ─────────────────────────
export const PLAN_LIMITS = {
  BASIC:      { maxBusinesses: 100,   maxImportsPerMonth: 3,  maxTeamMembers: 1,  canUseBulkActions: false, canExportCsv: false, canUseEmailjs: false, canUseReminders: false },
  FREELANCER: { maxBusinesses: 2000,  maxImportsPerMonth: 30, maxTeamMembers: 3,  canUseBulkActions: true,  canExportCsv: true,  canUseEmailjs: true,  canUseReminders: true  },
  AGENCY:     { maxBusinesses: -1,    maxImportsPerMonth: -1, maxTeamMembers: 25, canUseBulkActions: true,  canExportCsv: true,  canUseEmailjs: true,  canUseReminders: true  },
};
