import { useState, useEffect } from "react";
import Badge from "./Badge";
import { STATUS_CONFIG } from "../constants";
import { buildWhatsAppLink } from "../utils/whatsapp";
import { toast } from "../utils/dialog";
import { businessApi } from "../services/crmApi";
import {
  MessageCircle, Map, Tag, Bell, BellOff,
  ChevronDown, ChevronUp, Globe, MapPin, Clock,
  CalendarClock, ExternalLink, Mail, UserCircle, History,
} from "lucide-react";

function TagInput({ tags, onChange, dark }) {
  const [input, setInput] = useState("");
  const th = dark ? "#e2e8f0" : "#334155";
  const border = dark ? "#334155" : "#e2e8f0";
  const surface = dark ? "#1e293b" : "#fff";

  function addTag(e) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) onChange([...tags, input.trim()]);
      setInput("");
    }
  }
  function removeTag(t) { onChange(tags.filter((x) => x !== t)); }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: "6px 10px", border: `1px solid ${border}`, borderRadius: 8, background: surface, minHeight: 36 }}>
      {tags.map((t) => (
        <span key={t} style={{ background: "#6366f120", color: "#6366f1", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          {t}
          <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", padding: 0, lineHeight: 1, fontSize: 13 }}>×</button>
        </span>
      ))}
      <input
        value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={addTag}
        placeholder={tags.length ? "" : "Add tag, press Enter…"}
        style={{ border: "none", outline: "none", fontSize: 12, color: th, background: "transparent", minWidth: 80, flex: 1 }}
      />
    </div>
  );
}

