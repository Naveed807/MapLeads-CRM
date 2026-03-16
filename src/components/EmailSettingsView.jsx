import { useState, useEffect } from "react";
import { Mail, Key, Server, FileText, Save, CheckCircle, ExternalLink, AlertCircle, ShieldAlert, Headphones } from "lucide-react";
import { buildEmailBody } from "../utils/emailer";
import { DEFAULT_EMAIL_SUBJECT, DEFAULT_EMAIL_BODY } from "../constants";

const PLACEHOLDER_BIZ = {
  name: "Sample Business",
  phone: "+92 303 3756294",
  email: "mr.naveed807@gmail.com",
  address: "123 Main Street, Islamabad",
  category: "Beauty Salon",
  website: "https://example.com",
  rating: "4.5",
};

const WA_TIPS = [
  {
    num: "01",
    title: "Respect daily limits",
    body: "Send messages to a maximum of 30-50 new contacts per day. Exceeding this threshold is the fastest way to trigger WhatsApp's spam detection.",
  },
  {
    num: "02",
    title: "Ask recipients to save your number first",
    body: "Request contacts to save your number before you message them. When people block unknown numbers, your account trust score drops.",
  },
  {
    num: "03",
    title: "Personalise every message",
    body: "Always include the recipient's name or business. Identical copy-paste messages are flagged as bulk spam by WhatsApp's AI filters.",
  },
  {
    num: "04",
    title: "Use WhatsApp Business",
    body: "Keep outreach on a dedicated WhatsApp Business number so your personal number is never at risk. Business accounts also allow catalog and label features.",
  },
  {
    num: "05",
    title: "Add delays between messages",
    body: "Wait at least 60-120 seconds between sends. Rapid successive messages mimic bot behaviour and are automatically rate-limited.",
  },
  {
    num: "06",
    title: "Track status in the CRM",
    body: "Mark unresponsive or opted-out contacts as Not Interested immediately so they are never messaged again. Repeated unwanted messages are a leading cause of bans.",
  },
];

