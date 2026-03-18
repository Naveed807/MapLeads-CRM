import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute";
import LoginPage          from "./pages/LoginPage";
import RegisterPage       from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage  from "./pages/ResetPasswordPage";
import AdminLoginPage     from "./pages/AdminLoginPage";
import { useAppData } from "./hooks/useAppData";
import { COUNTRY_CODES } from "./constants";
import Dashboard         from "./components/Dashboard";
import BusinessesView    from "./components/BusinessesView";
import ImportView        from "./components/ImportView";
import TemplateView      from "./components/TemplateView";
import DataView          from "./components/DataView";
import EmailSettingsView from "./components/EmailSettingsView";
import {
  LayoutDashboard, Building2, Upload, MessageSquare, Database,
  Trash2, Moon, Sun, Globe, Mail, LogOut, ShieldCheck,
  Menu, X, Zap, ChevronRight,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import "./styles/auth.css";

// ─── Navigation config ────────────────────────────────────────────────────────
const MAIN_NAV = [
  { id: "dashboard",  label: "Dashboard",  Icon: LayoutDashboard },
  { id: "businesses", label: "Businesses", Icon: Building2 },
  { id: "import",     label: "Import",     Icon: Upload },
  { id: "data",       label: "DB Records", Icon: Database },
];

const SETTINGS_NAV = [
  { id: "template", label: "Templates",      Icon: MessageSquare },
  { id: "email",    label: "Email Settings", Icon: Mail },
];

const PAGE_TITLES = {
  dashboard:  "Dashboard",
  businesses: "Businesses",
  import:     "Import",
  data:       "DB Records",
  template:   "Templates",
  email:      "Email Settings",
};

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function SidebarNavItem({ id, label, Icon, badge, active, onSelect }) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        active
          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200",
      ].join(" ")}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1 text-left truncate">{label}</span>
      {badge != null && (
        <span className={[
          "text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums",
          active
            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
            : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
        ].join(" ")}>
          {badge}
        </span>
      )}
      {active && <ChevronRight size={12} className="flex-shrink-0 opacity-40" />}
    </button>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"           element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"        element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password"  element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          <Route path="/admin/login"     element={<GuestRoute><AdminLoginPage /></GuestRoute>} />

          {/* Protected user routes */}
          <Route path="/dashboard"       element={<ProtectedRoute><CRMApp /></ProtectedRoute>} />
          <Route path="/dashboard/:tab"  element={<ProtectedRoute><CRMApp /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><CRMApp isAdmin /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// ─── CRM shell ────────────────────────────────────────────────────────────────
function CRMApp() {
  const { user, logout, isAdmin } = useAuth();
  const [tab, setTab]               = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  function navigate(nextTab) {
    setTab(nextTab);
    setSidebarOpen(false);
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div className={`flex items-center justify-center h-screen gap-3 font-sans ${dark ? "dark bg-slate-950" : "bg-slate-50"}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
          <Building2 size={18} className="text-white" />
        </div>
        <span className="text-slate-400 text-sm font-medium">Loading…</span>
      </div>
    );
  }

  const bizCount      = businesses.length;
  const avatarLetter  = (user?.name || user?.email || "U")[0].toUpperCase();

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60">

      {/* Logo + mobile close */}
      <div className="flex items-center justify-between gap-3 px-5 py-[18px] border-b border-slate-200 dark:border-slate-700/60 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/25">
            <Building2 size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight tracking-tight">MapLeads CRM</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">WhatsApp Outreach</div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-3 pb-2 select-none">
          Main
        </p>
        <div className="space-y-0.5">
          {MAIN_NAV.map(({ id, label, Icon }) => (
            <SidebarNavItem
              key={id}
              id={id}
              label={label}
              Icon={Icon}
              badge={id === "businesses" && bizCount ? bizCount : null}
              active={tab === id}
              onSelect={navigate}
            />
          ))}
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-3 pb-2 select-none">
            Settings
          </p>
          <div className="space-y-0.5">
            {SETTINGS_NAV.map(({ id, label, Icon }) => (
              <SidebarNavItem
                key={id}
                id={id}
                label={label}
                Icon={Icon}
                active={tab === id}
                onSelect={navigate}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700/60 px-4 py-4 space-y-3">

        {/* Plan badge */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/[0.08] dark:to-violet-500/[0.05] rounded-xl px-3 py-2.5 border border-indigo-100/80 dark:border-indigo-500/20">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-indigo-500 fill-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Basic Plan</span>
          </div>
          <button className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            Upgrade →
          </button>
        </div>

        {/* Country code + dark mode */}
        <div className="flex items-center gap-2">
          <Globe size={13} className="text-slate-400 flex-shrink-0" />
          <select
            value={countryCode}
            onChange={(e) => handleCountryCodeChange(e.target.value)}
            className="flex-1 min-w-0 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <button
            onClick={toggleDarkMode}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5 pt-0.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-extrabold shadow-sm">
            {avatarLetter}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
              {user?.name || "User"}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</div>
          </div>
          {isAdmin && (
            <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded-full">
              <ShieldCheck size={9} />Admin
            </span>
          )}
          <button
            onClick={logout}
            title="Sign out"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800/40 dark:hover:text-red-400 transition-all"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className={`flex h-screen overflow-hidden font-sans${dark ? " dark" : ""}`}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={[
        "fixed inset-y-0 left-0 z-30 w-60 transition-transform duration-200 ease-in-out",
        "lg:relative lg:translate-x-0 lg:flex-shrink-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">

        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-3 px-5">

          {/* Hamburger – mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu size={18} />
          </button>

          {/* Page title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {PAGE_TITLES[tab]}
            </h1>
            {tab === "businesses" && bizCount > 0 && (
              <span className="flex-shrink-0 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {bizCount}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {tab === "businesses" && bizCount > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 rounded-lg px-3 py-1.5 transition-all"
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6">

            {tab === "dashboard" && (
              <Dashboard
                stats={stats}
                businesses={businesses}
                contacts={contacts}
                onNavigate={navigate}
                dark={dark}
              />
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

            {tab === "email" && (
              <EmailSettingsView
                emailSettings={{ ...emailSettings, subject: emailSubject, body: emailBody }}
                onSaveEmailSettings={handleSaveEmailSettings}
                dark={dark}
              />
            )}

            {tab === "data" && <DataView dark={dark} />}

          </div>
        </main>
      </div>
    </div>
  );
}