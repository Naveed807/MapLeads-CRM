# Chrome Extension API — Integration Guide

This guide covers how to authenticate your Chrome extension with the MapLeads API and push business data directly from the extension into the user's CRM.

---

## Overview

- **Login** uses the same `POST /api/v1/auth/login` endpoint — returns a JWT access token
- **Push businesses** uses `POST /api/v1/extension/businesses` — Agency plan only
- All requests use `Authorization: Bearer <token>` headers
- No cookies required — works natively from a Chrome extension

### Plan Restriction
Only users on the **Agency plan** can push businesses directly from the extension.  
This is enforced server-side by the `canUseApiAccess` gate.  
Users on Basic/Freelancer will receive a `403` error with code `FEATURE_NOT_AVAILABLE`.

---

## API Endpoints

### Base URL
```
https://your-api-domain.com/api/v1
# Local dev:
http://localhost:4000/api/v1
```

---

### 1. Login

```
POST /api/v1/auth/login
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Success response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxx...",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "OWNER",
      "planTier": "AGENCY"
    }
  }
}
```

**Error responses:**
| Status | Code | Meaning |
|--------|------|---------|
| `401` | `UNAUTHORIZED` | Wrong email or password |
| `429` | `RATE_LIMIT` | Too many login attempts |

**Store the `accessToken`** in `chrome.storage.local` — you will send it with every request.

---

### 2. Push Businesses

```
POST /api/v1/extension/businesses
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request body:**
```json
{
  "businesses": [
    {
      "name": "Ali's Restaurant",
      "phone": "+92300123456",
      "category": "Restaurant",
      "address": "Gulberg III, Lahore",
      "website": "https://alisrestaurant.pk",
      "email": "contact@alisrestaurant.pk",
      "rating": "4.5",
      "reviews": "128",
      "mapsUrl": "https://maps.google.com/?cid=XXXX"
    }
  ],
  "source": "google_maps"
}
```

**Business object fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Business name |
| `phone` | string | — | Phone number |
| `category` | string | — | Business category |
| `address` | string | — | Full address |
| `website` | string | — | Website URL |
| `email` | string | — | Business email |
| `rating` | string | — | Google rating |
| `reviews` | string | — | Review count |
| `mapsUrl` | string | — | Google Maps URL |
| `hours` | string | — | Opening hours |

**Success response `201`:**
```json
{
  "success": true,
  "data": {
    "added": 1,
    "skipped": 0,
    "batchId": "clyyy..."
  },
  "message": "Imported 1 businesses"
}
```

**Error responses:**
| Status | Code | Meaning |
|--------|------|---------|
| `401` | `UNAUTHORIZED` | Token missing, expired, or invalid |
| `403` | `FEATURE_NOT_AVAILABLE` | Not on Agency plan |
| `422` | `IMPORT_LIMIT_EXCEEDED` | Monthly import limit reached |
| `422` | `BUSINESS_LIMIT_EXCEEDED` | Max businesses storage reached |
| `422` | `VALIDATION_ERROR` | businesses array empty or invalid |

---

## Chrome Extension Implementation

### `manifest.json`
```json
{
  "manifest_version": 3,
  "name": "MapLeads Business Scraper",
  "version": "1.0.0",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": [
    "https://your-api-domain.com/*",
    "http://localhost:4000/*"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://www.google.com/maps/*"],
      "js": ["content.js"]
    }
  ]
}
```

### `api.js` — Reusable API helper
```js
const API_BASE = 'https://your-api-domain.com/api/v1';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data.data; // { accessToken, user }
}

