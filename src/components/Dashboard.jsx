import StatCard  from "./StatCard";
import Badge     from "./Badge";
import {
  Building2, Phone, MessageCircle, CornerUpLeft,
  Target, XCircle, TrendingUp, WifiOff, Calendar, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { STATUS_CONFIG } from "../constants";
import { useState } from "react";

function formatGroupDate(dateStr) {
  if (!dateStr || dateStr === "Unknown") return "Unknown Date";
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dateStr === today.toISOString().slice(0, 10)) return "Today";
  if (dateStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

export default function Dashboard({ stats, businesses, contacts, onNavigate, dark }) {
  const [collapsedDates, setCollapsedDates] = useState(new Set());
  function toggleDate(d) {
    setCollapsedDates((prev) => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n; });
  }

  const th = dark ? "#e2e8f0" : "#0f172a";
  const ts = dark ? "#94a3b8" : "#64748b";
  const surface = dark ? "#1e293b" : "#ffffff";
  const border  = dark ? "#334155" : "#f0f0f0";

  // Build funnel chart data  -- count how many are in each status
  const statusCounts = {};
  Object.values(contacts).forEach((c) => {
    const s = c.status || "not_contacted";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const notContacted = businesses.length - Object.values(contacts).filter(c => c.status && c.status !== "not_contacted").length;
  const chartData = [
    { name: "Total",         value: stats.total,          color: "#6366f1" },
    { name: "Phone",         value: stats.withPhone,      color: "#0ea5e9" },
    { name: "Contacted",     value: stats.contacted,      color: "#f59e0b" },
    { name: "Replied",       value: stats.replied,        color: "#10b981" },
    { name: "Converted",     value: stats.converted,      color: "#8b5cf6" },
  ];

  const statusDistData = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    name:  cfg.label,
    value: key === "not_contacted"
      ? notContacted
      : (statusCounts[key] || 0),
    color: cfg.color,
  }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: th, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={22} color="#6366f1" /> Overview
        </h2>
        <p style={{ color: ts, marginTop: 6, fontSize: 14 }}>Your outreach performance at a glance.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 32 }}>
        <StatCard icon={Building2}      label="Total Businesses" value={stats.total}            accent="#6366f1" dark={dark} />
        <StatCard icon={Phone}          label="Have Phone"        value={stats.withPhone}        accent="#0ea5e9" dark={dark} />
        <StatCard icon={MessageCircle}  label="Contacted"         value={stats.contacted}        accent="#f59e0b" dark={dark} />
        <StatCard icon={CornerUpLeft}   label="Replied"           value={stats.replied}          accent="#10b981" dark={dark} />
        <StatCard icon={Target}         label="Converted"         value={stats.converted}        accent="#8b5cf6" dark={dark} />
        <StatCard icon={XCircle}        label="Not Interested"    value={stats.not_interested}   accent="#ef4444" dark={dark} />
        <StatCard icon={WifiOff}        label="Not on WhatsApp"   value={stats.not_on_whatsapp}  accent="#f97316" dark={dark} />
      </div>

      {businesses.length === 0 ? (
        <div style={{ background: surface, borderRadius: 16, border: `2px dashed ${border}`, padding: "60px 32px", textAlign: "center" }}>
          <Building2 size={48} color="#6366f1" style={{ margin: "0 auto 16px" }} />
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: th }}>Get Started</div>
          <div style={{ color: ts, fontSize: 14, margin: "0 auto 24px", maxWidth: 380 }}>
            Import businesses from Google Maps, then send WhatsApp messages and track your outreach.
          </div>
          <button onClick={() => onNavigate("import")}
            style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Import Businesses
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Conversion funnel bar */}
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: ts, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Conversion Funnel
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: ts }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: ts }} width={70} />
                <Tooltip
                  contentStyle={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: dark ? "#334155" : "#f8fafc" }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status distribution */}
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: ts, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Status Distribution
            </div>
            {statusDistData.map((d) => (
              <div key={d.name} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: th, fontWeight: 500 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
                <div style={{ height: 6, background: dark ? "#334155" : "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${stats.total ? (d.value / stats.total) * 100 : 0}%`, background: d.color, borderRadius: 4, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent businesses — sorted newest-first, grouped by import date */}
      {businesses.length > 0 && (() => {
        // Sort newest importedAt first, take top 10
        const recent = [...businesses]
          .sort((a, b) => (b.importedAt || "").localeCompare(a.importedAt || ""))
          .slice(0, 10);
        // Group by date
        const groupMap = {};
        recent.forEach((b) => {
          const date = b.importedAt ? b.importedAt.slice(0, 10) : "Unknown";
          if (!groupMap[date]) groupMap[date] = [];
          groupMap[date].push(b);
        });
        const groups = Object.entries(groupMap).sort((a, b2) => b2[0].localeCompare(a[0]));
        return (
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginTop: 20 }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, fontWeight: 700, fontSize: 14, color: th, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Recent Businesses</span>
              <button onClick={() => onNavigate("businesses")}
                style={{ background: "none", border: "none", color: "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                View All →
              </button>
            </div>
            {groups.map(([date, items]) => {
              const isCollapsed = collapsedDates.has(date);
              return (
                <div key={date}>
                  {/* Date group header */}
                  <button
                    onClick={() => toggleDate(date)}
                    style={{ width: "100%", background: dark ? "#0f172a" : "#f8fafc", border: "none", borderLeft: "3px solid #6366f1", borderBottom: `1px solid ${border}`, cursor: "pointer", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={12} color="#6366f1" />
                    <span style={{ fontWeight: 700, fontSize: 12, color: th }}>{formatGroupDate(date)}</span>
                    <span style={{ fontSize: 11, color: ts, marginLeft: 4 }}>{items.length} business{items.length !== 1 ? "es" : ""}</span>
                    <span style={{ marginLeft: "auto", color: ts }}>
                      {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                    </span>
                  </button>
                  {/* Rows */}
                  {!isCollapsed && items.map((b) => {
                    const status = contacts[b.id]?.status || "not_contacted";
                    return (
                      <div key={b.id} style={{ padding: "12px 20px", borderBottom: `1px solid ${dark ? "#1e293b" : "#f8fafc"}`, display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: th }}>{b.name}</div>
                          <div style={{ fontSize: 11, color: ts, marginTop: 2 }}>{b.category}{b.phone ? ` · ${b.phone}` : ""}</div>
                        </div>
                        <Badge status={status} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
