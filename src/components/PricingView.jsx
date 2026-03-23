import { useState, useEffect } from "react";
import {
  Check, X, Zap, Crown, Star, CreditCard, Settings2,
  AlertCircle, CheckCircle2, Loader2, Building2, Users,
  FileText, Upload, Mail, BarChart3, Key, Download,
  HelpCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { billingApi } from "../services/crmApi";

// ─── Feature rows shown on every plan card ────────────────────────────────────
const FEATURE_ROWS = [
  { key: "maxBusinesses",      label: "Businesses",         fmt: v => v === -1 ? "Unlimited" : v.toLocaleString(),     Icon: Building2   },
  { key: "maxImportsPerCycle", label: "Imports / cycle",    fmt: v => v === -1 ? "Unlimited" : v.toLocaleString(),     Icon: Upload      },
  { key: "maxTeamMembers",     label: "Team members",       fmt: v => v === -1 ? "Unlimited" : String(v),              Icon: Users       },
  { key: "maxTemplates",       label: "Templates",          fmt: v => v === -1 ? "Unlimited" : String(v),              Icon: FileText    },
  { key: "canExportCsv",       label: "CSV Export",         fmt: null,                                                  Icon: Download    },
  { key: "canUseEmailjs",      label: "Email Campaigns",    fmt: null,                                                  Icon: Mail        },
  { key: "canUseBulkActions",  label: "Bulk Actions",       fmt: null,                                                  Icon: BarChart3   },
  { key: "canUseReminders",    label: "Reminders",          fmt: null,                                                  Icon: HelpCircle  },
  { key: "canUseApiAccess",    label: "API Access",         fmt: null,                                                  Icon: Key         },
];

const TIER_META = {
  BASIC:      { color: "#64748b", accent: "#f1f5f9", badgeBg: "#f1f5f9", badgeColor: "#64748b", label: "Basic",      popular: false, badge: null              },
  FREELANCER: { color: "#6366f1", accent: "#eef2ff", badgeBg: "#6366f1", badgeColor: "#fff",    label: "Freelancer", popular: true,  badge: "Most Popular"    },
  AGENCY:     { color: "#f59e0b", accent: "#fffbeb", badgeBg: "#f59e0b", badgeColor: "#fff",    label: "Agency",     popular: false, badge: "Best Value"      },
};

const DARK_TIER_META = {
  BASIC:      { accent: "#1e293b" },
  FREELANCER: { accent: "#1e1b4b" },
  AGENCY:     { accent: "#1c1a0e" },
};

const STATUS_COLORS = {
  ACTIVE:     { bg: "#dcfce7", color: "#16a34a", label: "Active"     },
  TRIALING:   { bg: "#dbeafe", color: "#2563eb", label: "Trial"      },
  PAST_DUE:   { bg: "#fef3c7", color: "#d97706", label: "Past Due"   },
  CANCELLED:  { bg: "#fee2e2", color: "#dc2626", label: "Cancelled"  },
  INCOMPLETE: { bg: "#fef3c7", color: "#d97706", label: "Incomplete" },
};
const DARK_STATUS_COLORS = {
  ACTIVE:     { bg: "#14532d33", color: "#4ade80" },
  TRIALING:   { bg: "#1e3a5f33", color: "#60a5fa" },
  PAST_DUE:   { bg: "#78350f33", color: "#fbbf24" },
  CANCELLED:  { bg: "#7f1d1d33", color: "#f87171" },
  INCOMPLETE: { bg: "#78350f33", color: "#fbbf24" },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function fmtPrice(cents) {
  if (!cents) return "Free";
  return `$${(cents / 100).toFixed(0)}/mo`;
}

// ─── FAQ section ──────────────────────────────────────────────────────────────
const FAQ = [
  { q: "Can I upgrade or downgrade at any time?",          a: "Yes. Upgrades take effect immediately. Downgrades take effect at the end of the current billing period." },
  { q: "What payment methods are accepted?",               a: "We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) via Stripe, the world's leading payment platform." },
  { q: "Is there a free trial?",                           a: "The Basic plan is free forever with generous limits. Paid plans can be cancelled any time before renewal." },
  { q: "What happens to my data if I downgrade?",          a: "Your data is preserved. If you exceed limits after downgrading, existing records stay but new imports are blocked until you're within plan limits." },
  { q: "How does billing work?",                           a: "You're charged monthly on the date you subscribed. All payments are processed securely through Stripe." },
];

function FaqItem({ q, a, dark }) {
  const [open, setOpen] = useState(false);
  const th = dark ? "#e2e8f0" : "#0f172a";
  const ts = dark ? "#94a3b8" : "#64748b";
  const surface = dark ? "#1e293b" : "#fff";
  const border  = dark ? "#334155" : "#e2e8f0";
  return (
    <div style={{ borderBottom: `1px solid ${border}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", textAlign: "left", padding: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", gap: 16 }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: th }}>{q}</span>
        {open ? <ChevronUp size={15} color={ts} style={{ flexShrink: 0 }} /> : <ChevronDown size={15} color={ts} style={{ flexShrink: 0 }} />}
      </button>
      {open && <p style={{ fontSize: 13, color: ts, marginTop: 0, marginBottom: 16, lineHeight: 1.7 }}>{a}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PricingView({ dark, planTier }) {
  const [plans,           setPlans]           = useState([]);
  const [subscription,    setSubscription]    = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading,   setPortalLoading]   = useState(false);
  const [error,           setError]           = useState("");
  const [successMsg,      setSuccessMsg]      = useState("");

  // Detect Stripe redirect outcome in URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("success")) {
      setSuccessMsg("Payment successful! Your plan has been upgraded. It may take a moment to reflect.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (p.get("cancelled")) {
      setError("Checkout was cancelled. No charges were made.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [p, s] = await Promise.all([
          billingApi.getPlans(),
          billingApi.getSubscription().catch(() => null),
        ]);
        setPlans(p || []);
        setSubscription(s);
      } catch (e) {
        setError("Failed to load billing information.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleUpgrade(plan) {
    if (!plan.stripePriceId) return;
    setError("");
    setCheckoutLoading(plan.id);
    try {
      const { url } = await billingApi.createCheckout(plan.stripePriceId);
      window.location.href = url;
    } catch (e) {
      setCheckoutLoading(null);
      setError(e?.message || "Failed to start checkout. Please try again.");
    }
  }

  async function handleManage() {
    setError("");
    setPortalLoading(true);
    try {
      const { url } = await billingApi.createPortal();
      window.location.href = url;
    } catch (e) {
      setPortalLoading(false);
      setError(e?.message || "Failed to open billing portal. Please try again.");
    }
  }

  const th      = dark ? "#e2e8f0" : "#0f172a";
  const ts      = dark ? "#94a3b8" : "#64748b";
  const surface = dark ? "#1e293b" : "#fff";
  const border  = dark ? "#334155" : "#e2e8f0";
  const bg      = dark ? "#0f172a" : "#f8fafc";

  const currentTier = subscription?.plan?.tier ?? planTier ?? "BASIC";
  const subStatus   = subscription?.status ?? "ACTIVE";
  const statusStyle = dark
    ? (DARK_STATUS_COLORS[subStatus] ?? DARK_STATUS_COLORS.ACTIVE)
    : (STATUS_COLORS[subStatus]      ?? STATUS_COLORS.ACTIVE);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 10, color: ts, fontSize: 14 }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        Loading pricing…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: th, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
          <CreditCard size={20} color="#6366f1" />Plans & Billing
        </h2>
        <p style={{ color: ts, margin: 0, fontSize: 14 }}>Manage your subscription and payment methods. Stripe processes all payments securely.</p>
      </div>

      {/* ── Success / error banners ───────────────────────────────────────── */}
      {successMsg && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: dark ? "#14532d33" : "#f0fdf4", border: `1px solid ${dark ? "#4ade8033" : "#bbf7d0"}`, borderRadius: 10, color: dark ? "#4ade80" : "#15803d", fontSize: 13, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Current subscription status card ─────────────────────────────── */}
      {subscription && (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 32, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: th }}>{subscription.plan?.name ?? currentTier} Plan</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: statusStyle.bg, color: statusStyle.color }}>
                {STATUS_COLORS[subStatus]?.label ?? subStatus}
              </span>
              {subscription.cancelAtPeriodEnd && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: dark ? "#7f1d1d33" : "#fee2e2", color: dark ? "#f87171" : "#dc2626" }}>
                  Cancels at period end
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: ts, display: "flex", gap: 20, flexWrap: "wrap" }}>
              {subscription.currentPeriodStart && <span>Period start: <strong style={{ color: th }}>{fmtDate(subscription.currentPeriodStart)}</strong></span>}
              {subscription.currentPeriodEnd   && <span>Renews: <strong style={{ color: th }}>{fmtDate(subscription.currentPeriodEnd)}</strong></span>}
            </div>
          </div>
          {subscription.stripeCustomerId && (
            <button
              onClick={handleManage}
              disabled={portalLoading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: dark ? "#1e293b" : "#f1f5f9", border: `1px solid ${border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: th, cursor: portalLoading ? "not-allowed" : "pointer", opacity: portalLoading ? 0.7 : 1 }}
            >
              {portalLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Settings2 size={13} />}
              Manage Subscription
            </button>
          )}
        </div>
      )}

      {/* ── Plan cards ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 20, marginBottom: 40 }}>
        {plans.map((plan) => {
          const meta        = TIER_META[plan.tier]     ?? TIER_META.BASIC;
          const darkAccent  = DARK_TIER_META[plan.tier] ?? DARK_TIER_META.BASIC;
          const isCurrent   = plan.tier === currentTier;
          const isUpgrade   = plan.monthlyPriceUsd > (plans.find(p => p.tier === currentTier)?.monthlyPriceUsd ?? 0);
          const isDowngrade = !isCurrent && !isUpgrade;
          const accentBg    = dark ? darkAccent.accent : meta.accent;

          return (
            <div
              key={plan.id}
              style={{
                background: isCurrent ? (dark ? "#1e1b4b" : "#eef2ff") : surface,
                border: `${isCurrent ? 2 : 1}px solid ${isCurrent ? meta.color : (meta.popular ? meta.color + "60" : border)}`,
                borderRadius: 18,
                overflow: "hidden",
                position: "relative",
                transition: "box-shadow 0.2s",
                boxShadow: meta.popular ? `0 4px 24px ${meta.color}22` : "none",
              }}
            >
              {/* Popular / badge ribbon */}
              {meta.badge && (
                <div style={{ background: meta.badgeBg, color: meta.badgeColor, fontSize: 11, fontWeight: 800, textAlign: "center", padding: "5px 0", letterSpacing: "0.5px" }}>
                  {meta.badge}
                </div>
              )}

              {/* Card header */}
              <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {plan.tier === "BASIC"      && <Star   size={17} color={meta.color} fill={meta.color + "33"} />}
                    {plan.tier === "FREELANCER" && <Zap    size={17} color={meta.color} fill={meta.color + "33"} />}
                    {plan.tier === "AGENCY"     && <Crown  size={17} color={meta.color} fill={meta.color + "33"} />}
                  </div>
                  {isCurrent && (
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: meta.color, color: "#fff" }}>
                      Current
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, color: th, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: meta.color }}>
                    {plan.monthlyPriceUsd ? `$${(plan.monthlyPriceUsd / 100).toFixed(0)}` : "Free"}
                  </span>
                  {plan.monthlyPriceUsd > 0 && <span style={{ fontSize: 13, color: ts }}>/month</span>}
                </div>
                {plan.monthlyPriceUsd > 0 && (
                  <p style={{ fontSize: 11, color: ts, margin: "4px 0 0" }}>Billed monthly. Cancel anytime.</p>
                )}
              </div>

              {/* Feature list */}
              <div style={{ padding: "18px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {FEATURE_ROWS.map(({ key, label, fmt, Icon: FIcon }) => {
                    const val     = plan[key];
                    const isNum   = fmt !== null;
                    const enabled = isNum ? true : !!val;
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, background: enabled ? (meta.color + "22") : (dark ? "#1e293b" : "#f1f5f9"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {enabled
                            ? <Check size={11} color={meta.color} strokeWidth={2.5} />
                            : <X     size={11} color={dark ? "#475569" : "#cbd5e1"} strokeWidth={2.5} />}
                        </div>
                        <span style={{ fontSize: 12, color: enabled ? th : ts, flex: 1 }}>{label}</span>
                        {isNum && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{fmt(val)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CTA button */}
                {isCurrent ? (
                  <button disabled style={{ width: "100%", padding: "11px", background: accentBg, color: meta.color, border: `1px solid ${meta.color}40`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "not-allowed" }}>
                    ✓ Your Current Plan
                  </button>
                ) : plan.stripePriceId ? (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={!!checkoutLoading}
                    style={{
                      width: "100%", padding: "11px",
                      background: checkoutLoading === plan.id ? (dark ? "#374151" : "#e5e7eb") : meta.color,
                      color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13,
                      cursor: checkoutLoading ? "not-allowed" : "pointer",
                      opacity: checkoutLoading && checkoutLoading !== plan.id ? 0.6 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "background 0.2s",
                    }}
                  >
                    {checkoutLoading === plan.id
                      ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Redirecting…</>
                      : <>{isUpgrade ? "Upgrade" : "Switch"} to {plan.name} →</>}
                  </button>
                ) : (
                  /* Downgrade to free — open portal to cancel */
                  <button
                    onClick={handleManage}
                    disabled={portalLoading}
                    style={{ width: "100%", padding: "11px", background: dark ? "#1e293b" : "#f1f5f9", color: ts, border: `1px solid ${border}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: portalLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    {portalLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : null}
                    Downgrade to Free
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Secure payment notice ─────────────────────────────────────────── */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: dark ? "#1e1b4b" : "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CreditCard size={18} color="#6366f1" />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: th, marginBottom: 2 }}>Secure payments powered by Stripe</div>
          <div style={{ fontSize: 12, color: ts }}>Visa, Mastercard, American Express, and Discover accepted. Your card details are never stored on our servers.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["VISA", "MC", "AMEX"].map(card => (
            <div key={card} style={{ padding: "5px 10px", background: dark ? "#1e293b" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 6, fontSize: 11, fontWeight: 800, color: ts, letterSpacing: "0.5px" }}>
              {card}
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 24px" }}>
        <h3 style={{ fontWeight: 800, fontSize: 15, color: th, marginTop: 0, marginBottom: 16 }}>Frequently Asked Questions</h3>
        {FAQ.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} dark={dark} />
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
