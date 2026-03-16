import { useState, useEffect, useCallback } from "react";
import { initDB } from "../db";
import { Database, RefreshCw, Search, ChevronDown, ChevronUp, Copy, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const STORES = [
  { key: "businesses",     label: "Businesses",     color: "#6366f1" },
  { key: "templates",      label: "Templates",      color: "#8b5cf6" },
  { key: "tags",           label: "Tags",           color: "#06b6d4" },
  { key: "reminders",      label: "Reminders",      color: "#f59e0b" },
  { key: "import_history", label: "Import History", color: "#10b981" },
  { key: "settings",       label: "Settings",       color: "#64748b" },
];

// Columns to show first (in order) for each store — rest auto-appended
const PRIORITY_COLS = {
  businesses:     ["id", "name", "category", "phone", "address", "status", "rating", "note", "importedAt"],
  templates:      ["id", "name", "body", "createdAt"],
  tags:           ["bizId", "tags"],
  reminders:      ["bizId", "dueDate", "note"],
  import_history: ["id", "added", "skipped", "importedAt"],
  settings:       ["key", "value"],
};

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(typeof value === "object" ? JSON.stringify(value) : String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} title="Copy"
      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: copied ? "#16a34a" : "#94a3b8", display: "inline-flex", alignItems: "center" }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

function CellValue({ v }) {
  const [open, setOpen] = useState(false);
  if (v === null || v === undefined) return <span style={{ color: "#94a3b8", fontStyle: "italic" }}>null</span>;
  if (Array.isArray(v)) {
    if (!v.length) return <span style={{ color: "#94a3b8", fontStyle: "italic" }}>[]</span>;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {v.map((item, i) => (
          <span key={i} style={{ background: "#eef2ff", color: "#6366f1", borderRadius: 4, padding: "1px 6px", fontSize: 11, fontWeight: 600 }}>{String(item)}</span>
        ))}
      </div>
    );
  }
  if (typeof v === "object") {
    const preview = JSON.stringify(v).slice(0, 60);
    return (
      <div>
        <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 11, padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
          {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {preview}{JSON.stringify(v).length > 60 ? "…" : ""}
        </button>
        {open && <pre style={{ margin: "4px 0 0", fontSize: 11, color: "#475569", background: "#f8fafc", padding: 8, borderRadius: 6, maxWidth: 380, overflowX: "auto" }}>{JSON.stringify(v, null, 2)}</pre>}
      </div>
    );
  }
  const str = String(v);
  const isUrl = /^https?:\/\//i.test(str);
  if (str.length > 30 || isUrl) {
    const preview = str.slice(0, 30) + (str.length > 30 ? "…" : "");
    return (
      <div style={{ maxWidth: "100%" }}>
        {isUrl && !open ? (
          <a href={str} target="_blank" rel="noopener noreferrer"
            style={{ color: "#6366f1", fontSize: 11, wordBreak: "break-all", display: "block", maxWidth: "100%" }}>
            {preview}
          </a>
        ) : (
          <span style={{ fontSize: 11, wordBreak: "break-all", display: "block", maxWidth: "100%" }}>
            {open ? str : preview}
          </span>
        )}
        {str.length > 30 && (
          <button onClick={() => setOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 10, padding: "2px 0 0", display: "flex", alignItems: "center", gap: 2 }}>
            {open ? <><ChevronUp size={10} /> less</> : <><ChevronDown size={10} /> more</>}
          </button>
        )}
      </div>
    );
  }
  // Date-like strings
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    return <span title={str}>{new Date(str).toLocaleString()}</span>;
  }
  return <span>{str}</span>;
}

function buildColumns(rows, store) {
  const priority = PRIORITY_COLS[store] || [];
  const all = new Set();
  rows.forEach(r => Object.keys(r).forEach(k => all.add(k)));
  const sorted = [...priority.filter(k => all.has(k)), ...[...all].filter(k => !priority.includes(k))];
  return sorted;
}

