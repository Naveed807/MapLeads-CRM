import { useState, useEffect } from "react";
import { FileText, Save, Trash2, Check, Plus, MessageSquare, ChevronRight } from "lucide-react";

const VARS_HELP = [
  { v: "{{name}}",     d: "Business name" },
  { v: "{{category}}", d: "Category / type" },
  { v: "{{phone}}",    d: "Phone number" },
  { v: "{{address}}",  d: "Address" },
  { v: "{{rating}}",   d: "Google rating" },
];

export default function TemplateView({ template, onTemplateSave, templates, onSaveNamed, onDeleteTemplate, onUseTemplate, dark }) {
  const [body,      setBody]      = useState(template || "Hello {{name}},\n\nWe'd love to offer you our services.\n\nBest regards");
  const [saveName,  setSaveName]  = useState("");
  const [savedOk,   setSavedOk]   = useState(false);
  const [namedOk,   setNamedOk]   = useState(false);

  // Keep editor in sync when the active template changes externally
  // (e.g. after switching via library or on first load)
  useEffect(() => {
    if (template) setBody(template);
  }, [template]);

  const th = dark ? "#e2e8f0" : "#0f172a";
  const ts = dark ? "#94a3b8" : "#64748b";
  const surface = dark ? "#1e293b" : "#fff";
  const border  = dark ? "#334155" : "#e2e8f0";
  const inputBg = dark ? "#0f172a" : "#fafafa";
  const purpleBg = dark ? "#1e1b4b" : "#eef2ff";

  function insertVar(v) { setBody((b) => b + v); }

  function handleSave() {
    onTemplateSave(body);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2000);
  }

  function handleSaveNamed() {
    if (!saveName.trim()) return;
    onSaveNamed(saveName.trim(), body);
    setSaveName("");
    setNamedOk(true);
    setTimeout(() => setNamedOk(false), 2000);
  }

  // Load a library template into the editor AND persist it as the active template
  async function handleUse(tmplBody) {
    setBody(tmplBody);
    await onTemplateSave(tmplBody);  // persists to DB as active
    onUseTemplate(tmplBody);         // updates useAppData state
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: th, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <MessageSquare size={20} color="#6366f1" />Message Templates
      </h2>
      <p style={{ color: ts, marginTop: 0, marginBottom: 24, fontSize: 14 }}>Write your message template using variable placeholders. The active template is sent via WhatsApp after substituting real values.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        {/* Left – editor */}
        <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={15} color="#6366f1" />
            <span style={{ fontWeight: 700, fontSize: 13, color: th }}>Active Template Editor</span>
          </div>

          {/* Variable chips */}
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {VARS_HELP.map((v) => (
              <button key={v.v} onClick={() => insertVar(v.v)} title={v.d}
                style={{ background: purpleBg, color: "#6366f1", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {v.v}
              </button>
            ))}
          </div>

          <textarea value={body} onChange={(e) => setBody(e.target.value)}
            style={{ width: "100%", minHeight: 220, padding: 20, fontFamily: "monospace", fontSize: 13, color: dark ? "#e2e8f0" : "#334155", background: inputBg, border: "none", outline: "none", resize: "vertical", lineHeight: 1.8, boxSizing: "border-box" }} />

          {/* Live preview */}
          {body && (
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, background: dark ? "#0f172a" : "#f8fafc" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: ts, marginBottom: 6 }}>Preview</div>
              <div style={{ fontSize: 13, color: th, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {body.replace(/{{name}}/g,"Sample Shop").replace(/{{category}}/g,"Retail").replace(/{{phone}}/g,"+92 300 1234567").replace(/{{address}}/g,"Main St, Karachi").replace(/{{rating}}/g,"4.5")}
              </div>
            </div>
          )}

          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button onClick={handleSave}
              style={{ background: savedOk ? "#16a34a" : "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "background 0.3s" }}>
              {savedOk ? <Check size={15} /> : <Save size={15} />}{savedOk ? "Saved!" : "Set as Active"}
            </button>

            <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 200 }}>
              <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
                placeholder="Template name…"
                onKeyDown={(e) => e.key === "Enter" && handleSaveNamed()}
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${border}`, fontSize: 13, color: dark ? "#e2e8f0" : "#334155", background: inputBg, outline: "none" }} />
              <button onClick={handleSaveNamed} disabled={!saveName.trim()}
                style={{ background: namedOk ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: saveName.trim() ? "pointer" : "not-allowed", opacity: saveName.trim() ? 1 : 0.4, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                {namedOk ? <Check size={14} /> : <Plus size={14} />}{namedOk ? "Saved!" : "Save to Library"}
              </button>
            </div>
          </div>
        </div>

        {/* Right – library */}
        <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={15} color="#6366f1" />
            <span style={{ fontWeight: 700, fontSize: 13, color: th }}>Template Library</span>
            <span style={{ marginLeft: "auto", background: purpleBg, color: "#6366f1", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>{(templates || []).length}</span>
          </div>

          {(!templates || templates.length === 0) && (
            <div style={{ padding: 28, textAlign: "center", color: ts, fontSize: 13 }}>
              No saved templates yet.<br />Write a message and click <strong style={{ color: th }}>Save to Library</strong>.
            </div>
          )}

          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {(templates || []).map((t) => {
              const isActive = t.body === template;
              return (
                <div key={t.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${dark ? "#0f172a" : "#f8fafc"}`, background: isActive ? (dark ? "#1e1b4b" : "#eef2ff") : "transparent" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: th }}>{t.name || "(unnamed)"}</span>
                      {isActive && <span style={{ background: "#6366f1", color: "#fff", borderRadius: 4, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>ACTIVE</span>}
                    </div>
                    <button onClick={() => onDeleteTemplate(t.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#ef4444", display: "flex", alignItems: "center" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: ts, margin: "0 0 10px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.body}</p>
                  {!isActive && (
                    <button onClick={() => handleUse(t.body)}
                      style={{ background: purpleBg, color: "#6366f1", border: "none", borderRadius: 6, padding: "5px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      <ChevronRight size={12} />Use this template
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Variable reference */}
      <div style={{ marginTop: 20, background: surface, borderRadius: 12, border: `1px solid ${border}`, padding: "14px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px", color: ts, marginBottom: 10 }}>Available Variables</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {VARS_HELP.map((v) => (
            <div key={v.v} style={{ fontSize: 12, color: ts }}>
              <code style={{ background: purpleBg, color: "#6366f1", padding: "2px 6px", borderRadius: 4 }}>{v.v}</code> — {v.d}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
