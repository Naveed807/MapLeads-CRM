import { useState, useRef } from "react";
import { parseGoogleMapsHTML } from "../utils/parseGoogleMaps";
import { parseExcelFile, generateExcelTemplate } from "../utils/parseExcel";
import { COUNTRY_CODES } from "../constants";
import { toast } from "../utils/dialog";
import {
  Upload, FileCode, X, CheckCircle, AlertCircle, History,
  Globe, Trash2, FileSpreadsheet, Download, Map,
} from "lucide-react";

// --- Import History Panel ---

function ImportHistoryPanel({ history, onDeleteImport, dark }) {
  const surface = dark ? "#1e293b" : "#fff";
  const border  = dark ? "#334155" : "#e2e8f0";
  const th = dark ? "#e2e8f0" : "#0f172a";
  const ts = dark ? "#94a3b8" : "#64748b";

  if (!history.length) return null;
  return (
    <div style={{ marginTop: 24, background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <History size={14} color="#6366f1" />
        <span style={{ fontWeight: 700, fontSize: 13, color: th }}>Import History</span>
      </div>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {history.slice(0, 30).map((h) => (
          <div key={h.id} style={{ padding: "10px 20px", borderBottom: `1px solid ${dark ? "#0f172a" : "#f8fafc"}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: th }}>{h.added} added</span>
              {h.skipped > 0 && <span style={{ fontSize: 12, color: ts }}>, {h.skipped} skipped</span>}
            </div>
            <span style={{ fontSize: 11, color: ts }}>{new Date(h.importedAt).toLocaleString()}</span>
            <button
              onClick={() => onDeleteImport(h.id)}
              title={h.batchId ? "Delete this batch and its businesses" : "Remove entry"}
              style={{ background: "none", border: `1px solid ${dark ? "#334155" : "#fecaca"}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <Trash2 size={12} />{h.batchId ? "Delete" : "Remove"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main ImportView ---

export default function ImportView({ onImport, onDeleteImport, importHistory, countryCode, onCountryCodeChange, dark }) {
  const [mode,     setMode]     = useState("maps");

  const [html,     setHtml]     = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);

  const [xlFile,        setXlFile]        = useState(null);
  const [xlPreview,     setXlPreview]     = useState(null);
  const [xlError,       setXlError]       = useState("");
  const [xlLoading,     setXlLoading]     = useState(false);
  const [xlResult,      setXlResult]      = useState(null);
  const [xlDragging,    setXlDragging]    = useState(false);
  const fileInputRef = useRef(null);

  const th = dark ? "#e2e8f0" : "#0f172a";
  const ts = dark ? "#94a3b8" : "#64748b";
  const surface = dark ? "#1e293b" : "#fff";
  const border  = dark ? "#334155" : "#e2e8f0";
  const inputBg = dark ? "#0f172a" : "#fafafa";

  const inputStyle = { padding: "9px 12px", borderRadius: 8, border: `1px solid ${border}`, fontSize: 13, color: dark ? "#e2e8f0" : "#334155", background: inputBg, outline: "none" };

  function handleParse() {
    setError(""); setResult(null);
    const parsed = parseGoogleMapsHTML(html);
    if (!parsed.length) {
      setError("No businesses found. Click the left results panel on Google Maps -> Ctrl+A -> Ctrl+C -> paste here.");
      return;
    }
    setPreview(parsed);
  }

  async function handleConfirm() {
    setLoading(true);
    const { added, skipped } = await onImport(preview, "google_maps");
    setLoading(false);
    setResult({ added, skipped });
    setHtml(""); setPreview(null);
    if (added > 0) {
      toast.success(`Imported ${added} business${added === 1 ? "" : "es"}${skipped ? ` (${skipped} skipped)` : ""}.`);
    } else {
      toast.warning(`No new businesses added${skipped ? ` — ${skipped} already exist` : ""}.`);
    }
  }

  async function processFile(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setXlError("Only .xlsx, .xls, or .csv files are supported.");
      return;
    }
    setXlFile(file);
    setXlError(""); setXlResult(null);
    try {
      const result = await parseExcelFile(file);
      setXlPreview(result);
    } catch (err) {
      setXlError("Failed to parse file: " + (err.message || "Unknown error"));
    }
  }

  function handleFileDrop(e) {
    e.preventDefault(); setXlDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  async function handleExcelConfirm() {
    if (!xlPreview?.businesses?.length) return;
    setXlLoading(true);
    const { added, skipped } = await onImport(xlPreview.businesses, "excel");
    setXlLoading(false);
    setXlResult({ added, skipped });
    setXlFile(null); setXlPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (added > 0) {
      toast.success(`Imported ${added} business${added === 1 ? "" : "es"}${skipped ? ` (${skipped} skipped)` : ""}.`);
    } else {
      toast.warning(`No new businesses added${skipped ? ` — ${skipped} already exist` : ""}.`);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: th, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Upload size={20} color="#6366f1" />Import Businesses
        </h2>
        <p style={{ color: ts, marginTop: 6, fontSize: 14 }}>Import from Google Maps or upload an Excel / CSV file.</p>
      </div>

      <div style={{ display: "flex", gap: 0, background: dark ? "#0f172a" : "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {[
          { id: "maps",  label: "Google Maps", Icon: Map },
          { id: "excel", label: "Excel / CSV",  Icon: FileSpreadsheet },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => { setMode(id); setError(""); setXlError(""); }}
            style={{ background: mode === id ? (dark ? "#1e293b" : "#fff") : "none", color: mode === id ? "#6366f1" : ts, border: "none", borderRadius: 9, padding: "9px 20px", fontSize: 13, fontWeight: mode === id ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: mode === id ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      <div style={{ background: surface, borderRadius: 14, border: `1px solid ${border}`, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Globe size={16} color="#6366f1" />
        <label style={{ fontSize: 13, fontWeight: 600, color: th }}>Country Code</label>
        <select value={countryCode} onChange={(e) => onCountryCodeChange(e.target.value)}
          style={{ flex: 1, minWidth: 180, ...inputStyle, cursor: "pointer" }}>
          {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
        <span style={{ fontSize: 12, color: ts }}>Auto-prepended to phone numbers for WhatsApp.</span>
      </div>

      {mode === "maps" && (
        <>
          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <FileCode size={14} color="#6366f1" />
              <span style={{ fontWeight: 700, fontSize: 13, color: th, textTransform: "uppercase", letterSpacing: "0.5px" }}>How to import from Google Maps</span>
            </div>
            <ol style={{ color: ts, fontSize: 13, lineHeight: 2.1, paddingLeft: 20, margin: 0 }}>
              <li>Search for businesses on <strong style={{ color: th }}>Google Maps</strong></li>
              <li>Scroll down the <strong style={{ color: th }}>left panel</strong> to load all results</li>
              <li>Click inside the results list, then <strong style={{ color: th }}>Ctrl + A</strong> then <strong style={{ color: th }}>Ctrl + C</strong></li>
              <li>Paste below and click <strong style={{ color: th }}>Extract Businesses</strong></li>
            </ol>
            <p style={{ color: ts, fontSize: 12, margin: "10px 0 0", borderTop: `1px solid ${border}`, paddingTop: 10 }}>
              <strong style={{ color: th }}>Tip:</strong> Open DevTools, right-click a result card, <strong style={{ color: th }}>Copy outerHTML</strong> if Ctrl+A does not work.
            </p>
          </div>

          <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}>
            <textarea value={html} onChange={(e) => setHtml(e.target.value)}
              placeholder="Paste text or HTML from Google Maps results here..."
              style={{ width: "100%", height: 200, padding: 16, borderRadius: 12, border: `2px solid ${dragging ? "#6366f1" : border}`, fontFamily: "monospace", fontSize: 12, color: dark ? "#e2e8f0" : "#334155", resize: "vertical", outline: "none", background: dragging ? (dark ? "#1e293b" : "#f8f7ff") : inputBg, boxSizing: "border-box" }} />
          </div>

          {error && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={14} />{error}
            </div>
          )}
          {result && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#15803d", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} />{result.added} businesses added{result.skipped > 0 ? `, ${result.skipped} duplicates skipped` : ""}
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button onClick={handleParse} disabled={!html.trim()}
              style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontWeight: 700, fontSize: 14, cursor: html.trim() ? "pointer" : "not-allowed", opacity: html.trim() ? 1 : 0.5, display: "flex", alignItems: "center", gap: 8 }}>
              <Upload size={15} />Extract Businesses
            </button>
            {html && (
              <button onClick={() => { setHtml(""); setPreview(null); setError(""); setResult(null); }}
                style={{ background: dark ? "#1e293b" : "#f1f5f9", color: ts, border: "none", borderRadius: 10, padding: "11px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <X size={15} />Clear
              </button>
            )}
          </div>

          {preview && (
            <div style={{ marginTop: 24, background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden" }}>
              <div style={{ background: dark ? "#0f172a" : "#f0fdf4", padding: "15px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={16} color="#16a34a" />Found {preview.length} businesses
                </span>
                <button onClick={handleConfirm} disabled={loading}
                  style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Saving..." : "Add to Dashboard"}
                </button>
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {preview.slice(0, 10).map((b, i) => (
                  <div key={i} style={{ padding: "11px 20px", borderBottom: `1px solid ${dark ? "#0f172a" : "#f1f5f9"}`, display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: dark ? "#0f172a" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: ts, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: th, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: ts, marginTop: 2 }}>
                        {b.category && <span>{b.category} </span>}
                        {b.phone ? <span style={{ color: "#16a34a" }}>Phone: {b.phone}</span> : <span style={{ color: "#ef4444" }}>No phone</span>}
                        {b.email && <span style={{ color: "#6366f1" }}> | Email: {b.email}</span>}
                      </div>
                    </div>
                    {b.rating && <div style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>* {b.rating}</div>}
                  </div>
                ))}
                {preview.length > 10 && <div style={{ padding: "12px 20px", color: ts, fontSize: 13, textAlign: "center" }}>+{preview.length - 10} more...</div>}
              </div>
            </div>
          )}
        </>
      )}

      {mode === "excel" && (
        <>
          <div style={{ background: surface, borderRadius: 14, border: `1px solid ${border}`, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <FileSpreadsheet size={16} color="#6366f1" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: th }}>Download Import Template</div>
              <div style={{ fontSize: 12, color: ts, marginTop: 2 }}>Use our template for guaranteed column detection: Name, Phone, Email, Address, Category, Website, Notes</div>
            </div>
            <button onClick={generateExcelTemplate}
              style={{ background: dark ? "#1e293b" : "#f0fdf4", color: "#16a34a", border: `1px solid ${dark ? "#334155" : "#bbf7d0"}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              <Download size={13} />Download Template
            </button>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setXlDragging(true); }}
            onDragLeave={() => setXlDragging(false)}
            onDrop={handleFileDrop}
            style={{ border: `2px dashed ${xlDragging ? "#6366f1" : (dark ? "#334155" : "#c7d2fe")}`, borderRadius: 14, padding: "40px 24px", textAlign: "center", cursor: "pointer", background: xlDragging ? (dark ? "#1e293b" : "#f8f7ff") : "transparent", transition: "all 0.2s", marginBottom: 16 }}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: "none" }} />
            <FileSpreadsheet size={40} color={xlDragging ? "#6366f1" : (dark ? "#334155" : "#c7d2fe")} style={{ margin: "0 auto 12px" }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: th, marginBottom: 6 }}>
              {xlFile ? xlFile.name : "Drop your Excel or CSV file here"}
            </div>
            <div style={{ fontSize: 13, color: ts }}>
              {xlFile ? "File loaded - check preview below" : "or click to browse - .xlsx, .xls, .csv supported"}
            </div>
          </div>

          {xlError && (
            <div style={{ marginBottom: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={14} />{xlError}
            </div>
          )}
          {xlResult && (
            <div style={{ marginBottom: 12, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#15803d", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} />{xlResult.added} businesses added{xlResult.skipped > 0 ? `, ${xlResult.skipped} duplicates skipped` : ""}
            </div>
          )}

          {xlPreview && xlPreview.businesses.length > 0 && (
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ background: dark ? "#0f172a" : "#f0fdf4", padding: "14px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={15} color="#16a34a" />Found {xlPreview.businesses.length} businesses
                  </span>
                  {xlPreview.warnings.length > 0 && (
                    <div style={{ fontSize: 11, color: "#d97706", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={11} />{xlPreview.warnings[0]}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: ts, marginTop: 4 }}>
                    Detected: {Object.entries(xlPreview.detectedColumns).map(([f, idx]) => (
                      <span key={f} style={{ background: dark ? "#1e293b" : "#e0e7ff", color: "#6366f1", padding: "1px 6px", borderRadius: 4, marginRight: 4, fontWeight: 600 }}>{f}</span>
                    ))}
                  </div>
                </div>
                <button onClick={handleExcelConfirm} disabled={xlLoading}
                  style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: xlLoading ? "not-allowed" : "pointer", opacity: xlLoading ? 0.7 : 1 }}>
                  {xlLoading ? "Saving..." : "Add to Dashboard"}
                </button>
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {xlPreview.businesses.slice(0, 12).map((b, i) => (
                  <div key={i} style={{ padding: "11px 20px", borderBottom: `1px solid ${dark ? "#0f172a" : "#f1f5f9"}`, display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: dark ? "#0f172a" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: ts, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: th, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: ts, marginTop: 2 }}>
                        {b.category && <span>{b.category} </span>}
                        {b.phone ? <span style={{ color: "#16a34a" }}>Phone: {b.phone}</span> : <span>No phone</span>}
                        {b.email && <span style={{ color: "#6366f1" }}> | Email: {b.email}</span>}
                        {b.address && <span> | {b.address}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {xlPreview.businesses.length > 12 && (
                  <div style={{ padding: "12px 20px", color: ts, fontSize: 13, textAlign: "center" }}>+{xlPreview.businesses.length - 12} more...</div>
                )}
              </div>
            </div>
          )}

          {xlPreview && xlPreview.businesses.length === 0 && !xlError && (
            <div style={{ padding: "20px", textAlign: "center", color: ts, fontSize: 13 }}>
              No businesses found in file. Make sure your file has a header row with column names like Name, Phone, Email, etc.
            </div>
          )}
        </>
      )}

      <ImportHistoryPanel history={importHistory} onDeleteImport={onDeleteImport} dark={dark} />
    </div>
  );
}
