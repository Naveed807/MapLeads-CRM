const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

async function request(path, options = {}) {
  const token = localStorage.getItem('mapleads_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const json = await res.json();

  if (!json.success) {
    const err = new Error(json.error?.message || 'Request failed');
    err.code   = json.error?.code;
    err.status = res.status;
    err.details = json.error?.details;
    throw err;
  }

  return json.data;
}

export const authApi = {
  login:   (email, password)                    => request('/auth/login',           { method: 'POST', body: JSON.stringify({ email, password }) }),
  register:(name, email, password, orgName)     => request('/auth/register',        { method: 'POST', body: JSON.stringify({ name, email, password, orgName }) }),
  logout:  ()                                   => request('/auth/logout',          { method: 'POST' }),
  me:      ()                                   => request('/auth/me'),
  refresh: ()                                   => request('/auth/refresh',         { method: 'POST' }),
  forgotPassword: (email)                       => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword:  (token, password)             => request('/auth/reset-password',  { method: 'POST', body: JSON.stringify({ token, password }) }),
};
