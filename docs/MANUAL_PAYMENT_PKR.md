# Manual Payment Setup (JazzCash / Bank Transfer)

This guide explains how to accept payments from Pakistani users via JazzCash or bank transfer and manually upgrade their plan after verification.

---

## How It Works

```
User selects PKR pricing on Plans page
        ↓
Clicks "Pay via Bank / JazzCash →"
        ↓
User transfers money to your account
        ↓
User emails screenshot to billing@mapleads.io
        ↓
You verify in bank/JazzCash app
        ↓
Admin runs upgrade command or uses Prisma Studio
        ↓
User's plan is updated ✓
```

---

## Step 1 — Set Up Your Payment Accounts

### JazzCash (Recommended — instant notification)
1. Download the JazzCash merchant app or visit jazzcash.com.pk
2. Create a **JazzCash Business Account** or use your personal number
3. Note down your **JazzCash mobile number** (e.g. `0300-XXXXXXX`)

### Allied Bank (ABL) / Any Pakistani Bank
1. Log in to your internet banking
2. Note down your full **IBAN** (format: `PK36ABCD0000001234567890`)
3. Note down your **Account Title** exactly as it appears on the account

---

## Step 2 — Update Payment Details in the App

Open `src/components/PricingView.jsx` and update the `billing@mapleads.io` email in the PKR button (or add a payment details modal — see optional section below).

You can also update the FAQ to include your payment details:

Open `src/components/PricingView.jsx` and find the `FAQ` array, add:

```js
{
  q: "How do I pay in Pakistani Rupees (PKR)?",
  a: "Click '🇵🇰 PKR' toggle, select your plan, and click 'Pay via Bank / JazzCash'. Transfer the amount to our JazzCash: 0300-XXXXXXX or ABL IBAN: PK36XXXXX. Email your payment screenshot to billing@mapleads.io with your registered email and plan name."
},
```

---

## Step 3 — PKR Plan Prices

Current PKR prices are defined in `src/constants/planFeatures.js`:

```js
export const PKR_PRICES = {
  BASIC:      { amount: 0,      label: "Free"           },
  FREELANCER: { amount: 5499,   label: "Rs 5,499 / mo"  },
  AGENCY:     { amount: 13999,  label: "Rs 13,999 / mo" },
};
```

Edit these values any time to adjust pricing. The change is immediately reflected on the Plans page.

---

## Step 4 — Upgrade a User's Plan After Payment Verification

Once you have verified the payment in your bank/JazzCash app, upgrade the user's plan using **one of these methods**:

### Method A — Prisma Studio (No code, easiest)

```bash
cd apps/api
npm run studio
```

1. Open `Subscription` table
2. Find the row where `orgId` matches the user's organization
3. Find the `planId` field → change it to the ID of the plan they paid for
   - You can find Plan IDs in the `Plan` table
4. Also update `status` to `ACTIVE`
5. Set `currentPeriodStart` to today's date
6. Set `currentPeriodEnd` to one month from today
7. Save

### Method B — Admin Script (Fastest for repeat use)

Create a one-time script `apps/api/src/scripts/upgrade-plan.ts`:

```ts
import { prisma } from '../config/database';

// Usage: npx ts-node src/scripts/upgrade-plan.ts <orgId> <FREELANCER|AGENCY>
async function main() {
  const [,, orgId, tier] = process.argv;
  if (!orgId || !tier) {
    console.error('Usage: ts-node upgrade-plan.ts <orgId> FREELANCER|AGENCY');
    process.exit(1);
  }

  const plan = await prisma.plan.findUnique({ where: { tier: tier as any } });
  if (!plan) { console.error('Plan not found'); process.exit(1); }

  const now     = new Date();
  const oneMonth = new Date(now);
  oneMonth.setMonth(oneMonth.getMonth() + 1);

  const sub = await prisma.subscription.update({
    where: { orgId },
    data: {
      planId:             plan.id,
      status:             'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd:   oneMonth,
    },
  });

  console.log(`✓ Upgraded org ${orgId} to ${tier} until ${oneMonth.toDateString()}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
```

Run it:
```bash
cd apps/api
npx ts-node src/scripts/upgrade-plan.ts <orgId> FREELANCER
```

To find a user's `orgId`, look in the `Organization` table in Prisma Studio, or ask the user for their registered email and look them up.

### Method C — Direct SQL

```sql
-- 1. Find the plan ID
SELECT id FROM "Plan" WHERE tier = 'FREELANCER';

-- 2. Find the org ID from user email
SELECT o.id FROM "Organization" o
JOIN "OrgMember" m ON m."orgId" = o.id
JOIN "User" u ON u.id = m."userId"
WHERE u.email = 'user@example.com';

-- 3. Upgrade the subscription
UPDATE "Subscription"
SET
  "planId"             = '<plan-id-from-step-1>',
  "status"             = 'ACTIVE',
  "currentPeriodStart" = NOW(),
  "currentPeriodEnd"   = NOW() + INTERVAL '1 month'
WHERE "orgId" = '<org-id-from-step-2>';
```

---

## Step 5 — Handling Renewals

Manual payments require you to track renewals yourself. Recommended workflow:

1. Set a calendar reminder 3 days before `currentPeriodEnd`
2. Email the user: "Your MapLeads plan expires on [date]. Please transfer Rs X,XXX to renew."
3. After payment received → run the upgrade script again to extend `currentPeriodEnd` by 1 month
4. If user does not renew → downgrade them to Basic:

```bash
npx ts-node src/scripts/upgrade-plan.ts <orgId> BASIC
```

Or in SQL:
```sql
UPDATE "Subscription"
SET "planId" = (SELECT id FROM "Plan" WHERE tier = 'BASIC'), "status" = 'ACTIVE'
WHERE "orgId" = '<orgId>';
```

---

## Step 6 — Finding a User's Org ID

If you know the user's email:

**Prisma Studio:**
1. Open `User` table → find by email → copy the user's `id`
2. Open `OrgMember` table → find by `userId` → copy `orgId`

**Or SQL:**
```sql
SELECT o.id AS "orgId", o.name AS "orgName", u.email
FROM "Organization" o
JOIN "OrgMember" m ON m."orgId" = o.id
JOIN "User" u ON u.id = m."userId"
WHERE u.email = 'user@example.com';
```

---

## Summary — Payment Details to Share with Users

Create a standard reply template for your billing email:

```
Subject: MapLeads Plan Upgrade — Payment Instructions

Hi [Name],

To upgrade to the [Freelancer/Agency] plan, please transfer the amount below:

Plan: Freelancer — Rs 5,499/month
      Agency     — Rs 13,999/month

Payment Options:
──────────────────────────────────
JazzCash:   0300-XXXXXXX  (Account: Your Name)
ABL Bank:   IBAN: PK36XXXX...  (Account Title: Your Business Name)
──────────────────────────────────

After payment:
1. Take a screenshot of the payment confirmation
2. Reply to this email with:
   - Your screenshot
   - Your registered email: ___________
   - Plan selected: ___________

We will activate your plan within 24 hours of verification.

Thank you,
MapLeads Team
```
