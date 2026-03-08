# MapLeads CRM

**Turn Google Maps searches into WhatsApp & email outreach — in minutes.**

MapLeads CRM is a zero-backend, browser-based lead management tool built for freelancers, agencies, and sales teams. Import businesses directly from Google Maps or Excel, track your outreach status, send WhatsApp messages and emails from the app, and manage your entire pipeline offline — no server, no sign-up, no subscription required in v2.

> Built with React 19 · IndexedDB · EmailJS · SheetJS · Recharts

---

## Features at a Glance

| Module | Highlights |
|---|---|
| **Import** | Google Maps paste · Excel / CSV drag-and-drop · smart column detection · duplicate skip |
| **Businesses** | Search · filter · bulk actions · tags · reminders · notes · export CSV |
| **WhatsApp** | One-click `wa.me` links · message templates with `{name}` variables · template library |
| **Email** | EmailJS SMTP · `{from_name}` variables · send guard · auto-mark contacted |
| **Dashboard** | Pipeline stats · bar chart · recent imports |
| **DB Explorer** | Raw IndexedDB viewer · search · sort · paginate · copy |
| **UX** | Dark / light mode · fully offline · no account needed |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- npm 9 or higher

### Install & Run

```bash
git clone https://github.com/your-username/mapleads-crm.git
cd mapleads-crm
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
```

The `build/` folder deploys to any static host — Vercel, Netlify, GitHub Pages, or a local server like Laragon.

---

## Importing Businesses

### From Google Maps

1. Search for businesses on [Google Maps](https://maps.google.com) (e.g. *"hair salons Lahore"*)
2. Scroll the **left panel** to load all results
3. Click inside the panel → **Ctrl + A** → **Ctrl + C**
4. Open the **Import** tab, paste into the text area, click **Extract Businesses**
5. Review the preview and click **Add to Dashboard**

> **Tip:** If Ctrl+A misses phone numbers, right-click a card in browser DevTools and copy `outerHTML` instead.

### From Excel / CSV

1. Go to **Import → Excel / CSV** and click **Download Template**
2. Fill in your data — Name, Phone, Email, Address, Category, Website, Notes
3. Drag-and-drop the file into the import zone (or click to browse)
4. Review the detected columns and click **Add to Dashboard**

Supported formats: `.xlsx`, `.xls`, `.csv`  
Column detection supports 50+ header name variants — "Business Name", "Mobile Number", "Email Address", etc.

---

## Setting Up Email (EmailJS)

MapLeads sends emails directly from your browser using [EmailJS](https://www.emailjs.com/) — no backend or server needed.

1. Create a free account at [emailjs.com](https://www.emailjs.com/)
2. Add an **Email Service** and connect your Gmail, Outlook, or other provider
3. Create an **Email Template** using these variables:

   ```
   To:      {{to_email}}
   Subject: {{subject}}
   Body:    {{message}}
   From:    {{from_name}}
   ```

4. In MapLeads, go to the **Email** tab
5. Enter your **Service ID**, **Template ID**, and **Public Key**
6. Set your **From Name** and customise the subject / body

**Template variables:** `{name}` `{phone}` `{email}` `{address}` `{category}` `{website}` `{rating}` `{from_name}`

If EmailJS is not configured, **Send Email** opens your system mail client as a fallback.

---

## Contact Statuses

| Status | Meaning |
|---|---|
| Not Contacted | Fresh lead, no outreach yet |
| Contacted | WhatsApp message or email sent |
| Replied | Lead has responded |
| Converted | Deal closed |
| Not Interested | Lead declined |
| Not on WhatsApp | Phone exists but not registered on WhatsApp |

---

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx           Stats cards, pipeline chart, recent imports
│   ├── BusinessesView.jsx      Filter, search, bulk actions, paginated list
│   ├── BusinessRow.jsx         Business card with all actions
│   ├── ImportView.jsx          Google Maps + Excel/CSV import tabs
│   ├── TemplateView.jsx        WhatsApp template editor and library
│   ├── EmailSettingsView.jsx   EmailJS config and email template editor
│   ├── DataView.jsx            IndexedDB explorer with pagination
│   ├── Badge.jsx               Status badge
│   └── StatCard.jsx            Dashboard stat card
├── hooks/
│   └── useAppData.js           Central state — all DB reads, writes, handlers
├── utils/
│   ├── parseGoogleMaps.js      Three-layer Google Maps HTML parser
│   ├── parseExcel.js           Excel/CSV parser with column auto-detection
│   ├── emailer.js              EmailJS wrapper + mailto fallback
│   └── whatsapp.js             WhatsApp link builder
├── db/
│   └── index.js                IndexedDB schema (idb v8) and all CRUD helpers
├── constants/
│   └── index.js                Status config, country codes, default templates
└── App.js                      Root layout and tab navigation
```

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| idb | 8 | IndexedDB wrapper |
| lucide-react | latest | SVG icon set |
| recharts | 3 | Dashboard charts |
| xlsx (SheetJS) | 0.18 | Excel / CSV file parsing |
| @emailjs/browser | 4 | Browser-side email sending |
| react-scripts | 5 | CRA build toolchain |

---

## Privacy & Data

All data is stored **locally in your browser's IndexedDB**. Nothing is transmitted to any server — except emails you explicitly send through your own EmailJS credentials. Clearing browser data removes all imported records.

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feature/my-feature`
2. Commit: `git commit -m "feat: describe the change"`
3. Push and open a Pull Request

Code conventions: inline styles only (no external CSS), all shared state flows through `useAppData.js`.

---

## Roadmap

See [FEATURES.md](./FEATURES.md) for the complete feature list and the v3.0 SaaS roadmap — cloud sync, multi-user teams, WhatsApp Business API, AI-assisted outreach, billing, and more.

---

## License

MIT — free to use, modify, and distribute.

---

<p align="center">Made with love by <strong>Muhammad Naveed — CoreModify</strong></p>
