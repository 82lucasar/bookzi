"use client"

import { useState } from "react"

export default function BookingLinkBox({ bookingUrl }: { bookingUrl: string }) {
  const [copied, setCopied] = useState(false)
  const displayUrl = bookingUrl.replace(/^https?:\/\//, "")

  const copy = async () => {
    try { await navigator.clipboard.writeText(bookingUrl) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        Link de reservas
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1, fontSize: 13, color: "var(--primary)", fontWeight: 600,
            wordBreak: "break-all", textDecoration: "none", lineHeight: 1.4,
          }}
        >
          {displayUrl}
        </a>
        <button
          onClick={copy}
          style={{
            flexShrink: 0, height: 34, padding: "0 14px", borderRadius: 9,
            fontSize: 12, fontWeight: 700,
            background: copied ? "rgba(5,150,105,0.1)" : "rgba(2,132,199,0.1)",
            color: copied ? "var(--accent)" : "var(--primary)",
            border: `1.5px solid ${copied ? "rgba(5,150,105,0.2)" : "rgba(2,132,199,0.2)"}`,
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 200ms",
          }}
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #0284C7, #0369A1)",
            color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 3px 10px rgba(2,132,199,0.3)",
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          Abrir página de reservas
        </a>
      </div>
    </div>
  )
}
