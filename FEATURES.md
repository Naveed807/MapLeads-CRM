# MapLeads CRM — Feature Roadmap

> **Current Version:** v2.0.0 — Local / Single-User
> **Upcoming:** v3.0.0 — SaaS / Multi-Tenant Cloud Platform

---

## ✅ Current Features (v2.0)

### 📥 Import
- **Google Maps import** — paste raw HTML or Ctrl+A text from the Google Maps results panel; three-layer phone extraction (CSS selector → regex span scan → full-text proximity scan)
- **Excel / CSV import** — drag-and-drop or browse `.xlsx`, `.xls`, `.csv`; smart column auto-detection with 50+ header variants (Name, Business Name, Company, Phone, Mobile, Email, Address, etc.)
- **Download import template** — pre-formatted `.xlsx` template with all supported columns
- **Duplicate detection** — skips businesses that match by name+phone, name+email, or name-only
- **Import history** — timestamped log of every import with added / skipped counts
- **Delete import batch** — removes an entire import batch and all its associated businesses in one click
- **Country code selector** — auto-prepend dial code to raw phone numbers for WhatsApp links

### 🏢 Business Management
- **Businesses view** — paginated list (50 per page) grouped by import date, collapsible date groups
- **Search** — real-time search across name, category, and address
- **Filter by status** — filter to any of the 6 contact statuses
- **Filter by tag** — filter to businesses sharing a custom tag
- **Bulk select** — checkbox per row + select-all for the current filter
- **Bulk status change** — update status on multiple businesses at once
- **Bulk delete** — permanently remove multiple businesses at once
- **Export CSV** — download all businesses + contact data as a spreadsheet
- **Notes** — free-text note field per business, auto-saved on blur
- **Tags** — comma / Enter-delimited tags per business; tag filter in toolbar
- **Follow-up reminders** — set a date + note reminder per business; overdue badge shown on card
- **Email field** — displayed on business card with envelope icon

### 📱 WhatsApp Outreach
- **One-click WhatsApp** — opens `wa.me` link with a pre-filled message template
- **Template variables** — `{name}`, `{phone}`, `{address}`, `{category}`, `{website}`, `{rating}` substitution
- **Template library** — save, name, and switch between multiple message templates
- **Contact status tracking** — automatically marks business as "Contacted" when WhatsApp is opened

### 📧 Email Outreach
- **EmailJS integration** — send emails directly from the browser via Gmail SMTP (no backend required)
- **Mailto fallback** — opens system mail client if EmailJS is not configured
- **Email template editor** — subject + body with `{name}`, `{from_name}`, `{email}`, and other variable substitutions
- **Send guard** — button disabled and shows "Sending…" while in-flight; prevents double-send
- **Send feedback** — green / red inline status banner for 6 seconds after each send attempt
- **Auto-mark contacted** — status updated to "Contacted" after a successful send

### 📊 Dashboard
- **Stats cards** — Total Businesses, With Phone, Contacted, Replied, Converted, Not Interested, Not on WhatsApp
- **Recharts bar chart** — visual breakdown of the contact pipeline
- **Recent businesses** — grouped by import date, same format as the Businesses view
- **Navigation shortcuts** — dashboard cards link directly to the filtered Businesses view

### 🗃️ Database Explorer
- **Raw IndexedDB viewer** — browse all 6 stores: Businesses, Templates, Tags, Reminders, Import History, Settings
- **Live record counts** — per-store badge with one-click refresh
- **Search** — full-text JSON search across any store
- **Sort** — click any column header to sort ascending / descending
- **Pagination** — configurable rows per page (10 / 25 / 50 / 100) with first / prev / page-numbers / next / last controls and "X–Y of Z" counter
- **Copy cell** — copy any cell value to clipboard with one click
- **Smart cell renderer** — arrays shown as badges, objects as collapsible JSON, ISO dates as locale strings, long text truncated with expand toggle

### 🎨 UX & Settings
- **Dark / Light mode** — persistent preference stored in IndexedDB
- **Fully offline** — all data stored locally; no server or account required
- **Country code preference** — persisted across sessions
- **Responsive layout** — optimised for laptop and wide-screen browsers

### 🛠 Tech Stack
| Layer | Library |
|---|---|
| UI Framework | React 19 |
| Local Database | IndexedDB via `idb` v8 |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Excel Parsing | `xlsx` (SheetJS) |
| Email Sending | `@emailjs/browser` |
| Build Tool | Create React App / react-scripts 5 |

