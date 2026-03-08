import { useState } from "react";
import BusinessRow from "./BusinessRow";
import { STATUS_CONFIG } from "../constants";
import { exportToCSV, downloadCSV } from "../utils/whatsapp";
import {
  Search, Filter, Download, Trash2, CheckSquare,
  Square, RefreshCw, ChevronDown, ChevronUp, Calendar,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 20;

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

function groupByDate(businesses) {
  const groups = {};
  businesses.forEach((b) => {
    const date = b.importedAt ? b.importedAt.slice(0, 10) : "Unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(b);
  });
  // Newest date first
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function BusinessesView({
  businesses, contacts, template, countryCode,
  tags, reminders,
  onStatusChange, onNoteChange, onTagsChange, onSetReminder, onDeleteReminder,
  selectedBizIds, onToggleSelect, onSelectAll, onClearSelection,
  onBulkStatusChange, onBulkDelete, onSendEmail,
  dark,
}) {
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTag,    setFilterTag]    = useState("");
  const [expanded,     setExpanded]     = useState(null);
  const [page,         setPage]         = useState(1);
  const [collapsedDates, setCollapsedDates] = useState(new Set());

  const th = dark ? "#e2e8f0" : "#0f172a";
  const ts = dark ? "#94a3b8" : "#64748b";
  const border  = dark ? "#334155" : "#e2e8f0";
  const inputBg = dark ? "#1e293b" : "#fff";
  const surface = dark ? "#1e293b" : "#fff";

  const allTags = [...new Set(Object.values(tags).flat())];

  // Filter
  const filtered = businesses.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      b.name.toLowerCase().includes(q) ||
      (b.category || "").toLowerCase().includes(q) ||
      (b.address || "").toLowerCase().includes(q);
    const status = contacts[b.id]?.status || "not_contacted";
    const matchStatus = filterStatus === "all" || status === filterStatus;
    const bizTags = tags[b.id] || [];
    const matchTag = !filterTag || bizTags.includes(filterTag);
    return matchSearch && matchStatus && matchTag;
  });

  // Sort newest importedAt first
  const sorted = [...filtered].sort((a, b) => {
    const ta = a.importedAt || "";
    const tb = b.importedAt || "";
    return tb.localeCompare(ta);
  });

  // Pagination on the sorted list
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = sorted.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Group the current page's slice by import date
  const groups = groupByDate(pageSlice);

  const filteredIds = filtered.map((b) => b.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedBizIds.has(id));

  function toggleDateGroup(date) {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }

  function handleExport() {
    const csv = exportToCSV(businesses, contacts);
    downloadCSV(csv, `mapleads-export-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function goToPage(p) {
    setPage(Math.max(1, Math.min(p, totalPages)));
    setExpanded(null);
  }

  // Reset to page 1 when filters change
  function handleSearchChange(v) { setSearch(v); setPage(1); }
  function handleStatusChange(v) { setFilterStatus(v); setPage(1); }
  function handleTagChange(v)    { setFilterTag(v);    setPage(1); }

  const inputStyle = {
    padding: "9px 14px",
    borderRadius: 10,
    border: `1px solid ${border}`,
    fontSize: 13,
    color: dark ? "#e2e8f0" : "#334155",
    background: inputBg,
    outline: "none",
  };

  if (!businesses.length) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <CheckSquare size={56} color="#6366f1" style={{ margin: "0 auto 16px" }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: th, marginBottom: 8 }}>No businesses yet</div>
        <div style={{ color: ts, fontSize: 14 }}>Go to the Import tab to add businesses from Google Maps</div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: ts }} />
          <input value={search} onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, category, addressâ€¦"
            style={{ ...inputStyle, paddingLeft: 34, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div style={{ position: "relative" }}>
          <Filter size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ts, pointerEvents: "none" }} />
          <select value={filterStatus} onChange={(e) => handleStatusChange(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 28, cursor: "pointer", appearance: "none", paddingRight: 28 }}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        {allTags.length > 0 && (
          <select value={filterTag} onChange={(e) => handleTagChange(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">All Tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <span style={{ fontSize: 13, color: ts, whiteSpace: "nowrap" }}>
          {filtered.length} of {businesses.length}
        </span>
        <button onClick={handleExport}
          style={{ background: dark ? "#1e293b" : "#f0fdf4", color: "#16a34a", border: `1px solid ${dark ? "#334155" : "#bbf7d0"}`, borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <Download size={14} />Export CSV
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedBizIds.size > 0 && (
        <div style={{ background: "#6366f1", borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{selectedBizIds.size} selected</span>
          <select defaultValue="" onChange={(e) => { if (e.target.value) onBulkStatusChange(selectedBizIds, e.target.value); }}
            style={{ padding: "5px 10px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <option value="" disabled>Set statusâ€¦</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => onBulkDelete(selectedBizIds)}
            style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Trash2 size={13} />Delete
          </button>
          <button onClick={onClearSelection}
            style={{ background: "#fff3", color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <RefreshCw size={12} />Clear
          </button>
        </div>
      )}

      {/* Select all row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
        <button onClick={() => allFilteredSelected ? onClearSelection() : onSelectAll(filteredIds)}
          style={{ background: "none", border: "none", cursor: "pointer", color: ts, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
          {allFilteredSelected ? <CheckSquare size={15} color="#6366f1" /> : <Square size={15} />}
          {allFilteredSelected ? "Deselect all" : "Select all visible"}
        </button>
      </div>

      {/* Grouped list */}
      {groups.map(([date, items]) => {
        const isCollapsed = collapsedDates.has(date);
        return (
          <div key={date} style={{ marginBottom: 16 }}>
            {/* Group header */}
            <button
              onClick={() => toggleDateGroup(date)}
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "8px 12px", marginBottom: 6, display: "flex", alignItems: "center", gap: 8, borderRadius: 8, background: dark ? "#1e293b" : "#f8fafc", borderLeft: "3px solid #6366f1" }}>
              <Calendar size={13} color="#6366f1" />
              <span style={{ fontWeight: 700, fontSize: 13, color: th }}>{formatGroupDate(date)}</span>
              <span style={{ fontSize: 12, color: ts, marginLeft: 4 }}>{items.length} business{items.length !== 1 ? "es" : ""}</span>
              <span style={{ marginLeft: "auto", color: ts }}>
                {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </span>
            </button>

            {/* Group rows */}
            {!isCollapsed && items.map((biz) => (
              <BusinessRow
                key={biz.id}
                biz={biz}
                contact={contacts[biz.id]}
                template={template}
                countryCode={countryCode}
                onStatusChange={onStatusChange}
                onNoteChange={onNoteChange}
                onTagsChange={onTagsChange}
                onSetReminder={onSetReminder}
                onDeleteReminder={onDeleteReminder}
                onSendEmail={onSendEmail}
                bizTags={tags[biz.id] || []}
                reminder={reminders[biz.id] || null}
                isExpanded={expanded === biz.id}
                onToggle={() => setExpanded(expanded === biz.id ? null : biz.id)}
                isSelected={selectedBizIds.has(biz.id)}
                onToggleSelect={onToggleSelect}
                dark={dark}
              />
            ))}
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <button onClick={() => goToPage(1)} disabled={safePage === 1}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: surface, color: safePage === 1 ? ts : th, cursor: safePage === 1 ? "not-allowed" : "pointer", fontSize: 13, opacity: safePage === 1 ? 0.4 : 1 }}>
            Â«
          </button>
          <button onClick={() => goToPage(safePage - 1)} disabled={safePage === 1}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: surface, color: safePage === 1 ? ts : th, cursor: safePage === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: safePage === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={15} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push("â€¦");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "â€¦" ? (
                <span key={`gap-${i}`} style={{ color: ts, fontSize: 13, padding: "0 4px" }}>â€¦</span>
              ) : (
                <button key={p} onClick={() => goToPage(p)}
                  style={{ padding: "7px 11px", borderRadius: 8, border: `1px solid ${p === safePage ? "#6366f1" : border}`, background: p === safePage ? "#6366f1" : surface, color: p === safePage ? "#fff" : th, cursor: "pointer", fontWeight: p === safePage ? 700 : 400, fontSize: 13 }}>
                  {p}
                </button>
              )
            )}

          <button onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: surface, color: safePage === totalPages ? ts : th, cursor: safePage === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: safePage === totalPages ? 0.4 : 1 }}>
            <ChevronRight size={15} />
          </button>
          <button onClick={() => goToPage(totalPages)} disabled={safePage === totalPages}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: surface, color: safePage === totalPages ? ts : th, cursor: safePage === totalPages ? "not-allowed" : "pointer", fontSize: 13, opacity: safePage === totalPages ? 0.4 : 1 }}>
            Â»
          </button>

          <span style={{ fontSize: 12, color: ts, marginLeft: 4 }}>
            Page {safePage} of {totalPages} Â· {filtered.length} total
          </span>
        </div>
      )}
    </div>
  );
}
