const PHONE_RE = /^\+?[\d][\d\s\-().]{6,20}$/;
// Looser regex for scanning text blocks — finds phone anywhere in a string
const PHONE_SEARCH_RE = /(\+?[\d][\d\s\-().]{6,20})/g;

function extractPhoneFromText(text) {
  // Match patterns like +92 333 1639081, 0333-163-9081, (021) 123-4567, etc.
  const m = text.match(/(\+?[\d][\d\s\-().]{6,20})/);
  if (!m) return "";
  const digits = m[1].replace(/\D/g, "");
  return digits.length >= 7 ? m[1].trim() : "";
}

/**
 * Search the raw pasted text for a phone number appearing within
 * ~500 characters after the business name.
 * Works because Ctrl+A on Google Maps copies both list cards AND
 * the detail-panel text (which always includes the phone number).
 */
function findPhoneInText(name, fullText) {
  const idx = fullText.indexOf(name);
  if (idx === -1) return "";
  // Search in a window after the name (up to ~500 chars covers one full entry)
  const window = fullText.slice(idx, idx + 500);
  PHONE_SEARCH_RE.lastIndex = 0;
  let match;
  while ((match = PHONE_SEARCH_RE.exec(window)) !== null) {
    const digits = match[1].replace(/\D/g, "");
    // Must have 7–15 digits and not look like a year/rating/review count
    if (digits.length >= 7 && digits.length <= 15) {
      return match[1].trim();
    }
  }
  return "";
}

/**
 * Parses the outerHTML of a Google Maps results list (div.m6QErb)
 * and returns an array of raw business objects.
 *
 * Also scans for detail-panel phone numbers (shown when a business is open)
 * and merges them by name match.
 */
export function parseGoogleMapsHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const items = doc.querySelectorAll("div.Nv2PK");
  const businesses = [];
  // Full plain text of the paste — used as final phone fallback
  const fullText = doc.body?.textContent || html;

  // ── Build a name→phone map from any detail panel present in the paste ──
  // The detail panel uses aria-labels like "Phone: +92 333 1639081"
  // or spans/buttons with data-tooltip / aria-label containing the phone.
  const detailPhoneByName = buildDetailPanelPhones(doc);

  items.forEach((item, idx) => {
    const name     = item.querySelector("div.qBF1Pd")?.textContent?.trim() || "";
    const rating   = item.querySelector("span.MW4etd")?.textContent?.trim() || "";
    const reviews  = item.querySelector("span.UY7F9")?.textContent?.trim().replace(/[()]/g, "") || "";
    const mapsUrl  = item.querySelector("a.hfpxzc")?.href || "";
    const website  = item.querySelector("a.lcr4fd")?.href || "";

    const w4blocks = item.querySelectorAll("div.W4Efsd");
    let category = "", address = "", phone = "", hours = "";

    w4blocks.forEach((w) => {
      if (w.querySelector("span.MW4etd")) return;
      const text   = w.textContent?.trim() || "";
      const phoneEl = w.querySelector("span.UsdlK");

      if (phoneEl) { phone = phoneEl.textContent.trim(); return; }

      // Regex fallback — catches phone text even when Google changes CSS class names
      if (!phone) {
        for (const s of w.querySelectorAll("span")) {
          const t = s.textContent.trim();
          if (PHONE_RE.test(t) && t.replace(/\D/g, "").length >= 7) {
            phone = t;
            return;
          }
        }
      }

      if (/Open|Closed|Opens/i.test(text)) {
        const spans = w.querySelectorAll("span");
        for (const s of spans) {
          if (/Open|Closed|Opens/i.test(s.textContent)) {
            hours = s.textContent.trim();
            break;
          }
        }
        return;
      }

      if (!category) {
        const t = w.querySelector("span")?.textContent?.trim() || "";
        if (t && t !== "·" && !t.startsWith("·")) category = t;
      }

      if (!address) {
        for (const s of w.querySelectorAll("span")) {
          const t = s.textContent.trim();
          if (t.startsWith("·") && t.length > 3) {
            address = t.replace(/^·/, "").trim();
            break;
          }
        }
      }
    });

    if (!name) return;

    // If still no phone from the card, check the detail panel map
    if (!phone) phone = detailPhoneByName.get(name) || "";

    // Final fallback: scan raw text content near this business name.
    // Catches phones that appear in the detail panel text on Ctrl+A pastes
    // but are absent from the list card HTML.
    if (!phone) phone = findPhoneInText(name, fullText);

    businesses.push({
      id: `biz-${idx}-${Date.now()}`,
      name,
      category,
      rating,
      reviews,
      address,
      phone,
      hours,
      website,
      mapsUrl,
    });
  });

  return businesses;
}

/**
 * Scans the full pasted document for any detail-panel phone numbers.
 * Google Maps shows the detail panel (right side) when a business is open;
 * if the user pastes the full page HTML, phones appear there even when
 * they're absent from the list cards.
 *
 * Returns a Map<businessName, phoneString>.
 */
function buildDetailPanelPhones(doc) {
  const map = new Map();

  // Strategy 1: aria-label="Phone: +xx xxx" on buttons/links
  doc.querySelectorAll("[aria-label]").forEach((el) => {
    const label = el.getAttribute("aria-label") || "";
    const m = label.match(/Phone[:\s]+([+\d][\d\s\-().]{6,20})/i);
    if (m) {
      const phone = m[1].trim();
      // Walk up to find the nearest business name
      const nameEl = el.closest("[data-result-index]") ||
                     el.closest(".bJzME") ||
                     el.closest(".rogA2c") ||
                     el.closest(".PPCwl");
      const name = nameEl?.querySelector("h1,h2,.DUwDvf,.fontHeadlineLarge")?.textContent?.trim();
      if (name) map.set(name, phone);
    }
  });

  // Strategy 2: scan ALL text nodes for phone-like strings and
  // associate with the nearest heading (h1/h2 or .DUwDvf)
  const headings = doc.querySelectorAll("h1, h2, .DUwDvf, .fontHeadlineLarge");
  headings.forEach((h) => {
    const bizName = h.textContent.trim();
    if (!bizName || map.has(bizName)) return;
    // Look at the parent panel for a phone span
    const panel = h.closest(".bJzME, .rogA2c, .PPCwl, [role='main']") || h.parentElement;
    if (!panel) return;
    for (const span of panel.querySelectorAll("span, button, a")) {
      const t = span.textContent.trim();
      if (PHONE_RE.test(t) && t.replace(/\D/g, "").length >= 7) {
        map.set(bizName, t);
        break;
      }
    }
  });

  return map;
}
