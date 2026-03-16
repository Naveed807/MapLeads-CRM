import { useState } from "react";
import { useAppData } from "./hooks/useAppData";
import { COUNTRY_CODES, DARK, LIGHT } from "./constants";
import Dashboard      from "./components/Dashboard";
import BusinessesView from "./components/BusinessesView";
import ImportView     from "./components/ImportView";
import TemplateView   from "./components/TemplateView";
import DataView       from "./components/DataView";
import { LayoutDashboard, Building2, Upload, MessageSquare, Database, Trash2, Moon, Sun, Globe, Mail } from "lucide-react";
import EmailSettingsView from "./components/EmailSettingsView";

const TABS = [
  { id: "dashboard",  label: "Dashboard",  Icon: LayoutDashboard },
  { id: "businesses", label: "Businesses", Icon: Building2 },
  { id: "import",     label: "Import",     Icon: Upload },
  { id: "template",   label: "Template",   Icon: MessageSquare },
  { id: "email",      label: "Email",      Icon: Mail },
  { id: "data",       label: "DB Records", Icon: Database },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");

  const {
    loaded,
    businesses,
    contacts,
    template,
    templates,
    tags,
    importHistory,
    reminders,
    darkMode,
    countryCode,
    selectedBizIds,
    stats,
    handleImport,
    handleDeleteImport,
    handleStatusChange,
    handleNoteChange,
    handleTemplateSave,
    handleSaveNamedTemplate,
    handleDeleteTemplate,
    handleUseTemplate,
    handleSetTags,
    handleSetReminder,
    handleDeleteReminder,
    handleBulkStatusChange,
    handleBulkDelete,
    toggleSelectBiz,
    selectAllBiz,
    clearSelection,
    toggleDarkMode,
    handleCountryCodeChange,
    handleClearAll,
    emailSettings,
    emailSubject,
    emailBody,
    handleSaveEmailSettings,
    handleSendEmail,
  } = useAppData();

  const dark = darkMode;
  const C = dark ? DARK : LIGHT;

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui", color: "#94a3b8", gap: 10, background: C.bg }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={18} color="#fff" />
        </div>
        Loading…
      </div>
    );
  }

  const businessLabel = businesses.length ? `Businesses (${businesses.length})` : "Businesses";

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", minHeight: "100vh", background: C.bg, color: C.text }}>

      {/* ── Header / Nav ── */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100, gap: 8 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24, padding: "14px 0", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text, lineHeight: 1 }}>MapLeads CRM</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>WhatsApp Outreach</div>
          </div>
        </div>

        {/* Tabs */}
        <nav style={{ display: "flex", gap: 0 }}>
          {TABS.map(({ id, label, Icon }) => {
            const display = id === "businesses" ? businessLabel : label;
            const active  = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                style={{ background: "none", border: "none", padding: "17px 14px", fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#6366f1" : C.muted, cursor: "pointer", borderBottom: `2px solid ${active ? "#6366f1" : "transparent"}`, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
                <Icon size={14} />{display}
              </button>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>

          {/* Country code */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Globe size={13} color={C.muted} />
            <select value={countryCode} onChange={(e) => handleCountryCodeChange(e.target.value)}
              style={{ padding: "5px 8px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12, color: C.text, background: C.surface, outline: "none", cursor: "pointer" }}>
              {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>

          {/* Dark mode */}
          <button onClick={toggleDarkMode} title={dark ? "Light Mode" : "Dark Mode"}
            style={{ background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 9px", cursor: "pointer", display: "flex", alignItems: "center", color: dark ? "#fbbf24" : "#64748b" }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Clear All */}
          {businesses.length > 0 && (
            <button onClick={handleClearAll}
              style={{ background: "none", border: "1px solid #fecaca", color: "#ef4444", borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Trash2 size={13} />Clear All
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ padding: "28px 24px", maxWidth: 960, margin: "0 auto" }}>

        {tab === "dashboard" && (
          <Dashboard stats={stats} businesses={businesses} contacts={contacts} onNavigate={setTab} dark={dark} />
        )}

        {tab === "import" && (
          <ImportView
            onImport={handleImport}
            onDeleteImport={handleDeleteImport}
            importHistory={importHistory}
            countryCode={countryCode}
            onCountryCodeChange={handleCountryCodeChange}
            dark={dark}
          />
        )}

        {tab === "businesses" && (
          <BusinessesView
            businesses={businesses}
            contacts={contacts}
            template={template}
            countryCode={countryCode}
            tags={tags}
            reminders={reminders}
            selectedBizIds={selectedBizIds}
            onStatusChange={handleStatusChange}
            onNoteChange={handleNoteChange}
            onToggleSelect={toggleSelectBiz}
            onSelectAll={selectAllBiz}
            onClearSelection={clearSelection}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkDelete={handleBulkDelete}
            onTagsChange={handleSetTags}
            onSetReminder={handleSetReminder}
            onDeleteReminder={handleDeleteReminder}
            onSendEmail={handleSendEmail}
            dark={dark}
          />
        )}

        {tab === "email" && (
          <EmailSettingsView
            emailSettings={{ ...emailSettings, subject: emailSubject, body: emailBody }}
            onSaveEmailSettings={handleSaveEmailSettings}
            dark={dark}
          />
        )}

        {tab === "template" && (
          <TemplateView
            template={template}
            onTemplateSave={handleTemplateSave}
            templates={templates}
            onSaveNamed={handleSaveNamedTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onUseTemplate={handleUseTemplate}
            dark={dark}
          />
        )}

        {tab === "data" && (
          <DataView dark={dark} />
        )}
      </main>
    </div>
  );
}