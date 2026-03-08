export const DEFAULT_TEMPLATE = `Hi, I came across *{name}* on Google Maps and I'd love to connect with you!\n\nI believe we can provide value to your business. Would you be open to a quick conversation?\n\nThank you! 🙏`;

export const DEFAULT_EMAIL_SUBJECT = `Partnership Opportunity — {name}`;

export const DEFAULT_EMAIL_BODY = `Hi {name} Team,

I came across your business on Google Maps and was impressed by what you offer.

I'd love to explore how we can work together and create value for your business.

Could we schedule a brief call to discuss this further?

Best regards,
Muhammad Naveed | CoreModify`;

export const STATUS_CONFIG = {
  not_contacted:    { label: "Not Contacted",    color: "#94a3b8", bg: "#f1f5f9" },
  contacted:        { label: "Contacted",        color: "#0ea5e9", bg: "#e0f2fe" },
  replied:          { label: "Replied",          color: "#10b981", bg: "#d1fae5" },
  converted:        { label: "Converted",        color: "#8b5cf6", bg: "#ede9fe" },
  not_interested:   { label: "Not Interested",   color: "#ef4444", bg: "#fee2e2" },
  not_on_whatsapp:  { label: "Not on WhatsApp",  color: "#f97316", bg: "#fff7ed" },
};

export const COUNTRY_CODES = [
  { code: "",     label: "No prefix — keep as-is" },
  { code: "92",   label: "🇵🇰 Pakistan (+92)" },
  { code: "1",    label: "🇺🇸 USA / Canada (+1)" },
  { code: "44",   label: "🇬🇧 UK (+44)" },
  { code: "971",  label: "🇦🇪 UAE (+971)" },
  { code: "966",  label: "🇸🇦 Saudi Arabia (+966)" },
  { code: "91",   label: "🇮🇳 India (+91)" },
  { code: "880",  label: "🇧🇩 Bangladesh (+880)" },
  { code: "60",   label: "🇲🇾 Malaysia (+60)" },
  { code: "62",   label: "🇮🇩 Indonesia (+62)" },
  { code: "65",   label: "🇸🇬 Singapore (+65)" },
  { code: "20",   label: "🇪🇬 Egypt (+20)" },
  { code: "234",  label: "🇳🇬 Nigeria (+234)" },
  { code: "27",   label: "🇿🇦 South Africa (+27)" },
  { code: "49",   label: "🇩🇪 Germany (+49)" },
  { code: "33",   label: "🇫🇷 France (+33)" },
  { code: "86",   label: "🇨🇳 China (+86)" },
  { code: "81",   label: "🇯🇵 Japan (+81)" },
  { code: "55",   label: "🇧🇷 Brazil (+55)" },
  { code: "52",   label: "🇲🇽 Mexico (+52)" },
];

export const DARK = {
  bg:         "#0f172a",
  surface:    "#1e293b",
  border:     "#334155",
  text:       "#e2e8f0",
  subtext:    "#94a3b8",
  inputBg:    "#1e293b",
  inputText:  "#e2e8f0",
};

export const LIGHT = {
  bg:         "#f8fafc",
  surface:    "#ffffff",
  border:     "#e2e8f0",
  text:       "#0f172a",
  subtext:    "#64748b",
  inputBg:    "#ffffff",
  inputText:  "#334155",
};
