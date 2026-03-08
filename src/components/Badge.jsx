import { STATUS_CONFIG } from "../constants";

export default function Badge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.not_contacted;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 20,
        color: c.color,
        background: c.bg,
        letterSpacing: "0.3px",
        whiteSpace: "nowrap",
        border: `1px solid ${c.color}30`,
      }}
    >
      {c.label}
    </span>
  );
}
