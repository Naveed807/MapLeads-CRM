import { useState, useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute";
import LoginPage          from "./pages/LoginPage";
import RegisterPage       from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage  from "./pages/ResetPasswordPage";
import AdminLoginPage     from "./pages/AdminLoginPage";
import { useAppData } from "./hooks/useAppData";

import Dashboard         from "./components/Dashboard";
import BusinessesView    from "./components/BusinessesView";
import ImportView        from "./components/ImportView";
import TemplateView      from "./components/TemplateView";
import EmailSettingsView from "./components/EmailSettingsView";
import UsersView         from "./components/UsersView";
import {
  LayoutDashboard, Building2, Upload, MessageSquare,
  Trash2, Moon, Sun, Mail, LogOut, ShieldCheck,
  Menu, X, Zap, ChevronRight, Bell, HelpCircle,
  User, Settings, BookOpen, Video, MessageCircle as ChatIcon,
  ExternalLink, ChevronDown, Download, TrendingUp, AlertTriangle,
  Users,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { notificationApi } from "./services/crmApi";
import "./styles/auth.css";

// ─── Navigation config ────────────────────────────────────────────────────────
const MAIN_NAV = [
  { id: "dashboard",  label: "Dashboard",  Icon: LayoutDashboard },
  { id: "businesses", label: "Businesses", Icon: Building2 },
  { id: "import",     label: "Import",     Icon: Upload },
  { id: "users",      label: "Add Users",  Icon: Users, requiresPaid: true },
];

const SETTINGS_NAV = [
  { id: "template", label: "Templates",      Icon: MessageSquare },
  { id: "email",    label: "Email Settings", Icon: Mail },
];

const PAGE_TITLES = {
  dashboard:  "Dashboard",
  businesses: "Businesses",
  import:     "Import",
  template:   "Templates",
  email:      "Email Settings",
  users:      "Team & Organization",
};

// Map notification type → icon + colour
function notifStyle(type) {
  switch (type) {
    case "IMPORT_SUCCESS":         return { Icon: Download,      iconCls: "text-emerald-500", bgCls: "bg-emerald-50 dark:bg-emerald-500/10" };
    case "IMPORT_FAILED":          return { Icon: AlertTriangle, iconCls: "text-red-500",     bgCls: "bg-red-50 dark:bg-red-500/10" };
    case "IMPORT_LIMIT_REACHED":   return { Icon: AlertTriangle, iconCls: "text-amber-500",   bgCls: "bg-amber-50 dark:bg-amber-500/10" };
    case "BUSINESS_LIMIT_REACHED": return { Icon: AlertTriangle, iconCls: "text-amber-500",   bgCls: "bg-amber-50 dark:bg-amber-500/10" };
    case "PLAN_UPGRADE_REQUIRED":  return { Icon: TrendingUp,    iconCls: "text-violet-500",  bgCls: "bg-violet-50 dark:bg-violet-500/10" };
    default:                       return { Icon: Bell,          iconCls: "text-indigo-500",  bgCls: "bg-indigo-50 dark:bg-indigo-500/10" };
  }
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

// Dummy guide items — future: replace with API data / CMS
const GUIDE_SECTIONS = [
  {
    heading: "Getting Started",
    items: [
      { Icon: BookOpen,     label: "Quick Start Guide",         desc: "Learn the basics in 5 minutes"     },
      { Icon: Video,        label: "Video Walkthrough",         desc: "Watch a full product tour"          },
    ],
  },
  {
    heading: "Features",
    items: [
      { Icon: Upload,       label: "Importing from Google Maps", desc: "Paste a Maps URL and hit import"   },
      { Icon: MessageSquare,label: "WhatsApp Templates",         desc: "Set up and personalise templates"  },
      { Icon: Mail,         label: "Email Campaigns",            desc: "Configure EmailJS and start sending"},
    ],
  },
  {
    heading: "Support",
    items: [
      { Icon: ChatIcon,     label: "Live Chat",                  desc: "Talk to our team"                  },
      { Icon: ExternalLink, label: "Documentation",              desc: "Full reference docs"                },
    ],
  },
];

// ─── Utility: close dropdown on outside click ─────────────────────────────────
function useOutsideClick(ref, onClose) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function SidebarNavItem({ id, label, Icon, badge, active, onSelect, locked }) {
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
      {locked && (
        <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded-full">
          Pro
        </span>
      )}
      {active && <ChevronRight size={12} className="flex-shrink-0 opacity-40" />}
    </button>
  );
}

// ─── Notifications dropdown ──────────────────────────────────────────────────
function NotificationsDropdown({ notifications, setNotifications, onClose }) {
  const unread = notifications.filter(n => !n.read).length;

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    notificationApi.markRead(id).catch(() => {});
  }
  function dismiss(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
    notificationApi.dismiss(id).catch(() => {});
  }
  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationApi.markAllRead().catch(() => {});
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
          {unread > 0 && (
            <span className="text-[11px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
        <button onClick={markAllRead} className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          Mark all read
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/40">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-600">No notifications</div>
        ) : notifications.map(n => {
          const { Icon: NIcon, iconCls, bgCls } = notifStyle(n.type);
          return (
          <div key={n.id} className={`flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.read ? "bg-indigo-50/40 dark:bg-indigo-500/[0.04]" : ""}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${bgCls}`}>
              <NIcon size={14} className={iconCls} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.body}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">{relativeTime(n.createdAt)}</p>
              <div className="flex items-center gap-3 mt-1.5">
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => dismiss(n.id)}
                  className="text-[10px] font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700/60 text-center">
        <button className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          View all notifications
        </button>
      </div>
    </div>
  );
}

// ─── Help / Guide dropdown ───────────────────────────────────────────────────
function GuideDropdown() {
  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Help & Resources</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Everything you need to get the most out of MapLeads</p>
      </div>
      <div className="max-h-80 overflow-y-auto py-2">
        {GUIDE_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-1 pt-1 border-t border-slate-100 dark:border-slate-700/40" : ""}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-4 py-1.5">{section.heading}</p>
            {section.items.map(({ Icon, label, desc }, i) => (
              <button key={i} className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={13} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{label}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── User profile dropdown ───────────────────────────────────────────────────
function ProfileDropdown({ user, isAdmin, onLogout, onClose }) {
  const avatarLetter = (user?.name || user?.email || "U")[0].toUpperCase();
  return (
    <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50">
      {/* User info header */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 shadow-sm">
          {avatarLetter}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user?.name || "User"}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded-full mt-1">
              <ShieldCheck size={8} /> Admin
            </span>
          )}
        </div>
      </div>
      {/* Menu items */}
      <div className="py-1.5">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
          <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <User size={12} />
          </div>
          View Profile
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
          <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Settings size={12} />
          </div>
          Account Settings
        </button>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-700/60 py-1.5">
        <button
          onClick={() => { onClose(); onLogout(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <LogOut size={12} className="text-red-500" />
          </div>
          Sign Out
        </button>
      </div>
    </div>
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
  const { user, logout, isAdmin, planTier, orgRole, org } = useAuth();
  const { tab: rawTab }                   = useParams();
  const routerNavigate                    = useNavigate();
  const tab                               = rawTab || "dashboard";
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [guideOpen, setGuideOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Load notifications from API
  useEffect(() => {
    notificationApi.list()
      .then(data => setNotifications(data || []))
      .catch(() => {});
  }, []);

  const notifRef   = useRef(null);
  const guideRef   = useRef(null);
  const profileRef = useRef(null);

  useOutsideClick(notifRef,   () => setNotifOpen(false));
  useOutsideClick(guideRef,   () => setGuideOpen(false));
  useOutsideClick(profileRef, () => setProfileOpen(false));

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
    routerNavigate(nextTab === "dashboard" ? "/dashboard" : `/dashboard/${nextTab}`);
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

  const bizCount     = businesses.length;
  const avatarLetter = (user?.name || user?.email || "U")[0].toUpperCase();
  const unreadCount  = notifications.filter(n => !n.read).length;

  // ── Sidebar content ─────────────────────────────────────────────────────────
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
          {MAIN_NAV.map(({ id, label, Icon, requiresPaid }) => (
            <SidebarNavItem
              key={id}
              id={id}
              label={label}
              Icon={Icon}
              badge={id === "businesses" && bizCount ? bizCount : null}
              active={tab === id}
              onSelect={navigate}
              locked={requiresPaid && planTier === "BASIC"}
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

      {/* Footer — plan badge only */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700/60 px-4 py-4">
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/[0.08] dark:to-violet-500/[0.05] rounded-xl px-3 py-2.5 border border-indigo-100/80 dark:border-indigo-500/20">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-indigo-500 fill-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Basic Plan</span>
          </div>
          <button className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            Upgrade →
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

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
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

          {/* ── Right-side controls ── */}
          <div className="flex items-center gap-1.5">

            {/* Clear All — contextual */}
            {/* {tab === "businesses" && bizCount > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 rounded-lg px-3 py-1.5 mr-2 transition-all"
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )} */}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(v => !v); setGuideOpen(false); setProfileOpen(false); }}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>
              {notifOpen && <NotificationsDropdown notifications={notifications} setNotifications={setNotifications} onClose={() => setNotifOpen(false)} />}
            </div>

            {/* Help / Guide */}
            <div ref={guideRef} className="relative">
              <button
                onClick={() => { setGuideOpen(v => !v); setNotifOpen(false); setProfileOpen(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Help & Resources"
              >
                <HelpCircle size={16} />
              </button>
              {guideOpen && <GuideDropdown />}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* User profile avatar */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); setGuideOpen(false); }}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="My account"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-sm">
                  {avatarLetter}
                </div>
                <span className="hidden md:block text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                  {user?.name || user?.email}
                </span>
                <ChevronDown size={12} className={`hidden md:block text-slate-400 transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              {profileOpen && (
                <ProfileDropdown
                  user={user}
                  isAdmin={isAdmin}
                  onLogout={logout}
                  onClose={() => setProfileOpen(false)}
                />
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable page content ── */}
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

            {tab === "users" && (
              <UsersView
                dark={dark}
                user={{ ...user, role: orgRole, planTier }}
                org={org}
                planTier={planTier}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
