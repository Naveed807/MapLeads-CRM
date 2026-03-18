import { useState, useEffect, useCallback } from "react";
import { businessApi, importApi, templateApi } from '../services/crmApi';
import { DEFAULT_TEMPLATE, DEFAULT_EMAIL_SUBJECT, DEFAULT_EMAIL_BODY } from "../constants";
import { sendEmailViaEmailJS, openMailto } from "../utils/emailer";
import { swalConfirm, toast } from "../utils/dialog";
import { getSetting, setSetting } from "../db";

// ─── Status enum mapping (frontend uses lowercase, API uses UPPERCASE) ────────
const toApiStatus = (s) => s?.toUpperCase() ?? "NOT_CONTACTED";
const fromApiStatus = (s) => s?.toLowerCase() ?? "not_contacted";

// ─── Normalise a business row coming from the API into the shape the UI expects
function normalizeBiz(b) {
  return {
    ...b,
    contact: b.contact
      ? { ...b.contact, status: fromApiStatus(b.contact.status) }
      : null,
    tags:      (b.tags      || []).map((t) => t.tag),
    reminders: (b.reminders || []),
  };
}

export function useAppData() {
  const [businesses,     setBusinesses]       = useState([]);
  const [contacts,       setContacts]         = useState({});        // { [bizId]: contactObj }
  const [template,       setTemplateState]    = useState(DEFAULT_TEMPLATE);
  const [templates,      setTemplates]        = useState([]);
  const [tags,           setTagsState]        = useState({});        // { [bizId]: string[] }
  const [importHistory,  setImportHistory]    = useState([]);
  const [reminders,      setReminders]        = useState({});        // { [bizId]: reminderObj }
  const [darkMode,       setDarkMode]         = useState(false);
  const [countryCode,    setCountryCodeState] = useState("");
  const [emailSettings,  setEmailSettingsState] = useState({});
  const [emailSubject,   setEmailSubjectState] = useState(DEFAULT_EMAIL_SUBJECT);
  const [emailBody,      setEmailBodyState]    = useState(DEFAULT_EMAIL_BODY);
  const [selectedBizIds, setSelectedBizIds]   = useState(new Set());
  const [loaded,         setLoaded]           = useState(false);
  // total from server (for pagination-aware counts)
  const [totalCount,     setTotalCount]       = useState(0);

  // ── Derive contacts / tags / reminders maps from normalized businesses list
  function deriveMaps(bizList) {
    const contactMap   = {};
    const tagsMap      = {};
    const remindersMap = {};
    for (const b of bizList) {
      if (b.contact)  contactMap[b.id]   = b.contact;
      if (b.tags)     tagsMap[b.id]      = b.tags;
      if (b.reminders?.length) remindersMap[b.id] = b.reminders[0];
    }
    return { contactMap, tagsMap, remindersMap };
  }

  // ── Load all data on mount
  useEffect(() => {
    (async () => {
      // Load UI-only preferences from IndexedDB (no API needed for these)
      const [savedDark, savedCC, savedEmailSettings, savedEmailSubject, savedEmailBody] =
        await Promise.all([
          getSetting("darkMode",      false),
          getSetting("countryCode",   ""),
          getSetting("emailSettings", {}),
          getSetting("emailSubject",  DEFAULT_EMAIL_SUBJECT),
          getSetting("emailBody",     DEFAULT_EMAIL_BODY),
        ]);
      setDarkMode(savedDark);
      setCountryCodeState(savedCC);
      setEmailSettingsState(savedEmailSettings);
      setEmailSubjectState(savedEmailSubject);
      setEmailBodyState(savedEmailBody);

      // Load CRM data from API
      const [bizResult, history, tplList] = await Promise.all([
        businessApi.list({ page: 1, perPage: 500 }),   // load first 500 for the view
        importApi.getHistory(),
        templateApi.list(),
      ]);

      const normalizedBizs = (bizResult.businesses || []).map(normalizeBiz);
      const { contactMap, tagsMap, remindersMap } = deriveMaps(normalizedBizs);

      setBusinesses(normalizedBizs);
      setTotalCount(bizResult.total ?? normalizedBizs.length);
      setContacts(contactMap);
      setTagsState(tagsMap);
      setReminders(remindersMap);
      setImportHistory(history || []);

      // Templates — find the default whatsapp one as the active template
      setTemplates(tplList || []);
      const defaultTpl = (tplList || []).find((t) => t.isDefault && t.type === "whatsapp");
      setTemplateState(defaultTpl?.body ?? DEFAULT_TEMPLATE);

      setLoaded(true);
    })().catch((err) => {
      console.error("useAppData init error:", err);
      setLoaded(true); // still mark loaded so UI doesn't spin forever
    });
  }, []);

  // ── Helper: refresh businesses from API and re-derive maps
  const refreshBusinesses = useCallback(async () => {
    const bizResult = await businessApi.list({ page: 1, perPage: 500 });
    const normalized = (bizResult.businesses || []).map(normalizeBiz);
    const { contactMap, tagsMap, remindersMap } = deriveMaps(normalized);
    setBusinesses(normalized);
    setTotalCount(bizResult.total ?? normalized.length);
    setContacts(contactMap);
    setTagsState(tagsMap);
    setReminders(remindersMap);
  }, []);

  // ── Import
  const handleImport = useCallback(async (newBizs, source = "google_maps") => {
    const result = await importApi.importBusinesses(newBizs, source);
    const [history] = await Promise.all([
      importApi.getHistory(),
      refreshBusinesses(),
    ]);
    setImportHistory(history || []);
    return { added: result.added, skipped: result.skipped };
  }, [refreshBusinesses]);

  const handleDeleteImport = useCallback(async (historyId) => {
    const ok = await swalConfirm({
      title:       "Delete import batch?",
      text:        "This will remove the batch and all its businesses. This cannot be undone.",
      type:        "danger",
      confirmText: "Yes, delete it",
    });
    if (!ok) return;
    await importApi.deleteBatch(historyId);
    const [history] = await Promise.all([importApi.getHistory(), refreshBusinesses()]);
    setImportHistory(history || []);
    setSelectedBizIds(new Set());
    toast.success("Import batch deleted.");
  }, [refreshBusinesses]);

  // ── Status / note
  const handleStatusChange = useCallback(async (bizId, status) => {
    await businessApi.updateStatus(bizId, toApiStatus(status));
    await refreshBusinesses();
  }, [refreshBusinesses]);

  const handleNoteChange = useCallback(async (bizId, note) => {
    await businessApi.updateNote(bizId, note);
    await refreshBusinesses();
  }, [refreshBusinesses]);

  // ── Templates
  const handleTemplateSave = useCallback(async (body) => {
    setTemplateState(body);
    // Persist as default whatsapp template on the server
    const existing = templates.find((t) => t.isDefault && t.type === "whatsapp");
    if (existing) {
      await templateApi.update(existing.id, { body });
    } else {
      await templateApi.create({ name: "Default", body, type: "whatsapp", isDefault: true });
      setTemplates(await templateApi.list());
    }
  }, [templates]);

  const handleSaveNamedTemplate = useCallback(async (name, body) => {
    const saved = await templateApi.create({ name, body, type: "whatsapp" });
    setTemplates(await templateApi.list());
    return saved;
  }, []);

  const handleDeleteTemplate = useCallback(async (id) => {
    await templateApi.delete(id);
    setTemplates(await templateApi.list());
  }, []);

  const handleUseTemplate = useCallback(async (body) => {
    setTemplateState(body);
  }, []);

  // ── Tags  (optimistic local update + server sync)
  const handleSetTags = useCallback(async (bizId, tagList) => {
    await businessApi.updateTags(bizId, tagList);
    setTagsState((prev) => ({ ...prev, [bizId]: tagList }));
  }, []);

  // ── Reminders — stored in IndexedDB locally (no API yet for reminders)
  const { setReminder: idbSetReminder, deleteReminder: idbDeleteReminder } = (() => {
    // lazy-import to avoid breaking if IDB not initialised yet
    const mod = require("../db");
    return { setReminder: mod.setReminder, deleteReminder: mod.deleteReminder };
  })();

  const handleSetReminder = useCallback(async (bizId, dueDate, note) => {
    await idbSetReminder(bizId, dueDate, note);
    const { getAllReminders } = require("../db");
    setReminders(await getAllReminders());
  }, [idbSetReminder]);

  const handleDeleteReminder = useCallback(async (bizId) => {
    await idbDeleteReminder(bizId);
    const { getAllReminders } = require("../db");
    setReminders(await getAllReminders());
  }, [idbDeleteReminder]);

  // ── Bulk actions
  const handleBulkStatusChange = useCallback(async (ids, status) => {
    await businessApi.bulkUpdateStatus([...ids], toApiStatus(status));
    await refreshBusinesses();
    setSelectedBizIds(new Set());
  }, [refreshBusinesses]);

  const handleBulkDelete = useCallback(async (ids) => {
    const ok = await swalConfirm({
      title:       `Delete ${ids.size} business${ids.size === 1 ? "" : "es"}?`,
      text:        "This cannot be undone.",
      type:        "danger",
      confirmText: "Yes, delete",
    });
    if (!ok) return;
    await businessApi.bulkDelete([...ids]);
    await refreshBusinesses();
    setSelectedBizIds(new Set());
    toast.success(`${ids.size} business${ids.size === 1 ? "" : "es"} deleted.`);
  }, [refreshBusinesses]);

  const toggleSelectBiz = useCallback((id) => {
    setSelectedBizIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const selectAllBiz  = useCallback((ids) => setSelectedBizIds(new Set(ids)), []);
  const clearSelection = useCallback(() => setSelectedBizIds(new Set()), []);

  // ── Dark mode & country code (local preferences — still in IndexedDB)
  const toggleDarkMode = useCallback(async () => {
    const next = !darkMode;
    await setSetting("darkMode", next);
    setDarkMode(next);
  }, [darkMode]);

  const handleCountryCodeChange = useCallback(async (cc) => {
    await setSetting("countryCode", cc);
    setCountryCodeState(cc);
  }, []);

  // ── Email settings
  const handleSaveEmailSettings = useCallback(async (settings) => {
    const { subject, body, ...creds } = settings;
    // Persist credentials in IndexedDB (local — not sent to server for security)
    await Promise.all([
      setSetting("emailSettings", creds),
      setSetting("emailSubject",  subject),
      setSetting("emailBody",     body),
    ]);
    setEmailSettingsState(creds);
    setEmailSubjectState(subject);
    setEmailBodyState(body);
  }, []);

  const handleSendEmail = useCallback(async (biz) => {
    if (!biz.email) return { ok: false, error: "No email address for this business." };
    const creds = emailSettings;
    if (creds.serviceId && creds.templateId && creds.publicKey) {
      const result = await sendEmailViaEmailJS(creds, biz, emailSubject, emailBody);
      if (result.ok) {
        await businessApi.updateStatus(biz.id, "CONTACTED");
        await refreshBusinesses();
      }
      return result;
    }
    // Fallback: mailto
    openMailto(biz, emailSubject, emailBody, creds.fromName || "");
    await businessApi.updateStatus(biz.id, "CONTACTED");
    await refreshBusinesses();
    return { ok: true, mailto: true };
  }, [emailSettings, emailSubject, emailBody, refreshBusinesses]);

  // ── Clear all
  const handleClearAll = useCallback(async () => {
    const ok = await swalConfirm({
      title:       "Clear everything?",
      text:        "This will remove ALL businesses and contact history. This cannot be undone.",
      type:        "danger",
      confirmText: "Yes, clear all",
    });
    if (!ok) return;
    await businessApi.clearAll();
    setBusinesses([]);
    setContacts({});
    setTagsState({});
    setReminders({});
    setSelectedBizIds(new Set());
    setTotalCount(0);
    toast.success("All data cleared.");
  }, []);

  const stats = {
    total:           businesses.length,
    withPhone:       businesses.filter((b) => b.phone).length,
    contacted:       Object.values(contacts).filter((c) => c.status && c.status !== "not_contacted").length,
    replied:         Object.values(contacts).filter((c) => c.status === "replied").length,
    converted:       Object.values(contacts).filter((c) => c.status === "converted").length,
    not_interested:  Object.values(contacts).filter((c) => c.status === "not_interested").length,
    not_on_whatsapp: Object.values(contacts).filter((c) => c.status === "not_on_whatsapp").length,
  };

  return {
    loaded, businesses, contacts, template, templates,
    tags, importHistory, reminders, darkMode, countryCode,
    emailSettings, emailSubject, emailBody,
    selectedBizIds, stats, totalCount,
    handleImport, handleDeleteImport, handleStatusChange, handleNoteChange,
    handleTemplateSave, handleSaveNamedTemplate, handleDeleteTemplate, handleUseTemplate,
    handleSetTags, handleSetReminder, handleDeleteReminder,
    handleBulkStatusChange, handleBulkDelete,
    toggleSelectBiz, selectAllBiz, clearSelection,
    toggleDarkMode, handleCountryCodeChange, handleClearAll,
    handleSaveEmailSettings, handleSendEmail,
  };
}
