# Stripe Localhost Testing Guide

---

## ⚠️ Critical Issue in Your Current `.env`

Your `.env` currently has **Product IDs** where **Price IDs** are required:

```env
# ❌ WRONG — these start with "prod_" — they are Product IDs
STRIPE_FREELANCER_PRICE_ID=prod_UCs21YPaGMjMkZ
STRIPE_AGENCY_PRICE_ID=prod_UCs2M4EEVeE6l7

# ✅ CORRECT — Price IDs start with "price_"
STRIPE_FREELANCER_PRICE_ID=price_1AbcXXXXXXXXXXXX
STRIPE_AGENCY_PRICE_ID=price_1DefXXXXXXXXXXXX
```

The checkout will fail silently with the wrong IDs. Follow the steps below to get the correct Price IDs.

---

## Step 1 — Get the Correct Price IDs from Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure **Test mode** is ON (toggle in the top-left)
3. Go to **Product catalog** in the left sidebar
4. Click on your **Freelancer** product
5. Scroll down to the **Pricing** section
6. You will see a price listed like `$19.00 / month`
7. Click the **"..."** menu next to it → **Copy price ID**
   - It looks like: `price_1RAbcXXXXXXXXXXXX`
8. Repeat for the **Agency** product

Then update your `.env`:
```env
STRIPE_FREELANCER_PRICE_ID=price_1RAbcXXXXXXXXXXXX
STRIPE_AGENCY_PRICE_ID=price_1RDefXXXXXXXXXXXX
```

If you haven't created prices yet, on the product page click **Add a price** → set amount, monthly billing → Save.

---

## Step 2 — Install Stripe CLI (Windows)

The Stripe CLI forwards webhook events from Stripe to your local machine. Without it, payments complete on Stripe but your app never finds out — the plan won't update.

### Install via Scoop (recommended)
Open PowerShell and run:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
scoop bucket add extras
scoop install stripe
```

### Install via direct download
1. Go to: https://github.com/stripe/stripe-cli/releases/latest
2. Download `stripe_X.X.X_windows_x86_64.zip`
3. Extract `stripe.exe` to a folder like `C:\stripe\`
4. Add that folder to your system `PATH`:
   - Search **"Environment Variables"** in Windows Start
   - Edit **Path** under System Variables → Add `C:\stripe\`

### Verify installation
```powershell
stripe --version
```
Should print something like `stripe version 1.21.x`

---

## Step 3 — Login to Stripe CLI

```powershell
stripe login
```

This opens your browser and asks you to authorize the CLI with your Stripe account. Click **Allow access**.

You only need to do this once.

---

## Step 4 — Start Webhook Forwarding

Open a **new PowerShell window** (keep it running while testing) and run:

```powershell
stripe listen --forward-to http://localhost:4000/api/v1/billing/webhook
```

You will see output like:
```
> Ready! You are using Stripe API Version [2024-06-20].
> Your webhook signing secret is whsec_a1b2c3d4e5f6...  (^C to quit)
```

**Copy that `whsec_...` value** and paste it into your `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_a1b2c3d4e5f6...
```

> ⚠️ **Restart your API** after updating `.env` so it picks up the new webhook secret.

---

## Step 5 — Start Everything

You need 3 things running simultaneously — use 3 separate PowerShell windows:

**Window 1 — API:**
```powershell
cd d:\laragon\www\my-whatsapp-crm\apps\api
npm run dev
```

**Window 2 — React App:**
```powershell
cd d:\laragon\www\my-whatsapp-crm
npm start
```

**Window 3 — Stripe webhook forwarder:**
```powershell
stripe listen --forward-to http://localhost:4000/api/v1/billing/webhook
```

---

## Step 6 — Seed the Price IDs into the Database

After updating `.env` with the correct `price_` IDs, seed them into the database so the upgrade buttons activate:

```powershell
cd d:\laragon\www\my-whatsapp-crm\apps\api
```

Open Prisma Studio:
```powershell
npm run studio
```

1. Browser opens at `http://localhost:5555`
2. Click **Plan** table
3. Click the **FREELANCER** row → set `stripePriceId` to your `price_...` value → Save
4. Click the **AGENCY** row → set `stripePriceId` to your `price_...` value → Save