---

## 🚀 Upcoming — v3.0 SaaS Platform

### 👥 Multi-User & Teams
- [ ] User authentication — email/password + Google OAuth via Supabase Auth
- [ ] Team workspaces — invite members, role-based access (Owner / Manager / Agent)
- [ ] Per-user activity log — who imported, who contacted, when
- [ ] Agent assignment — assign businesses to specific team members
- [ ] Real-time collaboration — live status sync across agents via Supabase Realtime

### ☁️ Cloud Storage & Sync
- [ ] Cloud database — PostgreSQL via Supabase (replaces IndexedDB)
- [ ] Multi-device sync — same data on any browser, any device
- [ ] Offline-first with sync — local cache + background sync on reconnect
- [ ] Data backup & restore — one-click export / import of entire workspace

### 📥 Advanced Import
- [ ] Scheduled Google Maps scraping — auto-import on a recurring schedule
- [ ] API import — connect to Hunter.io, Apollo, and other lead sources
- [ ] Webhook intake — receive leads via POST from any external source
- [ ] Duplicate merging UI — review and manually merge near-duplicate records
- [ ] Lead scoring — auto-score based on ratings, reviews, and data completeness

### 📱 WhatsApp Automation
- [ ] WhatsApp Business API integration — send messages programmatically (Meta Cloud API)
- [ ] Bulk WhatsApp campaigns — schedule and send to hundreds of contacts at once
- [ ] Message delivery tracking — sent / delivered / read receipts
- [ ] Auto-reply detection — detect replies and auto-update contact status
- [ ] Template approval management — manage Meta-approved message templates in-app

### 📧 Advanced Email
- [ ] Custom SMTP configuration — connect any provider (Gmail, Outlook, SendGrid, etc.)
- [ ] Bulk email campaigns — send personalised emails to filtered segments
- [ ] Open & click tracking — pixel tracking + link wrapping
- [ ] Drip sequences — automated follow-up email chains with configurable delays
- [ ] Unsubscribe management — one-click unsubscribe + suppression list
- [ ] Spam score preview and deliverability checks

### 🤖 AI Features
- [ ] AI message writer — generate WhatsApp / email copy from a business profile
- [ ] Smart reply suggestions — GPT-powered reply drafts from conversation history
- [ ] Lead qualification scoring — AI rates lead quality from scraped data
- [ ] Sentiment analysis — auto-tag replies as positive / neutral / negative
- [ ] Category enrichment — fill missing business categories using AI

### 📊 Analytics & Reporting
- [ ] Advanced pipeline dashboard — funnel visualisation, conversion rates, time-to-convert
- [ ] Campaign reports — per-import-batch performance metrics
- [ ] Agent leaderboard — contacted / replied / converted per team member
- [ ] Scheduled email reports — weekly / monthly summary delivered to workspace owner
- [ ] Custom date range filters on all metrics

### 💼 Full CRM
- [ ] Pipeline board (Kanban) — drag-and-drop deals across custom stages
- [ ] Custom fields — add any fields to business profiles
- [ ] Custom pipeline stages — define your own statuses beyond the defaults
- [ ] Contact timeline — full interaction history per business
- [ ] File attachments — proposals, contracts, and documents per business record
- [ ] Deals & revenue tracking — deal value and expected close date per lead

### 💳 SaaS Infrastructure
- [ ] Subscription billing — Stripe integration, monthly / annual plans
- [ ] Free tier — limited imports and contacts for solo users
- [ ] Usage metering — contacts, emails sent, and imports per billing period
- [ ] Admin console — manage users, workspaces, and billing
- [ ] White-label option — custom domain + branding for agency resellers
- [ ] REST API — developer access to all CRM data
- [ ] Zapier / Make integrations — connect to 5 000+ apps

### 📱 Mobile
- [ ] Progressive Web App (PWA) — installable on iOS and Android
- [ ] Native mobile app — React Native companion app
- [ ] Push notifications — reminder alerts and reply notifications on mobile

---

## 📋 Version History

| Version | Date | Highlights |
|---|---|---|
| v1.0 | 2025 | Single-file monolith — basic Google Maps import + WhatsApp link generation |
| v2.0 | Mar 2026 | Modular architecture · IndexedDB · templates · tags · reminders · dark mode · Excel import · email outreach · DB explorer · pagination |
| v3.0 | TBD | SaaS — cloud sync · teams · WhatsApp Business API · AI · billing |
