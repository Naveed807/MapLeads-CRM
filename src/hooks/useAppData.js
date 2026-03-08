import { useState, useEffect, useCallback } from "react";
import {
  initDB,
  getAllBusinesses,
  addBusinesses,
  clearBusinesses,
  getAllContacts,
  setContactStatus,
  setContactNote,
  clearContacts,
  getSetting,
  setSetting,
  getAllTemplates,
  saveTemplate,
  deleteTemplate,
  getAllTags,
  setTags,
  getImportHistory,
  addImportHistoryEntry,
  getAllReminders,
  setReminder,
  deleteReminder,
  deleteImportBatch,
} from "../db";
import { DEFAULT_TEMPLATE, DEFAULT_EMAIL_SUBJECT, DEFAULT_EMAIL_BODY } from "../constants";
import { sendEmailViaEmailJS, openMailto, buildEmailBody } from "../utils/emailer";

export function useAppData() {
  const [businesses,     setBusinesses]       = useState([]);
  const [contacts,       setContacts]         = useState({});
  const [template,       setTemplateState]    = useState(DEFAULT_TEMPLATE);
  const [templates,      setTemplates]        = useState([]);
  const [tags,           setTagsState]        = useState({});
  const [importHistory,  setImportHistory]    = useState([]);
  const [reminders,      setReminders]        = useState({});
  const [darkMode,       setDarkMode]         = useState(false);
  const [countryCode,    setCountryCodeState] = useState("");
  const [emailSettings,  setEmailSettingsState] = useState({});
  const [emailSubject,   setEmailSubjectState] = useState(DEFAULT_EMAIL_SUBJECT);
  const [emailBody,      setEmailBodyState]    = useState(DEFAULT_EMAIL_BODY);
  const [selectedBizIds, setSelectedBizIds]   = useState(new Set());
  const [loaded,         setLoaded]           = useState(false);

  useEffect(() => {
    (async () => {
      await initDB();
      const [
        bizList, contactMap, savedTemplate,
        tplList, tagsMap, history, remindersMap,
        savedDark, savedCC,
      ] = await Promise.all([
        getAllBusinesses(),
        getAllContacts(),
        getSetting("template", DEFAULT_TEMPLATE),
        getAllTemplates(),
        getAllTags(),
        getImportHistory(),
        getAllReminders(),
        getSetting("darkMode", false),
        getSetting("countryCode", ""),
      ]);
      setBusinesses(bizList);
      setContacts(contactMap);
      setTemplateState(savedTemplate);
      setTemplates(tplList);
      setTagsState(tagsMap);
      setImportHistory(history);
      setReminders(remindersMap);
      setDarkMode(savedDark);
      setCountryCodeState(savedCC);

      // Load email settings
      const [savedEmailSettings, savedEmailSubject, savedEmailBody] = await Promise.all([
        getSetting("emailSettings", {}),
        getSetting("emailSubject", DEFAULT_EMAIL_SUBJECT),
        getSetting("emailBody", DEFAULT_EMAIL_BODY),
      ]);
      setEmailSettingsState(savedEmailSettings);
      setEmailSubjectState(savedEmailSubject);
      setEmailBodyState(savedEmailBody);

      setLoaded(true);
    })();
  }, []);

  const handleImport = useCallback(async (newBizs) => {
    const batchId = new Date().toISOString();
    const { added, skipped } = await addBusinesses(newBizs, batchId);
    await addImportHistoryEntry({ added, skipped, total: newBizs.length, batchId });
    const [updatedList, history] = await Promise.all([getAllBusinesses(), getImportHistory()]);
    setBusinesses(updatedList);
    setImportHistory(history);
    return { added, skipped };
  }, []);

  const handleDeleteImport = useCallback(async (historyId) => {
    if (!window.confirm("Delete this import batch and all its businesses? This cannot be undone.")) return;
    await deleteImportBatch(historyId);
    const [bizList, contactMap, tagsMap, remindersMap, history] = await Promise.all([
      getAllBusinesses(), getAllContacts(), getAllTags(), getAllReminders(), getImportHistory(),
    ]);
    setBusinesses(bizList);
    setContacts(contactMap);
    setTagsState(tagsMap);
    setReminders(remindersMap);
    setImportHistory(history);
    setSelectedBizIds(new Set());
  }, []);

  const handleStatusChange = useCallback(async (bizId, status) => {
    await setContactStatus(bizId, status, contacts[bizId] || null);
    setContacts(await getAllContacts());
  }, [contacts]);

  const handleNoteChange = useCallback(async (bizId, note) => {
    await setContactNote(bizId, note, contacts[bizId] || null);
    setContacts(await getAllContacts());
  }, [contacts]);

  const handleTemplateSave = useCallback(async (t) => {
    await setSetting("template", t);
    setTemplateState(t);
  }, []);

  const handleSaveNamedTemplate = useCallback(async (name, body) => {
    const saved = await saveTemplate({ name, body });
    setTemplates(await getAllTemplates());
    return saved;
  }, []);

  const handleDeleteTemplate = useCallback(async (id) => {
    await deleteTemplate(id);
    setTemplates(await getAllTemplates());
  }, []);

  const handleUseTemplate = useCallback(async (body) => {
    await setSetting("template", body);
    setTemplateState(body);
  }, []);

  const handleSetTags = useCallback(async (bizId, tagList) => {
    await setTags(bizId, tagList);
    setTagsState(await getAllTags());
  }, []);

  const handleSetReminder = useCallback(async (bizId, dueDate, note) => {
    await setReminder(bizId, dueDate, note);
    setReminders(await getAllReminders());
  }, []);

  const handleDeleteReminder = useCallback(async (bizId) => {
    await deleteReminder(bizId);
    setReminders(await getAllReminders());
  }, []);

  const handleBulkStatusChange = useCallback(async (ids, status) => {
    await Promise.all([...ids].map((id) => setContactStatus(id, status, contacts[id] || null)));
    setContacts(await getAllContacts());
    setSelectedBizIds(new Set());
  }, [contacts]);

  const handleBulkDelete = useCallback(async (ids) => {
    if (!window.confirm(`Delete ${ids.size} selected businesses? This cannot be undone.`)) return;
    const db = await initDB();
    const tx = db.transaction(["businesses", "contacts", "tags", "reminders"], "readwrite");
    await Promise.all([
      ...[...ids].map((id) => tx.objectStore("businesses").delete(id)),
      ...[...ids].map((id) => tx.objectStore("contacts").delete(id)),
      ...[...ids].map((id) => tx.objectStore("tags").delete(id)),
      ...[...ids].map((id) => tx.objectStore("reminders").delete(id)),
    ]);
    await tx.done;
    const [bizList, contactMap, tagsMap, remindersMap] = await Promise.all([
      getAllBusinesses(), getAllContacts(), getAllTags(), getAllReminders(),
    ]);
    setBusinesses(bizList);
    setContacts(contactMap);
    setTagsState(tagsMap);
    setReminders(remindersMap);
    setSelectedBizIds(new Set());
  }, []);

  const toggleSelectBiz  = useCallback((id) => {
    setSelectedBizIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const selectAllBiz     = useCallback((ids) => setSelectedBizIds(new Set(ids)), []);
  const clearSelection   = useCallback(() => setSelectedBizIds(new Set()), []);

  const toggleDarkMode = useCallback(async () => {
    const next = !darkMode;
    await setSetting("darkMode", next);
    setDarkMode(next);
  }, [darkMode]);

  const handleCountryCodeChange = useCallback(async (cc) => {
    await setSetting("countryCode", cc);
    setCountryCodeState(cc);
  }, []);

  const handleSaveEmailSettings = useCallback(async (settings) => {
    const { subject, body, ...creds } = settings;
    await Promise.all([
      setSetting("emailSettings", creds),
      setSetting("emailSubject",   subject),
      setSetting("emailBody",      body),
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
        await setContactStatus(biz.id, "contacted", contacts[biz.id] || null);
        setContacts(await getAllContacts());
      }
      return result;
    }
    // Fallback: mailto:
    openMailto(biz, emailSubject, emailBody, creds.fromName || "");
    await setContactStatus(biz.id, "contacted", contacts[biz.id] || null);
    setContacts(await getAllContacts());
    return { ok: true, mailto: true };
  }, [emailSettings, emailSubject, emailBody, contacts]);

  const handleClearAll = useCallback(async () => {
    if (!window.confirm("Clear ALL businesses and contact history? This cannot be undone.")) return;
    await Promise.all([clearBusinesses(), clearContacts()]);
    setBusinesses([]);
    setContacts({});
    setSelectedBizIds(new Set());
  }, []);

  const stats = {
    total:            businesses.length,
    withPhone:        businesses.filter((b) => b.phone).length,
    contacted:        Object.values(contacts).filter((c) => c.status && c.status !== "not_contacted").length,
    replied:          Object.values(contacts).filter((c) => c.status === "replied").length,
    converted:        Object.values(contacts).filter((c) => c.status === "converted").length,
    not_interested:   Object.values(contacts).filter((c) => c.status === "not_interested").length,
    not_on_whatsapp:  Object.values(contacts).filter((c) => c.status === "not_on_whatsapp").length,
  };

  return {
    loaded, businesses, contacts, template, templates,
    tags, importHistory, reminders, darkMode, countryCode,
    emailSettings, emailSubject, emailBody,
    selectedBizIds, stats,
    handleImport, handleDeleteImport, handleStatusChange, handleNoteChange,
    handleTemplateSave, handleSaveNamedTemplate, handleDeleteTemplate, handleUseTemplate,
    handleSetTags, handleSetReminder, handleDeleteReminder,
    handleBulkStatusChange, handleBulkDelete,
    toggleSelectBiz, selectAllBiz, clearSelection,
    toggleDarkMode, handleCountryCodeChange, handleClearAll,
    handleSaveEmailSettings, handleSendEmail,
  };
}