---

## Step 7 — Test a Payment

1. Open the app at `http://localhost:3000`
2. Log in and go to **Settings → Plans & Billing**
3. The "Upgrade to Freelancer →" button should now be **active** (not disabled/greyed out)
4. Click it — you are redirected to Stripe's test checkout page
5. Fill in payment details using a **test card**:

| Field | Value |
|-------|-------|
| Card number | `4242 4242 4242 4242` |
| Expiry | Any future date, e.g. `12/28` |
| CVC | Any 3 digits, e.g. `123` |
| Name | Any name |
| ZIP | Any 5 digits, e.g. `10001` |

6. Click **Subscribe / Pay**
7. Stripe redirects you back to `http://localhost:3000/billing?success=1`
8. The success banner appears
9. Check **Window 3 (Stripe CLI)** — you should see:
   ```
   --> customer.subscription.created  [200 OK]
   ```
10. The plan card now shows **"✓ Your Current Plan"** for Freelancer

---

## Step 8 — Test Portal (Manage Subscription)

After subscribing:
1. Go back to **Plans & Billing**
2. A **"Manage Subscription"** button appears at the top
3. Click it — opens Stripe's Customer Portal
4. You can cancel, update card, or view invoices

---

## Troubleshooting

### Upgrade button is still grey/disabled
→ `stripePriceId` is not set in the DB, or still has a `prod_` value. See Step 1 and Step 6.

### Checkout redirects back but plan didn't change
→ Webhook was not received. Check:
- Is Window 3 (`stripe listen`) still running?
- Does `STRIPE_WEBHOOK_SECRET` in `.env` match the one printed by `stripe listen`?
- Did you restart the API after changing `.env`?

### `stripe: command not found`
→ Stripe CLI is not installed or not in PATH. Redo Step 2.

### API crashes on startup
→ Check the API terminal for errors. Common cause: `.env` values still have placeholder text like `REPLACE_WITH_...`.

---

## Pakistan — Stripe Business & Bank Account Verification

**Yes, Stripe officially supports Pakistan** since 2023. You can fully verify your account using Pakistani information.

### What you can use:
| Requirement | Accepted Pakistani Documents |
|---|---|
| **Identity verification** | CNIC (Computerized National Identity Card) — front & back photo |
| **Business verification** | NTN certificate, SECP registration, trade name registration |
| **Bank account** | Any Pakistani bank account (HBL, MCB, UBL, Meezan, etc.) — use IBAN format |
| **Address proof** | Utility bill, bank statement with your address |
| **Phone number** | Pakistani mobile number (+92) is accepted |

### How to verify:
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → sign up or log in
2. Go to **Settings → Account details**
3. Under **Business details** → select **Pakistan** as country
4. Fill in your CNIC or business NTN
5. Upload CNIC photos when prompted
6. Under **Bank accounts** → add your Pakistan bank IBAN
   - Format: `PK36SCBL0000001123456702`
   - IBAN can be obtained from your bank's mobile app or by visiting a branch

### Payout currency:
- Stripe Pakistan pays out in **PKR (Pakistani Rupees)** directly to your bank
- Stripe charges are collected in USD/EUR/etc. and converted automatically

### Limitations to be aware of:
- Pakistani accounts currently **cannot accept card payments from users** directly on Stripe (payment processing)
- However, you **can use Stripe Billing/Subscriptions** to charge your customers — as long as you are the platform operator
- If you encounter restrictions, consider also looking into **Stripe Connect** or verifying with a business registration

> For the most current list of supported features by country, check: https://stripe.com/global