export async function pushBusinesses(accessToken, businesses) {
  const res = await fetch(`${API_BASE}/extension/businesses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ businesses, source: 'google_maps' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to push businesses');
  return data.data; // { added, skipped, batchId }
}
```

### `popup.js` — Login form + push button
```js
import { login, pushBusinesses } from './api.js';

const API_BASE = 'https://your-api-domain.com/api/v1';

document.addEventListener('DOMContentLoaded', async () => {
  const { accessToken, planTier } = await chrome.storage.local.get(['accessToken', 'planTier']);

  if (accessToken) {
    showDashboard(planTier);
  } else {
    showLoginForm();
  }
});

function showLoginForm() {
  document.getElementById('login-section').style.display = 'block';

  document.getElementById('btn-login').addEventListener('click', async () => {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const { accessToken, user } = await login(email, password);
      await chrome.storage.local.set({ accessToken, planTier: user.planTier });
      showDashboard(user.planTier);
    } catch (e) {
      document.getElementById('login-error').textContent = e.message;
    }
  });
}

function showDashboard(planTier) {
  document.getElementById('login-section').style.display  = 'none';
  document.getElementById('dashboard-section').style.display = 'block';

  if (planTier !== 'AGENCY') {
    document.getElementById('push-btn').disabled = true;
    document.getElementById('plan-notice').textContent =
      'Upgrade to Agency plan to send businesses directly from the extension.';
    return;
  }

  document.getElementById('push-btn').addEventListener('click', async () => {
    const { accessToken } = await chrome.storage.local.get('accessToken');

    // Get scraped businesses from content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__mapleadsScrapedBusinesses ?? [],
    });

    const businesses = results[0]?.result ?? [];
    if (!businesses.length) {
      document.getElementById('status').textContent = 'No businesses scraped yet.';
      return;
    }

    try {
      document.getElementById('push-btn').disabled = true;
      document.getElementById('status').textContent = 'Sending...';

      const result = await pushBusinesses(accessToken, businesses);
      document.getElementById('status').textContent =
        `✓ ${result.added} added, ${result.skipped} duplicates skipped.`;
    } catch (e) {
      if (e.message.includes('expired') || e.message.includes('Invalid')) {
        await chrome.storage.local.remove(['accessToken', 'planTier']);
        showLoginForm();
      } else {
        document.getElementById('status').textContent = `Error: ${e.message}`;
      }
    } finally {
      document.getElementById('push-btn').disabled = false;
    }
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await chrome.storage.local.remove(['accessToken', 'planTier']);
    showLoginForm();
  });
}
```

### `content.js` — Google Maps scraper skeleton
```js
// Runs on https://www.google.com/maps/*
// Scrape business data and store in window.__mapleadsScrapedBusinesses

window.__mapleadsScrapedBusinesses = [];

function scrapeCurrentBusiness() {
  // Adjust selectors based on current Google Maps DOM
  const name     = document.querySelector('h1.DUwDvf')?.textContent?.trim();
  const phone    = document.querySelector('[data-tooltip="Copy phone number"]')?.textContent?.trim();
  const category = document.querySelector('button[jsaction*="category"]')?.textContent?.trim();
  const address  = document.querySelector('[data-tooltip="Copy address"]')?.textContent?.trim();
  const website  = document.querySelector('a[data-tooltip="Open website"]')?.href;
  const rating   = document.querySelector('.MW4etd')?.textContent?.trim();
  const reviews  = document.querySelector('.UY7F9')?.textContent?.replace(/[()]/g, '').trim();

  if (!name) return;

  const business = { name, phone, category, address, website, rating, reviews, mapsUrl: location.href };

  // Add if not already in list
  const exists = window.__mapleadsScrapedBusinesses.some(b => b.name === name && b.phone === phone);
  if (!exists) {
    window.__mapleadsScrapedBusinesses.push(business);
  }
}

// Re-scrape on URL changes (Maps navigates via pushState)
const observer = new MutationObserver(() => scrapeCurrentBusiness());
observer.observe(document.body, { childList: true, subtree: true });
scrapeCurrentBusiness();
```

---

## Token Expiry Handling

The access token expires after **15 minutes** (configured in `JWT_ACCESS_EXPIRES`). Handle expiry gracefully:

```js
async function apiCall(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e.message.includes('expired') || e.message.includes('Invalid')) {
      // Token expired — clear storage and show login
      await chrome.storage.local.remove(['accessToken', 'planTier']);
      showLoginForm();
    } else {
      throw e;
    }
  }
}
```

**Tip:** To avoid frequent re-logins, consider implementing token refresh using `POST /api/v1/auth/refresh`. Store the refresh token (valid 30 days) and use it to get new access tokens silently.

---

## Security Notes

1. **Never hardcode credentials or tokens** in extension source code
2. Store tokens only in `chrome.storage.local` (not `localStorage` — isolated per origin)
3. The extension should clear stored tokens on logout or when receiving a `401`
4. The API validates the token on every request — a compromised token cannot be used after expiry
5. All extension traffic must go over **HTTPS** in production (not HTTP)
6. The server enforces the Agency plan check — you cannot bypass it client-side

---

## Testing Locally

1. Start the API: `cd apps/api && npm run dev`
2. Change `API_BASE` in `api.js` to `http://localhost:4000/api/v1`
3. In Chrome: go to `chrome://extensions/` → Enable **Developer mode** → **Load unpacked** → select your extension folder
4. Log in with an Agency plan account
5. Open Google Maps, navigate to a business listing, click the extension icon → push

To test with a non-Agency account, you should receive:
```json
{ "success": false, "code": "FEATURE_NOT_AVAILABLE", "message": "This feature requires a higher plan. Please upgrade." }
```
