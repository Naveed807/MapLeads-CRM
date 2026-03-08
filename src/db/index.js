import { openDB } from "idb";

const DB_NAME = "mapleads-crm";
const DB_VERSION = 2;          // bumped for v2 stores

let dbPromise = null;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // ── v1 stores ──────────────────────────────────────────────────
        if (oldVersion < 1) {
          db.createObjectStore("businesses", { keyPath: "id" });
          db.createObjectStore("contacts",   { keyPath: "bizId" });
          db.createObjectStore("settings",   { keyPath: "key" });
        }
        // ── v2 stores ──────────────────────────────────────────────────
        if (oldVersion < 2) {
          // named message templates
          if (!db.objectStoreNames.contains("templates")) {
            const ts = db.createObjectStore("templates", { keyPath: "id" });
            ts.createIndex("createdAt", "createdAt");
          }
          // free-form tags per business
          if (!db.objectStoreNames.contains("tags")) {
            db.createObjectStore("tags", { keyPath: "bizId" });
          }
          // import batch history
          if (!db.objectStoreNames.contains("import_history")) {
            const ih = db.createObjectStore("import_history", { keyPath: "id", autoIncrement: true });
            ih.createIndex("importedAt", "importedAt");
          }
          // follow-up reminders
          if (!db.objectStoreNames.contains("reminders")) {
            const rm = db.createObjectStore("reminders", { keyPath: "bizId" });
            rm.createIndex("dueDate", "dueDate");
          }
        }
      },
    });
  }
  return dbPromise;
}

// ─── Businesses ─────────────────────────────────────────────────────────────

export async function getAllBusinesses() {
  try {
    const db = await initDB();
    return await db.getAll("businesses");
  } catch (err) {
    console.error("getAllBusinesses:", err);
    return [];
  }
}

/**
 * Add a list of businesses, skipping duplicates (matched by name + phone).
 * Returns { added, skipped }.
 */
export async function addBusinesses(list, batchId) {
  const importedAt = batchId || new Date().toISOString();
  try {
    const db = await initDB();
    const existing = await db.getAll("businesses");
    const tx = db.transaction("businesses", "readwrite");
    let added = 0;
    let skipped = 0;

    for (const biz of list) {
      const isDuplicate = existing.some((e) => {
        if (e.name !== biz.name) return false;
        // If both have phones, match on phone
        if (biz.phone && e.phone) return biz.phone === e.phone;
        // If both have emails (and no phone matched), match on email
        if (biz.email && e.email) return biz.email === e.email;
        // Same name, no identifying field to distinguish → treat as duplicate
        return true;
      });
      if (isDuplicate) {
        skipped++;
        continue;
      }
      await tx.store.put({ ...biz, importedAt, importBatchId: importedAt });
      existing.push(biz);
      added++;
    }

    await tx.done;
    return { added, skipped };
  } catch (err) {
    console.error("addBusinesses:", err);
    return { added: 0, skipped: list.length };
  }
}

