/**
 * Strips spaces, dashes, parentheses and leading '+' from a phone string.
 * If countryCode is provided and the number doesn't already start with it,
 * the code is prepended.
 */
export function formatPhone(raw, countryCode = "") {
  if (!raw) return "";
  let cleaned = String(raw).replace(/[\s\-()]/g, "").replace(/^\+/, "");
  if (countryCode && !cleaned.startsWith(countryCode)) {
    // strip a leading 0 (common local format) before prepending
    cleaned = countryCode + cleaned.replace(/^0/, "");
  }
  return cleaned;
}

/**
 * Builds a wa.me deep-link with the personalised template body.
 * Returns null if no cleaned phone number is available.
 */
export function buildWhatsAppLink(phone, template, business, countryCode = "") {
  const cleaned = formatPhone(phone, countryCode);
  if (!cleaned) return null;

  const msg = (template || "")
    .replace(/\{name\}/g, business.name || "")
    .replace(/\{category\}/g, business.category || "")
    .replace(/\{address\}/g, business.address || "");

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
}

/**
 * Converts an array of business + contact objects to a CSV string.
 */
export function exportToCSV(businesses, contacts) {
  const headers = [
    "Name", "Category", "Phone", "Address", "Rating", "Reviews",
    "Status", "Note", "Contacted Date", "Hours", "Website", "Maps URL", "Imported At",
  ];

  const rows = businesses.map((b) => {
    const c = contacts[b.id] || {};
    return [
      b.name,
      b.category,
      b.phone,
      b.address,
      b.rating,
      b.reviews,
      c.status || "not_contacted",
      c.note || "",
      c.date ? new Date(c.date).toLocaleDateString() : "",
      b.hours,
      b.website,
      b.mapsUrl,
      b.importedAt ? new Date(b.importedAt).toLocaleDateString() : "",
    ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`);
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Triggers a CSV file download in the browser.
 */
export function downloadCSV(csvString, filename = "mapleads-export.csv") {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
