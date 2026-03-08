import { useState, useEffect } from "react";
import { Mail, Key, Server, User, FileText, Save, CheckCircle, ExternalLink, AlertCircle, Download } from "lucide-react";
import { buildEmailBody } from "../utils/emailer";
import { DEFAULT_EMAIL_SUBJECT, DEFAULT_EMAIL_BODY } from "../constants";

const PLACEHOLDER_BIZ = {
  name: "Sample Business",
  phone: "+92 300 1234567",
  email: "mr.naveed807@gmail.com",
  address: "123 Main Street, Islamabad",
  category: "Beauty Salon",
  website: "https://example.com",
  rating: "4.5",
};

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

  const th = dark ? "#e2e8f0" : "#0f172a";
  const ts = dark ? "#94a3b8" : "#64748b";
  const surface = dark ? "#1e293b" : "#fff";
  const border  = dark ? "#334155" : "#e2e8f0";
  const inputBg = dark ? "#0f172a" : "#fafafa";

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1px solid ${border}`, fontSize: 13,
    color: dark ? "#e2e8f0" : "#334155",
    background: inputBg, outline: "none", boxSizing: "border-box",
  };

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })); }

  async function handleSave() {
    await onSaveEmailSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const previewSubject = buildEmailBody(form.subject, PLACEHOLDER_BIZ);
  const previewBody    = buildEmailBody(form.body,    PLACEHOLDER_BIZ);

  const isConfigured = form.serviceId && form.templateId && form.publicKey;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: th, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={20} color="#6366f1" />Email Settings
        </h2>
        <p style={{ color: ts, marginTop: 6, fontSize: 14 }}>
          Configure Gmail SMTP via EmailJS to send emails directly. Or leave blank to use your default mail client (mailto:).
        </p>
      </div>

      {/* EmailJS setup guide */}
      <div style={{ background: dark ? "#0f172a" : "#f8f7ff", borderRadius: 14, border: `1px solid ${dark ? "#334155" : "#c7d2fe"}`, padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Server size={14} color="#6366f1" />
          <span style={{ fontWeight: 700, fontSize: 13, color: th }}>How to set up Gmail SMTP with EmailJS</span>
        </div>
        <ol style={{ color: ts, fontSize: 13, lineHeight: 2.2, paddingLeft: 20, margin: 0 }}>
          <li>Go to <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" style={{ color: "#6366f1" }}>emailjs.com</a> → Sign up free</li>
          <li><strong style={{ color: th }}>Email Services</strong> → Add New Service → Choose <strong style={{ color: th }}>Gmail</strong> → connect your Gmail account</li>
          <li><strong style={{ color: th }}>Email Templates</strong> → Create New Template. Set:
            <br />To: <code style={{ background: dark ? "#1e293b" : "#e0e7ff", padding: "1px 6px", borderRadius: 4 }}>{"{{to_email}}"}</code>{" "}
            Subject: <code style={{ background: dark ? "#1e293b" : "#e0e7ff", padding: "1px 6px", borderRadius: 4 }}>{"{{subject}}"}</code>{" "}
            Body: <code style={{ background: dark ? "#1e293b" : "#e0e7ff", padding: "1px 6px", borderRadius: 4 }}>{"{{message}}"}</code>
          </li>
          <li>Copy <strong style={{ color: th }}>Service ID</strong>, <strong style={{ color: th }}>Template ID</strong>, and <strong style={{ color: th }}>Public Key</strong> from the EmailJS dashboard below</li>
        </ol>
        <a href="https://www.emailjs.com/docs/" target="_blank" rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 12, color: "#6366f1", fontWeight: 600 }}>
          EmailJS Docs <ExternalLink size={11} />
        </a>
      </div>

      {/* Credentials card */}
      <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <Key size={14} color="#6366f1" />
          <span style={{ fontWeight: 700, fontSize: 13, color: th, textTransform: "uppercase", letterSpacing: "0.5px" }}>EmailJS Credentials</span>
          {isConfigured && (
            <span style={{ marginLeft: "auto", background: "#d1fae5", color: "#059669", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle size={11} />Configured
            </span>
          )}
          {!isConfigured && (
            <span style={{ marginLeft: "auto", background: dark ? "#1e293b" : "#f1f5f9", color: ts, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertCircle size={11} />Not set — mailto: fallback active
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>Public Key</label>
            <input value={form.publicKey} onChange={(e) => set("publicKey", e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxx" style={inputStyle} type="password" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>From Name (shown to recipient)</label>
            <input value={form.fromName} onChange={(e) => set("fromName", e.target.value)}
              placeholder="Your Name / Company" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Email template */}
      <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <FileText size={14} color="#6366f1" />
          <span style={{ fontWeight: 700, fontSize: 13, color: th, textTransform: "uppercase", letterSpacing: "0.5px" }}>Email Template</span>
        </div>
        <p style={{ color: ts, fontSize: 12, marginBottom: 14, marginTop: 0 }}>
          Use <code style={{ background: dark ? "#1e293b" : "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>{"{name}"}</code>,{" "}
          <code style={{ background: dark ? "#1e293b" : "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>{"{phone}"}</code>,{" "}
          <code style={{ background: dark ? "#1e293b" : "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>{"{email}"}</code>,{" "}
          <code style={{ background: dark ? "#1e293b" : "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>{"{address}"}</code>,{" "}
          <code style={{ background: dark ? "#1e293b" : "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>{"{category}"}</code> as placeholders.
        </p>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>Subject Line</label>
          <input value={form.subject} onChange={(e) => set("subject", e.target.value)}
            style={inputStyle} placeholder="Subject…" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 5 }}>Email Body</label>
          <textarea value={form.body} onChange={(e) => set("body", e.target.value)}
            rows={8}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
            placeholder="Email body…" />
        </div>
      </div>

      {/* Preview */}
      <div style={{ background: dark ? "#0f172a" : "#f8fafc", borderRadius: 14, border: `1px solid ${border}`, padding: 18, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: ts, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Preview (sample business)</div>
        <div style={{ fontSize: 13, color: ts, marginBottom: 6 }}>
          <strong style={{ color: th }}>To:</strong> {PLACEHOLDER_BIZ.email}
        </div>
        <div style={{ fontSize: 13, color: ts, marginBottom: 10 }}>
          <strong style={{ color: th }}>Subject:</strong> {previewSubject}
        </div>
        <div style={{ fontSize: 13, color: th, whiteSpace: "pre-wrap", lineHeight: 1.7, background: surface, padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}` }}>
          {previewBody}
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave}
        style={{ background: saved ? "#10b981" : "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "background 0.3s" }}>
        {saved ? <CheckCircle size={16} /> : <Save size={16} />}
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
