import * as XLSX from "xlsx";

// Map of field name → possible column header variants (all lowercase, no spaces)
const FIELD_VARIANTS = {
  name:     ["name", "businessname", "company", "companyname", "business", "title", "storename", "shopname"],
  phone:    ["phone", "phonenumber", "mobile", "mobilenumber", "tel", "telephone", "contact", "contactnumber", "cell"],
  email:    ["email", "emailaddress", "email", "mail", "emailid"],
  address:  ["address", "location", "fulladdress", "addr", "street", "area"],
  category: ["category", "type", "businesstype", "industry", "businesscategory", "sector"],
  website:  ["website", "url", "web", "siteurl", "site", "homepage"],
  rating:   ["rating", "stars", "score"],
  notes:    ["notes", "note", "remarks", "comment", "comments", "description"],
};

function normalize(h) {
  return String(h || "").toLowerCase().replace(/[\s_\-./]/g, "");
}

/**
 * Parse an Excel (.xlsx / .xls) or CSV file.
 * Returns { businesses, headers, detectedColumns, warnings }
 *   businesses   – array of business objects ready for import
 *   headers      – original header row strings
 *   detectedColumns – { fieldName: colIndex } map of what was auto-detected
 *   warnings     – array of human-readable strings about skipped rows etc.
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get raw rows as arrays; defval="" so empty cells are ""
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (rows.length < 2) {
          resolve({ businesses: [], headers: [], detectedColumns: {}, warnings: ["File appears empty or has no data rows."] });
          return;
        }

        const headers = rows[0].map(String);
        const normalizedHeaders = headers.map(normalize);

        // Auto-detect column index for each field
        const detected = {};
        Object.entries(FIELD_VARIANTS).forEach(([field, variants]) => {
          const idx = normalizedHeaders.findIndex((h) => variants.includes(h));
          if (idx !== -1) detected[field] = idx;
        });

        const warnings = [];
        const businesses = [];
        let skippedRows = 0;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const get = (field) => {
            const idx = detected[field];
            return idx !== undefined ? String(row[idx] ?? "").trim() : "";
          };

          const name = get("name");
          if (!name) { skippedRows++; continue; }

          businesses.push({
            id: `biz-xl-${i}-${Date.now()}`,
            name,
            phone:    get("phone"),
            email:    get("email"),
            address:  get("address"),
            category: get("category"),
            website:  get("website"),
            rating:   get("rating"),
            notes:    get("notes"),
            reviews:  "",
            hours:    "",
            mapsUrl:  "",
          });
        }

        if (skippedRows > 0) {
          warnings.push(`${skippedRows} rows skipped (missing name).`);
        }
        if (detected.name === undefined) {
          warnings.push("Could not detect a 'Name' column. Make sure your header row has a column called 'Name', 'Business Name', 'Company', etc.");
        }

        resolve({ businesses, headers, detectedColumns: detected, warnings });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}

/** Build a blank Excel template the user can download & fill in */
export function generateExcelTemplate() {
  const headers = ["Name", "Phone", "Email", "Address", "Category", "Website", "Notes"];
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Businesses");
  XLSX.writeFile(wb, "mapleads-import-template.xlsx");
}
