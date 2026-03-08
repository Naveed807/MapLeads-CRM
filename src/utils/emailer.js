import emailjs from "@emailjs/browser";

/**
 * Fill in {name}, {phone}, {email}, {address}, {category} etc.
 * placeholders in a template string, same syntax as WhatsApp template.
 */
export function buildEmailBody(template, biz, fromName = "") {
  if (!template || !biz) return template || "";
  return template
    .replace(/\{name\}/gi,      biz.name     || "")
    .replace(/\{phone\}/gi,     biz.phone    || "")
    .replace(/\{email\}/gi,     biz.email    || "")
    .replace(/\{address\}/gi,   biz.address  || "")
    .replace(/\{category\}/gi,  biz.category || "")
    .replace(/\{website\}/gi,   biz.website  || "")
    .replace(/\{rating\}/gi,    biz.rating   || "")
    .replace(/\{from_name\}/gi, fromName     || "");
}

/**
 * Send an email via EmailJS.
 *
 * @param {object} settings  – { serviceId, templateId, publicKey, fromName }
 * @param {object} biz       – business object
 * @param {string} subject   – subject template string (with {name} etc.)
 * @param {string} body      – body template string (with {name} etc.)
 * @returns Promise<{ ok: boolean, error?: string }>
 */
export async function sendEmailViaEmailJS(settings, biz, subject, body) {
  const { serviceId, templateId, publicKey, fromName } = settings;

  if (!serviceId || !templateId || !publicKey) {
    return { ok: false, error: "EmailJS not configured. Go to the Email tab to set up your credentials." };
  }
  if (!biz.email) {
    return { ok: false, error: "This business has no email address." };
  }

  const filledSubject = buildEmailBody(subject, biz, fromName);
  const filledBody    = buildEmailBody(body,    biz, fromName);

  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email:  biz.email,
        to_name:   biz.name,
        from_name: fromName || "MapLeads CRM",
        subject:   filledSubject,
        message:   filledBody,
      },
      publicKey
    );
    return { ok: true };
  } catch (err) {
    const msg = err?.text || err?.message || "Email send failed.";
    return { ok: false, error: msg };
  }
}

/**
 * Fallback: open the system mail client via mailto: link.
 */
export function openMailto(biz, subject, body, fromName = "") {
  const filledSubject = buildEmailBody(subject, biz, fromName);
  const filledBody    = buildEmailBody(body,    biz, fromName);
  const href = `mailto:${encodeURIComponent(biz.email || "")}?subject=${encodeURIComponent(filledSubject)}&body=${encodeURIComponent(filledBody)}`;
  window.open(href, "_blank");
}