export default function BusinessRow({
  biz, contact, template, countryCode,
  onStatusChange, onNoteChange, onTagsChange, onSetReminder, onDeleteReminder,
  onSendEmail,
  bizTags, reminder, isExpanded, onToggle, isSelected, onToggleSelect,
  teamMembers, orgRole, onAssign,
  dark,
}) {
  const waLink = biz.phone ? buildWhatsAppLink(biz.phone, template, biz, countryCode) : null;
  const status = contact?.status || "not_contacted";
  const [note, setNote]               = useState(contact?.note || "");
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(reminder?.dueDate?.slice(0,10) || "");
  const [reminderNote, setReminderNote] = useState(reminder?.note || "");
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus,  setEmailStatus]  = useState(null);
  const [assignee,     setAssignee]     = useState(undefined); // undefined = not loaded
  const [logs,         setLogs]         = useState(null);      // null = not loaded
  const [assigning,    setAssigning]    = useState(false);

  const canManage = ['OWNER', 'ADMIN', 'MANAGER', 'TEAM_LEAD'].includes(orgRole);

  // Load assignee + logs lazily when row is expanded (managerial roles only)
  useEffect(() => {
    if (!isExpanded || !canManage) return;
    businessApi.getAssignee(biz.id)
      .then(data => setAssignee(data))
      .catch(() => setAssignee(null));
    businessApi.getContactLogs(biz.id)
      .then(data => setLogs(data || []))
      .catch(() => setLogs([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  async function handleAssignChange(memberId) {
    setAssigning(true);
    try {
      await onAssign(biz.id, memberId || null);
      const updated = await businessApi.getAssignee(biz.id);
      setAssignee(updated);
      const updatedLogs = await businessApi.getContactLogs(biz.id);
      setLogs(updatedLogs || []);
      toast.success(memberId ? "Lead assigned." : "Lead unassigned.");
    } catch {
      toast.error("Failed to update assignee.");
    } finally {
      setAssigning(false);
    }
  }

  const th = dark ? "#e2e8f0" : "#0f172a";
  const ts = dark ? "#94a3b8" : "#94a3b8";
  const surface  = dark ? "#1e293b" : "#fff";
  const surface2 = dark ? "#0f172a" : "#fafafa";
  const border   = dark ? "#334155" : "#f0f0f0";
  const border2  = dark ? "#1e293b" : "#f1f5f9";

  function handleWhatsApp() {
    if (!waLink) return;
    onStatusChange(biz.id, "contacted");
    window.open(waLink, "_blank");
  }
  function handleNoteBlur() { onNoteChange(biz.id, note); }
  function handleSaveReminder() {
    if (reminderDate) onSetReminder(biz.id, reminderDate, reminderNote);
    setShowReminder(false);
  }
  async function handleSendEmailClick() {
    if (emailSending || !biz.email || !onSendEmail) return;
    setEmailSending(true);
    setEmailStatus(null);
    const result = await onSendEmail(biz);
    setEmailSending(false);
    setEmailStatus(result);
    setTimeout(() => setEmailStatus(null), 6000);
    if (result.ok) {
      toast.success(result.mailto ? "Mail client opened." : "Email sent successfully!");
    } else {
      toast.error(result.error || "Failed to send email.");
    }
  }

  const reminderDue   = reminder?.dueDate
    ? new Date(reminder.dueDate) < new Date() ? "overdue" : "upcoming"
    : null;

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden", background: surface, marginBottom: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      {/* Row Header */}
      <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(biz.id)}
          style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#6366f1", flexShrink: 0 }} />
        <div onClick={onToggle} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: th }}>{biz.name}</span>
            {biz.rating && <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>★ {biz.rating} ({biz.reviews})</span>}
            {(bizTags || []).map((t) => (
              <span key={t} style={{ background: "#6366f115", color: "#6366f1", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 600 }}>{t}</span>
            ))}
            {reminder && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: reminderDue === "overdue" ? "#fee2e2" : "#fef3c7", color: reminderDue === "overdue" ? "#dc2626" : "#d97706" }}>
                {reminderDue === "overdue" ? "⚠ Overdue" : "⏰ " + new Date(reminder.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: ts, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {biz.category && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Tag size={11} />{biz.category}</span>}
            {biz.phone && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MessageCircle size={11} />{biz.phone}</span>}
            {biz.email && <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#6366f1" }}><Mail size={11} />{biz.email}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Badge status={status} />
          {contact?.date && <span style={{ fontSize: 11, color: ts }}>{new Date(contact.date).toLocaleDateString()}</span>}
          <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", color: ts, padding: 4, display: "flex" }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${border2}`, padding: 16, background: surface2 }}>
          {/* Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {biz.address && <div style={{ fontSize: 12, color: ts, display: "flex", gap: 5, alignItems: "flex-start" }}><MapPin size={12} style={{ flexShrink: 0, marginTop: 1 }} />{biz.address}</div>}
            {biz.hours   && <div style={{ fontSize: 12, color: ts, display: "flex", gap: 5, alignItems: "flex-start" }}><Clock size={12} style={{ flexShrink: 0, marginTop: 1 }} />{biz.hours}</div>}
            {biz.website && <div style={{ fontSize: 12, color: ts, display: "flex", gap: 5, alignItems: "center" }}><Globe size={12} style={{ flexShrink: 0 }} /><a href={biz.website} target="_blank" rel="noreferrer" style={{ color: "#6366f1", wordBreak: "break-all" }}>{biz.website}</a></div>}
            {biz.importedAt && <div style={{ fontSize: 12, color: ts, display: "flex", gap: 5, alignItems: "center" }}><CalendarClock size={12} />{new Date(biz.importedAt).toLocaleDateString()}</div>}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <button onClick={handleWhatsApp} disabled={!waLink}
              style={{ background: waLink ? "#25d366" : "#e2e8f0", color: waLink ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: waLink ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6 }}>
              <MessageCircle size={15} />{waLink ? "Message on WhatsApp" : "No Phone Number"}
            </button>
            {biz.mapsUrl && (
              <a href={biz.mapsUrl} target="_blank" rel="noreferrer"
                style={{ background: dark ? "#1e293b" : "#f1f5f9", color: dark ? "#e2e8f0" : "#4b5563", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <Map size={14} />View on Maps<ExternalLink size={11} />
              </a>
            )}
            <button onClick={() => setShowReminder(!showReminder)}
              style={{ background: dark ? "#1e293b" : "#f1f5f9", color: reminder ? "#f59e0b" : (dark ? "#94a3b8" : "#64748b"), border: `1px solid ${reminder ? "#f59e0b40" : (dark ? "#334155" : "#e2e8f0")}`, borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Bell size={14} />{reminder ? "Edit Reminder" : "Set Reminder"}
            </button>
            {reminder && (
              <button onClick={() => onDeleteReminder(biz.id)}
                style={{ background: "none", border: "1px solid #fecaca", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <BellOff size={13} />Remove
              </button>
            )}
            <button
              onClick={handleSendEmailClick}
              disabled={!biz.email || emailSending}
              title={biz.email ? `Send email to ${biz.email}` : "No email address"}
              style={{ background: emailSending ? "#818cf8" : (biz.email ? "#6366f1" : (dark ? "#1e293b" : "#e2e8f0")), color: biz.email ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: (biz.email && !emailSending) ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}>
              <Mail size={14} />{emailSending ? "Sending\u2026" : (biz.email ? "Send Email" : "No Email")}
            </button>
          </div>

          {/* Reminder mini-form */}
          {showReminder && (
            <div style={{ background: dark ? "#0f172a" : "#fff", border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`, borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 4 }}>Follow-up Date</label>
                <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`, fontSize: 13, color: dark ? "#e2e8f0" : "#334155", background: dark ? "#1e293b" : "#fafafa", outline: "none" }} />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "block", marginBottom: 4 }}>Note (optional)</label>
                <input value={reminderNote} onChange={(e) => setReminderNote(e.target.value)} placeholder="e.g. call back after proposal"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`, fontSize: 13, color: dark ? "#e2e8f0" : "#334155", background: dark ? "#1e293b" : "#fafafa", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={handleSaveReminder} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Bell size={13} />Save
              </button>
            </div>
          )}

          {/* Email send status feedback */}
          {emailStatus && (
            <div style={{ marginBottom: 10, padding: "9px 14px", borderRadius: 8, border: `1px solid ${emailStatus.ok ? "#bbf7d0" : "#fecaca"}`, background: emailStatus.ok ? "#f0fdf4" : "#fef2f2", color: emailStatus.ok ? "#15803d" : "#dc2626", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={13} />{emailStatus.ok ? (emailStatus.mailto ? "Mail client opened." : "Email sent successfully!") : (emailStatus.error || "Failed to send email.")}
            </div>
          )}

          {/* Status buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: ts }}>Status:</span>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => onStatusChange(biz.id, key)}
                style={{ background: status === key ? cfg.bg : (dark ? "#1e293b" : "#f8fafc"), color: status === key ? cfg.color : ts, border: `1px solid ${status === key ? cfg.color + "40" : (dark ? "#334155" : "#e2e8f0")}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}><Tag size={11} />Tags</label>
            <TagInput tags={bizTags || []} onChange={(t) => onTagsChange(biz.id, t)} dark={dark} />
          </div>

          {/* Notes */}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={handleNoteBlur}
            placeholder="Add notes about this business..."
            style={{ width: "100%", height: 70, padding: 10, borderRadius: 8, border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`, fontSize: 12, color: dark ? "#e2e8f0" : "#334155", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: dark ? "#1e293b" : "#fff" }}
          />

          {/* Assignee (managerial roles only) */}
          {canManage && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${dark ? "#1e293b" : "#f1f5f9"}`, paddingTop: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <UserCircle size={11} />Assigned To
              </label>
              {teamMembers && teamMembers.length > 0 ? (
                <select
                  value={assignee?.memberId || ""}
                  onChange={(e) => handleAssignChange(e.target.value)}
                  disabled={assigning}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`, fontSize: 12, color: dark ? "#e2e8f0" : "#334155", background: dark ? "#1e293b" : "#fff", outline: "none", opacity: assigning ? 0.6 : 1 }}
                >
                  <option value="">— Unassigned —</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.user?.name} ({m.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: 11, color: ts, fontStyle: "italic" }}>
                  {assignee === undefined ? "Loading…" : assignee ? assignee.member?.user?.name : "Unassigned"}
                </div>
              )}
            </div>
          )}

          {/* Contact History (managerial roles only) */}
          {canManage && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${dark ? "#1e293b" : "#f1f5f9"}`, paddingTop: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: ts, display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                <History size={11} />Contact History
              </label>
              {logs === null ? (
                <div style={{ fontSize: 11, color: ts }}>Loading…</div>
              ) : logs.length === 0 ? (
                <div style={{ fontSize: 11, color: ts, fontStyle: "italic" }}>No activity yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto" }}>
                  {logs.map(log => (
                    <div key={log.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 10px", borderRadius: 7, background: dark ? "#0f172a" : "#f8fafc" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: log.action === "status_changed" ? "#6366f1" : "#f59e0b", marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: th }}>{log.detail || log.action}</div>
                        <div style={{ fontSize: 10, color: ts }}>
                          {log.user ? log.user.name : "System"} · {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
