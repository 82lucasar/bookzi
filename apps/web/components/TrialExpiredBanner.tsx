import Link from "next/link"

export default function TrialExpiredBanner() {
  return (
    <div style={{
      background: "rgba(220,38,38,0.08)",
      borderBottom: "1.5px solid rgba(220,38,38,0.25)",
      padding: "12px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <p style={{ margin: 0, fontSize: 13, color: "#991B1B", fontWeight: 600 }}>
        ⛔ Tu período de prueba venció. Activá un plan para seguir usando Bookzi.
      </p>
      <Link
        href="/dashboard/billing"
        style={{
          fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
          background: "#DC2626", color: "white", textDecoration: "none", whiteSpace: "nowrap",
        }}
      >
        Activar plan
      </Link>
    </div>
  )
}
