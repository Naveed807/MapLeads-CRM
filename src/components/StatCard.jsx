export default function StatCard({ icon: Icon, label, value, accent, dark }) {
  const surface = dark ? "#1e293b" : "#fff";
  const text    = dark ? "#e2e8f0" : "#0f172a";
  const border  = dark ? "#334155" : "#f0f0f0";
  return (
    <div
      style={{
        background: surface,
        borderRadius: 14,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        border: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          width: 46, height: 46, borderRadius: 12,
          background: accent + "20",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon size={22} color={accent} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: text, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}