export default function DataView({ dark }) {
  const [activeStore, setActiveStore] = useState("businesses");
  const [counts,      setCounts]      = useState({});
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [sortCol,     setSortCol]     = useState(null);
  const [sortDir,     setSortDir]     = useState("asc");
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(25);

  const th = dark ? "#e2e8f0" : "#0f172a";
  const ts = dark ? "#94a3b8" : "#64748b";
  const surface = dark ? "#1e293b" : "#fff";
  const border  = dark ? "#334155" : "#e2e8f0";
  const rowHover = dark ? "#0f172a" : "#f8fafc";
  const inputBg = dark ? "#0f172a" : "#fafafa";
  const headBg  = dark ? "#0f172a" : "#f1f5f9";

  const loadStore = useCallback(async (storeName) => {
    setLoading(true);
    setSearch("");
    setSortCol(null);
    setPage(1);
    try {
      const db = await initDB();
      const data = await db.getAll(storeName);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load counts for all stores
  const refreshCounts = useCallback(async () => {
    try {
      const db = await initDB();
      const result = {};
      for (const s of STORES) {
        try { result[s.key] = await db.count(s.key); } catch { result[s.key] = 0; }
      }
      setCounts(result);
    } catch {}
  }, []);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  useEffect(() => {
    loadStore(activeStore);
  }, [activeStore, loadStore]);

  const cols = rows.length ? buildColumns(rows, activeStore) : [];

  // Filter
  const filtered = search
    ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))
    : rows;

  // Sort
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const va = a[sortCol] ?? "";
        const vb = b[sortCol] ?? "";
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  function toggleSort(col) {
    setPage(1);
    if (sortCol === col) { setSortDir(d => d === "asc" ? "desc" : "asc"); }
    else { setSortCol(col); setSortDir("asc"); }
  }

  const activeColor = STORES.find(s => s.key === activeStore)?.color || "#6366f1";

  // Pagination calculations
  const totalPages  = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage    = Math.min(page, totalPages);
  const pageSlice   = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const firstItem   = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem    = Math.min(safePage * pageSize, sorted.length);

  function getPageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (safePage > 3) pages.push("...");
    for (let p = Math.max(2, safePage - 1); p <= Math.min(totalPages - 1, safePage + 1); p++) pages.push(p);
    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <Database size={20} color="#6366f1" />
        <h2 style={{ fontSize: 22, fontWeight: 800, color: th, margin: 0 }}>Database Explorer</h2>
        <span style={{ fontSize: 12, color: ts, marginLeft: 4 }}>IndexedDB — {Object.values(counts).reduce((a, b) => a + b, 0)} total records</span>
        <button onClick={() => { refreshCounts(); loadStore(activeStore); }} title="Refresh"
          style={{ marginLeft: "auto", background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 9px", cursor: "pointer", display: "flex", alignItems: "center", color: ts }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Store tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {STORES.map(s => {
          const active = s.key === activeStore;
          return (
            <button key={s.key} onClick={() => setActiveStore(s.key)}
              style={{
                background: active ? s.color : (dark ? "#1e293b" : "#f1f5f9"),
                color: active ? "#fff" : ts,
                border: "none", borderRadius: 20, padding: "6px 14px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}>
              {s.label}
              <span style={{ background: active ? "rgba(255,255,255,0.25)" : (dark ? "#334155" : "#e2e8f0"), color: active ? "#fff" : ts, borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                {counts[s.key] ?? "…"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14, maxWidth: 340 }}>
        <Search size={13} color={ts} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder={`Search ${activeStore}…`}
          style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 8, border: `1px solid ${border}`, fontSize: 13, color: th, background: inputBg, outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Table */}
      <div style={{ background: surface, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: ts, fontSize: 13 }}>Loading…</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: ts, fontSize: 13 }}>
            {search ? "No records match your search." : `No records in "${activeStore}" yet.`}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: headBg }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: ts, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: `1px solid ${border}`, whiteSpace: "nowrap", width: 36 }}>#</th>
                  {cols.map(col => (
                    <th key={col} onClick={() => toggleSort(col)}
                      style={{ padding: "10px 14px", textAlign: "left", color: sortCol === col ? activeColor : ts, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: `1px solid ${border}`, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" }}>
                      {col} {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((row, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    style={{ borderBottom: `1px solid ${dark ? "#0f172a" : "#f8fafc"}` }}>
                    <td style={{ padding: "10px 14px", color: ts, fontWeight: 600 }}>{(safePage - 1) * pageSize + i + 1}</td>
                    {cols.map(col => (
                      <td key={col} style={{ padding: "10px 14px", color: th, verticalAlign: "top", maxWidth: 260 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                          <CellValue v={row[col]} />
                          {row[col] !== null && row[col] !== undefined && <CopyButton value={row[col]} />}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / Pagination */}
        {sorted.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>

            {/* Record count */}
            <span style={{ fontSize: 12, color: ts, whiteSpace: "nowrap" }}>
              <strong style={{ color: th }}>{firstItem}–{lastItem}</strong> of <strong style={{ color: th }}>{sorted.length}</strong>{search ? ` (filtered from ${rows.length})` : ""}
            </span>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Rows per page */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: ts }}>
              <span style={{ whiteSpace: "nowrap" }}>Rows per page</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${border}`, fontSize: 12, color: th, background: dark ? "#0f172a" : "#fff", outline: "none", cursor: "pointer" }}>
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Page controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <button onClick={() => setPage(1)} disabled={safePage === 1} title="First page"
                  style={{ background: "none", border: `1px solid ${border}`, borderRadius: 6, padding: "4px 7px", cursor: safePage === 1 ? "not-allowed" : "pointer", color: safePage === 1 ? ts : th, opacity: safePage === 1 ? 0.4 : 1, display: "flex", alignItems: "center" }}>
                  <ChevronsLeft size={13} />
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} title="Previous"
                  style={{ background: "none", border: `1px solid ${border}`, borderRadius: 6, padding: "4px 7px", cursor: safePage === 1 ? "not-allowed" : "pointer", color: safePage === 1 ? ts : th, opacity: safePage === 1 ? 0.4 : 1, display: "flex", alignItems: "center" }}>
                  <ChevronLeft size={13} />
                </button>

                {getPageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: ts, fontSize: 12, userSelect: "none" }}>…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ minWidth: 30, height: 28, background: safePage === p ? activeColor : "none", color: safePage === p ? "#fff" : th, border: `1px solid ${safePage === p ? activeColor : border}`, borderRadius: 6, fontSize: 12, fontWeight: safePage === p ? 700 : 500, cursor: "pointer", transition: "all 0.12s" }}>
                      {p}
                    </button>
                  )
                )}

                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="Next"
                  style={{ background: "none", border: `1px solid ${border}`, borderRadius: 6, padding: "4px 7px", cursor: safePage === totalPages ? "not-allowed" : "pointer", color: safePage === totalPages ? ts : th, opacity: safePage === totalPages ? 0.4 : 1, display: "flex", alignItems: "center" }}>
                  <ChevronRight size={13} />
                </button>
                <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="Last page"
                  style={{ background: "none", border: `1px solid ${border}`, borderRadius: 6, padding: "4px 7px", cursor: safePage === totalPages ? "not-allowed" : "pointer", color: safePage === totalPages ? ts : th, opacity: safePage === totalPages ? 0.4 : 1, display: "flex", alignItems: "center" }}>
                  <ChevronsRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