export default function EmailSettingsView({ emailSettings, onSaveEmailSettings, dark }) {
  const [form, setForm] = useState({
    serviceId:  "",
    templateId: "",
    publicKey:  "",
    fromName:   "",
    subject:    DEFAULT_EMAIL_SUBJECT,
    body:       DEFAULT_EMAIL_BODY,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (emailSettings) setForm((prev) => ({ ...prev, ...emailSettings }));
  }, [emailSettings]);

  const th      = dark ? "#e2e8f0" : "#0f172a";
  const ts      = dark ? "#94a3b8" : "#64748b";
  const surface = dark ? "#1e293b" : "#fff";
  const border  = dark ? "#334155" : "#e2e8f0";
  const inputBg = dark ? "#0f172a" : "#fafafa";

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1px solid ${border}`, fontSize: 13,
    color: dark ? "#e2e8f0" : "#334155",
    background: inputBg, outline: "none", boxSizing: "border-box",
  };

  const cardStyle = {
    background: surface, borderRadius: 16,
    border: `1px solid ${border}`, padding: 22,
  };

  const sectionLabel = {
    fontSize: 11, fontWeight: 700, color: ts,
    textTransform: "uppercase", letterSpacing: "0.6px",
    display: "flex", alignItems: "center", gap: 7, marginBottom: 16,
  };

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })); }

  async function handleSave() {
    await onSaveEmailSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const previewSubject = buildEmailBody(form.subject, PLACEHOLDER_BIZ);
  const previewBody    = buildEmailBody(form.body,    PLACEHOLDER_BIZ);
  const isConfigured   = form.serviceId && form.templateId && form.publicKey;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: th, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={20} color="#6366f1" />Email Settings
          </h2>
          <p style={{ color: ts, marginTop: 6, fontSize: 14, margin: "6px 0 0" }}>
            Configure Gmail SMTP via EmailJS to send emails directly, or leave blank to use your default mail client.
          </p>
        </div>
        {isConfigured
          ? <span style={{ background: "#d1fae5", color: "#059669", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}><CheckCircle size={13} />EmailJS Configured</span>
          : <span style={{ background: dark ? "#1e293b" : "#f1f5f9", color: ts, fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}><AlertCircle size={13} />Using mailto: fallback</span>
        }
      </div>

      {/* Row 1: Credentials + Setup Guide */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        <div style={cardStyle}>
          <div style={sectionLabel}><Key size={13} color="#6366f1" />EmailJS Credentials</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>Service ID</label>
                <input value={form.serviceId} onChange={(e) => set("serviceId", e.target.value)}
                  placeholder="service_xxxxxxx" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>Template ID</label>
                <input value={form.templateId} onChange={(e) => set("templateId", e.target.value)}
                  placeholder="template_xxxxxxx" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>Public Key</label>
                <input value={form.publicKey} onChange={(e) => set("publicKey", e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxx" style={inputStyle} type="password" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>From Name</label>
                <input value={form.fromName} onChange={(e) => set("fromName", e.target.value)}
                  placeholder="Your Name / Company" style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, background: dark ? "#0f172a" : "#f8f7ff", border: `1px solid ${dark ? "#334155" : "#c7d2fe"}` }}>
          <div style={{ ...sectionLabel, color: dark ? "#a5b4fc" : "#4f46e5" }}><Server size={13} color="#6366f1" />How to connect EmailJS</div>
          <ol style={{ color: ts, fontSize: 12.5, lineHeight: 2, paddingLeft: 18, margin: "0 0 12px" }}>
            <li>Go to <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" style={{ color: "#6366f1", fontWeight: 600 }}>emailjs.com</a> and sign up for free.</li>
            <li><strong style={{ color: th }}>Email Services</strong> {"->"} Add New Service {"->"} choose <strong style={{ color: th }}>Gmail</strong>.</li>
            <li><strong style={{ color: th }}>Email Templates</strong> {"->"} Create template with fields:
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["{{to_email}}", "{{subject}}", "{{message}}"].map((v) => (
                  <code key={v} style={{ background: dark ? "#1e293b" : "#e0e7ff", color: "#4f46e5", padding: "1px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{v}</code>
                ))}
              </div>
            </li>
            <li>Paste <strong style={{ color: th }}>Service ID</strong>, <strong style={{ color: th }}>Template ID</strong> and <strong style={{ color: th }}>Public Key</strong> on the left.</li>
          </ol>
          <a href="https://www.emailjs.com/docs/" target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6366f1", fontWeight: 600 }}>
            EmailJS Docs <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Row 2: Template editor + Live preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        <div style={cardStyle}>
          <div style={sectionLabel}><FileText size={13} color="#6366f1" />Email Template</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 13 }}>
            {["{name}", "{phone}", "{email}", "{address}", "{category}"].map((ph) => (
              <code key={ph} style={{ background: dark ? "#1e293b" : "#f1f5f9", color: dark ? "#a5b4fc" : "#4f46e5", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{ph}</code>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>Subject Line</label>
            <input value={form.subject} onChange={(e) => set("subject", e.target.value)}
              style={inputStyle} placeholder="Subject..." />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>Email Body</label>
            <textarea value={form.body} onChange={(e) => set("body", e.target.value)}
              rows={9}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
              placeholder="Email body..." />
          </div>
        </div>

        <div style={{ ...cardStyle, background: dark ? "#0f172a" : "#f8fafc", display: "flex", flexDirection: "column" }}>
          <div style={sectionLabel}>Preview - Sample Business</div>
          <div style={{ fontSize: 12, color: ts, marginBottom: 5 }}>
            <strong style={{ color: th }}>To: </strong>{PLACEHOLDER_BIZ.email}
          </div>
          <div style={{ fontSize: 12, color: ts, marginBottom: 12 }}>
            <strong style={{ color: th }}>Subject: </strong>{previewSubject}
          </div>
          <div style={{ flex: 1, fontSize: 13, color: th, whiteSpace: "pre-wrap", lineHeight: 1.7, background: surface, padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, overflowY: "auto" }}>
            {previewBody}
          </div>
        </div>
      </div>

      {/* WhatsApp Safety Warning - full width 3-col grid */}
      <div style={{ background: dark ? "#1c1207" : "#fffbeb", borderRadius: 16, border: `1px solid ${dark ? "#78350f" : "#fcd34d"}`, padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <ShieldAlert size={17} color="#d97706" />
          <span style={{ fontWeight: 800, fontSize: 14, color: dark ? "#fcd34d" : "#92400e" }}>WhatsApp Account Safety</span>
          <span style={{ marginLeft: "auto", background: dark ? "#78350f" : "#fde68a", color: dark ? "#fcd34d" : "#92400e", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>Important</span>
        </div>
        <p style={{ color: dark ? "#fbbf24" : "#78350f", fontSize: 13, margin: "0 0 16px", lineHeight: 1.6 }}>
          Sending bulk WhatsApp messages to many contacts in a single session can result in your number being <strong>temporarily restricted or permanently banned</strong>. Follow these best practices to protect your account.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {WA_TIPS.map(({ num, title, body }) => (
            <div key={num} style={{ background: dark ? "#292007" : "#fef9c3", border: `1px solid ${dark ? "#78350f" : "#fde047"}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: dark ? "#d97706" : "#b45309", marginBottom: 4, letterSpacing: "0.5px" }}>RULE {num}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: dark ? "#fbbf24" : "#78350f", marginBottom: 5 }}>{title}</div>
              <div style={{ fontSize: 12, color: dark ? "#fde68a" : "#713f12", lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button + Support contact inline */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <button onClick={handleSave}
          style={{ background: saved ? "#10b981" : "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "background 0.3s", flexShrink: 0 }}>
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? "Saved!" : "Save Settings"}
        </button>

        <div style={{ flex: 1, background: surface, borderRadius: 12, border: `1px solid ${border}`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Headphones size={15} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: th }}>Help and Support</div>
            <div style={{ fontSize: 11.5, color: ts }}>For any questions or feedback, reach out to us:</div>
          </div>
          <a href="mailto:mr.naveed807@gmail.com"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#6366f1", textDecoration: "none", background: dark ? "#1e293b" : "#eef2ff", padding: "7px 14px", borderRadius: 8, border: `1px solid ${dark ? "#334155" : "#c7d2fe"}`, whiteSpace: "nowrap" }}>
            <Mail size={13} />mr.naveed807@gmail.com
          </a>
        </div>
      </div>

    </div>
  );
}
