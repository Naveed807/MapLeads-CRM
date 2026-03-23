/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PLAN FEATURES CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Edit this file to control what appears on the Plans & Billing page.
 *
 * ── FEATURE_ROWS ─────────────────────────────────────────────────────────────
 *  Each entry in FEATURE_ROWS maps a DB field on the Plan model to a display
 *  row on the pricing card.
 *
 *  Fields:
 *    key    — must match the exact field name returned by GET /api/v1/billing/plans
 *             (see apps/api/prisma/schema.prisma → model Plan)
 *    label  — human-readable label shown on the card
 *    fmt    — formatting function for numeric fields (receives the raw DB value).
 *             Set to  null  for boolean fields (shows ✓ / ✗ automatically).
 *             Common helpers:
 *               v => v === -1 ? "Unlimited" : v.toLocaleString()   ← numbers
 *               v => v === -1 ? "Unlimited" : String(v)            ← small integers
 *    icon   — lucide-react icon name string (must be imported in PricingView.jsx
 *             if you add a new one)
 *
 *  Available DB keys (from schema.prisma):
 *    Numeric  : maxBusinesses, maxImportsPerMonth, maxTeamMembers, maxTemplates
 *    Boolean  : canExportCsv, canUseEmailjs, canUseBulkActions,
 *               canUseReminders, canUseAdvancedStats, canUseApiAccess
 *
 * ── PLAN_DESCRIPTIONS ────────────────────────────────────────────────────────
 *  Short tagline shown under the plan name on each card.
 *  Keys must match the PlanTier enum: BASIC | FREELANCER | AGENCY
 *
 * ── PLAN_HIGHLIGHTS ──────────────────────────────────────────────────────────
 *  Optional bullet points shown at the top of the feature list (before the
 *  auto-generated rows).  Leave array empty [] to hide.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Feature rows ─────────────────────────────────────────────────────────────
// Order here = order on the card. Remove a row to hide it from all cards.
export const FEATURE_ROWS = [
  {
    key:   "maxBusinesses",
    label: "Businesses",
    fmt:   v => v === -1 ? "Unlimited" : v.toLocaleString(),
    icon:  "Building2",
  },
  {
    key:   "maxImportsPerMonth",
    label: "Imports / month",
    fmt:   v => v === -1 ? "Unlimited" : v.toLocaleString(),
    icon:  "Upload",
  },
  {
    key:   "maxTeamMembers",
    label: "Team members",
    fmt:   v => v === -1 ? "Unlimited" : String(v),
    icon:  "Users",
  },
  {
    key:   "maxTemplates",
    label: "WhatsApp Templates",
    fmt:   v => v === -1 ? "Unlimited" : String(v),
    icon:  "FileText",
  },
  {
    key:   "canExportCsv",
    label: "CSV Export",
    fmt:   null,          // boolean — shows ✓ / ✗
    icon:  "Download",
  },
  {
    key:   "canUseEmailjs",
    label: "Email Campaigns",
    fmt:   null,
    icon:  "Mail",
  },
  {
    key:   "canUseBulkActions",
    label: "Bulk Actions",
    fmt:   null,
    icon:  "BarChart3",
  },
  {
    key:   "canUseReminders",
    label: "Reminders",
    fmt:   null,
    icon:  "HelpCircle",
  },
  {
    key:   "canUseApiAccess",
    label: "API Access",
    fmt:   null,
    icon:  "Key",
  },
];

// ─── Per-plan taglines ────────────────────────────────────────────────────────
export const PLAN_DESCRIPTIONS = {
  BASIC:      "Everything you need to get started.",
  FREELANCER: "For growing businesses and solo operators.",
  AGENCY:     "Unlimited power for teams and agencies.",
};

// ─── Per-plan highlight bullets (shown before feature rows) ──────────────────
// Set to [] to hide highlights for a plan.
export const PLAN_HIGHLIGHTS = {
  BASIC: [],
  FREELANCER: [
    "Includes all Basic features",
    "Priority support",
    "Chrome extension for scrapping businesses from Google Maps",
    "Build and download businesses in minutes",
  ],
  AGENCY: [
    "Includes all Freelancer features",
    "Dedicated account manager",
    "Chrome extension for scrapping businesses from Google Maps",
    "Build and download businesses in minutes",
    "Send businesses directly from Chrome extension to CRM",
  ],
};

