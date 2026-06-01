"use client"

import Link from "next/link"

export default function TrialBanner({ daysLeft }: { daysLeft: number }) {
  if (daysLeft < 0) return null  // expirado, no mostrar banner

  const isUrgent = daysLeft <= 3

  return (
    <div style={{
      background: isUrgent ? "rgba(220,38,38,0.06)" : "rgba(2,132,199,0.06)",
      borderBottom: `1.5px solid ${isUrgent ? "rgba(220,38,38,0.20)" : "rgba(2,132,199,0.20)"}`,
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <p style={{ margin: 0, fontSize: 13, color: isUrgent ? "#991B1B" : "#0369A1", fontWeight: 600 }}>
        {isUrgent
          ? `⚠️ Tu prueba gratis vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}. ¡Activá tu plan para no perder el acceso!`
          : `🎉 Estás en período de prueba gratis — ${daysLeft} día${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}.`
        }
      </p>
      <Link
        href="/dashboard/billing"
        style={{
          fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
          background: isUrgent ? "#DC2626" : "var(--primary)",
          color: "white", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        {isUrgent ? "Activar ahora" : "Ver planes"}
      </Link>
    </div>
  )
}
