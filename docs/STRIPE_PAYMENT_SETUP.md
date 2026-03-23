# Stripe Payment Setup Guide

Complete step-by-step guide to wiring up the Stripe billing integration in MapLeads CRM.

---

## Overview

The billing system uses:
- **Stripe Checkout** — hosted payment page for upgrading plans
- **Stripe Customer Portal** — hosted page for managing/cancelling subscriptions
- **Stripe Webhooks** — keeps the local `Subscription` record in sync automatically

The flow works like this:
1. User clicks "Upgrade to Freelancer" → API creates a Stripe Checkout Session → user pays on Stripe's hosted page → Stripe redirects back to `/billing?success=1`
2. Stripe fires a `customer.subscription.created` webhook → API receives it → updates the `Subscription` row and switches the org to the new plan

---

## Step 1 — Create a Stripe Account

1. Sign up or log in at [dashboard.stripe.com](https://dashboard.stripe.com)
2. For testing use **Test mode** (toggle in top-left of the Stripe dashboard)
3. For production use **Live mode**

---

## Step 2 — Get Your API Keys

In the Stripe dashboard:  
**Developers → API keys**

| Key | Where to put it |
|-----|----------------|
| **Secret key** (`sk_test_…` or `sk_live_…`) | `STRIPE_SECRET_KEY` in `.env` |

> Never commit the secret key. It is only ever used server-side.

---

## Step 3 — Create Products & Prices

You need one **Price** for each paid plan (Freelancer and Agency).

### In the Stripe Dashboard:
**Product catalog → Add product**

#### Freelancer Plan
- **Name**: Freelancer
- **Pricing model**: Standard pricing
- **Price**: $19.00 / month  
- **Billing period**: Monthly  
- Click **Save product**
- Copy the **Price ID** → looks like `price_1AbcXXXXXXXXXXXX`

#### Agency Plan
- **Name**: Agency
- **Pricing model**: Standard pricing
- **Price**: $49.00 / month  
- **Billing period**: Monthly  
- Click **Save product**
- Copy the **Price ID** → looks like `price_1DefXXXXXXXXXXXX`

> The Basic plan is free — it does **not** need a Stripe product or price.

---

## Step 4 — Configure Environment Variables

Open `apps/api/.env` and fill in the four Stripe values:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_FREELANCER_PRICE_ID=price_FREELANCER_PRICE_ID_HERE
STRIPE_AGENCY_PRICE_ID=price_AGENCY_PRICE_ID_HERE
```

Also make sure `FRONTEND_URL` is set to wherever the React app runs (Stripe uses it for redirect URLs):

```env
FRONTEND_URL=http://localhost:3000
# Production example:
# FRONTEND_URL=https://app.mapleads.io
```

---

## Step 5 — Seed Price IDs into the Database

The `Plan` rows in the database have a `stripePriceId` column. The webhook listener uses this to look up which plan to activate after a payment. You must populate it.

### Option A — Using Prisma Studio (easiest)
```bash
cd apps/api
npm run studio
```
1. Open **Plan** table
2. Edit the `FREELANCER` row → set `stripePriceId` to your Freelancer Price ID
3. Edit the `AGENCY` row → set `stripePriceId` to your Agency Price ID
4. Basic stays `null` (it's free)

### Option B — Direct SQL
```sql
UPDATE "Plan" SET "stripePriceId" = 'price_XXXX_FREELANCER' WHERE tier = 'FREELANCER';
UPDATE "Plan" SET "stripePriceId" = 'price_XXXX_AGENCY'     WHERE tier = 'AGENCY';
```

### Option C — Add to seed data
Open `apps/api/src/config/plans.ts` and add `stripePriceId` to each plan seed entry:

```ts
{
  tier: 'FREELANCER' as PlanTier,
  // ...other fields...
  stripePriceId: 'price_XXXX_FREELANCER',
},
{
  tier: 'AGENCY' as PlanTier,
  // ...other fields...
  stripePriceId: 'price_XXXX_AGENCY',
},
```

Then run:
```bash
cd apps/api
npm run seed
```

> **Why this matters:** Until `stripePriceId` is set, the upgrade buttons on the Plans & Billing page are shown as disabled. The frontend checks `plan.stripePriceId` to decide whether to show an active checkout button.

---

## Step 6 — Set Up Stripe Webhooks

Stripe must be able to call your API when a subscription changes (payment success, cancellation, etc.).

### For Local Development — Stripe CLI

1. Install the Stripe CLI: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

2. Login:
   ```bash
   stripe login
   ```

3. Start forwarding to your local API:
   ```bash
   stripe listen --forward-to http://localhost:4000/api/v1/billing/webhook
   ```

4. The CLI will print a webhook signing secret like `whsec_abc123...`  
   Copy it into your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_abc123...
   ```

5. Leave the `stripe listen` command running while you test.

### For Production — Stripe Dashboard

In the Stripe dashboard:  
**Developers → Webhooks → Add endpoint**

- **Endpoint URL**: `https://your-api-domain.com/api/v1/billing/webhook`
- **Events to listen for**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Click **Add endpoint**
- On the endpoint detail page, click **Reveal signing secret** → copy `whsec_...`
- Set it as `STRIPE_WEBHOOK_SECRET` in your production environment

> **Important:** The webhook route uses `express.raw()` middleware (not JSON) so the raw body is available for signature verification. Do **not** add JSON middleware before the `/webhook` route.

---

## Step 7 — Enable the Customer Portal

The "Manage Subscription" button opens Stripe's hosted Customer Portal. You must activate it first.

In the Stripe dashboard:  
**Settings → Billing → Customer portal**

1. Toggle portal to **Active**
2. Configure which features customers can use:
   - ✅ Cancel subscriptions
   - ✅ Update payment method
   - ✅ View invoice history
   - ✅ Switch plans (optional — if you want Stripe to handle downgrades too)
3. Save

---

## Step 8 — Test the Full Flow

### Prerequisites
- API running on `http://localhost:4000`
- React app running on `http://localhost:3000`
- `stripe listen` running (webhook forwarding)
- `stripePriceId` seeded in DB

### Test Checkout
1. Log in as a non-admin user (or any org on the BASIC plan)
2. Go to **Settings → Plans & Billing**
3. Click **Upgrade to Freelancer →**
4. You are redirected to Stripe's hosted checkout page
5. Use test card: **`4242 4242 4242 4242`**, any future expiry, any CVC
6. Complete payment
7. You are redirected back to `/billing?success=1`
8. The success banner appears and the plan card updates to show "Current"

### Test Webhook
Check the `stripe listen` terminal — you should see:
```
--> customer.subscription.created  [200 OK]
```
The database `Subscription` row will now have `status = ACTIVE`, the correct `planId`, and period dates.

### Test Portal
1. After subscribing, click **Manage Subscription**
2. You are taken to the Stripe Customer Portal
3. You can cancel, update payment method, or view invoices

### Useful Test Cards
| Scenario | Card Number |
|---|---|
| Successful payment | `4242 4242 4242 4242` |
| Requires 3D Secure | `4000 0025 0000 3155` |
| Card declined | `4000 0000 0000 9995` |
| Insufficient funds | `4000 0000 0000 9995` |

---

## Step 9 — Production Checklist

Before going live, complete all of these:

- [ ] Switch Stripe to **Live mode** and get production API keys
- [ ] Set `STRIPE_SECRET_KEY=sk_live_...` in production env
- [ ] Create live Stripe products and prices (exact same steps as Step 3)
- [ ] Update database `stripePriceId` with **live** price IDs
- [ ] Register production webhook endpoint in Stripe dashboard (Step 6 — Production)
- [ ] Set `STRIPE_WEBHOOK_SECRET=whsec_...` in production env (live webhook secret)
- [ ] Set `FRONTEND_URL=https://your-app-domain.com` in production env
- [ ] Enable Customer Portal in live mode (Step 7)
- [ ] Test one real payment with a real card

---

## API Reference

All billing endpoints require a valid `accessToken` cookie (authenticated user).

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/billing/plans` | — | Returns all 3 plan rows from DB |
| `GET` | `/api/v1/billing/subscription` | — | Returns current org's subscription |
| `POST` | `/api/v1/billing/checkout` | `{ "planId": "price_XXX" }` | Creates Stripe Checkout Session, returns `{ url }` |
| `POST` | `/api/v1/billing/portal` | — | Creates Stripe Customer Portal session, returns `{ url }` |
| `POST` | `/api/v1/billing/webhook` | raw body | Stripe webhook receiver (no auth required) |

> `planId` in the checkout body must be a **Stripe Price ID** (e.g. `price_xxx`), not the internal DB plan UUID.

---

## Troubleshooting

### "Upgrade to Freelancer" button is disabled
→ `stripePriceId` is not set on that Plan row in the database. See Step 5.

### Stripe redirects back but plan doesn't update
→ Webhook is not being received. Check:
1. `stripe listen` is running (dev) or endpoint is registered (production)
2. `STRIPE_WEBHOOK_SECRET` matches the one shown in Stripe CLI / dashboard
3. API logs for webhook errors: `Invalid webhook signature`

### `STRIPE_SECRET_KEY is not configured` error in API logs
→ `.env` file is missing or `STRIPE_SECRET_KEY` is still the placeholder value.

### Customer Portal says "No billing account found"
→ The org has never gone through checkout (no `stripeCustomerId` saved). User must subscribe at least once before the portal is available.

### Plan card still shows old data after payment
→ The page fetches from the API on load. Hard-refresh the browser (`Ctrl+Shift+R`) or wait a moment for the webhook to process.