export async function clearBusinesses() {
  try {
    const db = await initDB();
    await db.clear("businesses");
  } catch (err) {
    console.error("clearBusinesses:", err);
  }
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function getAllContacts() {
  try {
    const db = await initDB();
    const rows = await db.getAll("contacts");
    // Return as a keyed object for O(1) lookup: { [bizId]: contact }
    return Object.fromEntries(rows.map((r) => [r.bizId, r]));
  } catch (err) {
    console.error("getAllContacts:", err);
    return {};
  }
}

export async function setContactStatus(bizId, status, existingContact = null) {
  try {
    const db = await initDB();
    const current = existingContact || (await db.get("contacts", bizId)) || {};
    const isFirstContact =
      status === "contacted" && !current.date;
    await db.put("contacts", {
      ...current,
      bizId,
      status,
      date: isFirstContact ? new Date().toISOString() : current.date || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("setContactStatus:", err);
  }
}

export async function setContactNote(bizId, note, existingContact = null) {
  try {
    const db = await initDB();
    const current = existingContact || (await db.get("contacts", bizId)) || {};
    await db.put("contacts", {
      ...current,
      bizId,
      note,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("setContactNote:", err);
  }
}

export async function clearContacts() {
  try {
    const db = await initDB();
    await db.clear("contacts");
  } catch (err) {
    console.error("clearContacts:", err);
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSetting(key, fallback = null) {
  try {
    const db = await initDB();
    const row = await db.get("settings", key);
    return row ? row.value : fallback;
  } catch (err) {
    console.error("getSetting:", err);
    return fallback;
  }
}

export async function setSetting(key, value) {
  try {
    const db = await initDB();
    await db.put("settings", { key, value });
  } catch (err) {
    console.error("setSetting:", err);
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getAllTemplates() {
  try {
    const db = await initDB();
    return await db.getAll("templates");
  } catch (err) {
    console.error("getAllTemplates:", err);
    return [];
  }
}

export async function saveTemplate(tpl) {
  try {
    const db = await initDB();
    const record = {
      ...tpl,
      id: tpl.id || `tpl-${Date.now()}`,
      createdAt: tpl.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.put("templates", record);
    return record;
  } catch (err) {
    console.error("saveTemplate:", err);
    return tpl;
  }
}

export async function deleteTemplate(id) {
  try {
    const db = await initDB();
    await db.delete("templates", id);
  } catch (err) {
    console.error("deleteTemplate:", err);
  }
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getAllTags() {
  try {
    const db = await initDB();
    const rows = await db.getAll("tags");
    return Object.fromEntries(rows.map((r) => [r.bizId, r.tags || []]));
  } catch (err) {
    console.error("getAllTags:", err);
    return {};
  }
}

export async function setTags(bizId, tags) {
  try {
    const db = await initDB();
    await db.put("tags", { bizId, tags, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("setTags:", err);
  }
}

// ─── Import History ───────────────────────────────────────────────────────────

export async function getImportHistory() {
  try {
    const db = await initDB();
    const rows = await db.getAll("import_history");
    return rows.sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt));
  } catch (err) {
    console.error("getImportHistory:", err);
    return [];
  }
}

export async function addImportHistoryEntry(entry) {
  try {
    const db = await initDB();
    await db.add("import_history", {
      ...entry,
      importedAt: entry.batchId || new Date().toISOString(),
    });
  } catch (err) {
    console.error("addImportHistoryEntry:", err);
  }
}

export async function deleteImportBatch(historyId) {
  try {
    const db = await initDB();
    const entry = await db.get("import_history", historyId);
    const batchId = entry?.batchId;

    // Delete all businesses that belong to this batch
    if (batchId) {
      const allBizs = await db.getAll("businesses");
      const batchBizIds = allBizs
        .filter((b) => b.importBatchId === batchId)
        .map((b) => b.id);

      if (batchBizIds.length > 0) {
        const tx = db.transaction(
          ["businesses", "contacts", "tags", "reminders"],
          "readwrite"
        );
        await Promise.all([
          ...batchBizIds.map((id) => tx.objectStore("businesses").delete(id)),
          ...batchBizIds.map((id) => tx.objectStore("contacts").delete(id)),
          ...batchBizIds.map((id) => tx.objectStore("tags").delete(id)),
          ...batchBizIds.map((id) => tx.objectStore("reminders").delete(id)),
        ]);
        await tx.done;
      }
    }

    // Delete the history entry itself
    await db.delete("import_history", historyId);
  } catch (err) {
    console.error("deleteImportBatch:", err);
  }
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export async function getAllReminders() {
  try {
    const db = await initDB();
    const rows = await db.getAll("reminders");
    return Object.fromEntries(rows.map((r) => [r.bizId, r]));
  } catch (err) {
    console.error("getAllReminders:", err);
    return {};
  }
}

export async function setReminder(bizId, dueDate, note) {
  try {
    const db = await initDB();
    await db.put("reminders", {
      bizId,
      dueDate,
      note: note || "",
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("setReminder:", err);
  }
}

export async function deleteReminder(bizId) {
  try {
    const db = await initDB();
    await db.delete("reminders", bizId);
  } catch (err) {
    console.error("deleteReminder:", err);
  }
}
