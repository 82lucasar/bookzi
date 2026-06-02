"use client"

import { useState } from "react"

export default function BookingLinkBox({ bookingUrl }: { bookingUrl: string }) {
  const [copied, setCopied] = useState(false)
  const [downloadingQr, setDownloadingQr] = useState(false)
  const displayUrl = bookingUrl.replace(/^https?:\/\//, "")

  const copy = async () => {
    try { await navigator.clipboard.writeText(bookingUrl) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = async () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(bookingUrl)}&format=png&margin=16&color=2-132-199&bgcolor=255-255-255`
    setDownloadingQr(true)
    try {
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "bookzi-qr.png"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: abrir en nueva pestaña si falla el download
      window.open(qrUrl, "_blank")
    } finally {
      setDownloadingQr(false)
    }
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
      {bookingUrl && (
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingUrl)}&margin=8`}
            alt="QR de tu agenda"
            width={80}
            height={80}
            style={{ borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </div>
      )}
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
        <button
          onClick={downloadQR}
          disabled={downloadingQr}
          style={{
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            height: 38, padding: "0 14px", borderRadius: 10,
            fontSize: 13, fontWeight: 700,
            background: "rgba(2,132,199,0.1)",
            color: "var(--primary)",
            border: "1.5px solid rgba(2,132,199,0.2)",
            cursor: downloadingQr ? "not-allowed" : "pointer",
            whiteSpace: "nowrap", transition: "all 200ms",
            opacity: downloadingQr ? 0.7 : 1,
          }}
        >
          {downloadingQr ? (
            "Descargando..."
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="9" y="9" width="1.5" height="1.5" fill="currentColor"/>
                <rect x="11.5" y="9" width="1.5" height="1.5" fill="currentColor"/>
                <rect x="9" y="11.5" width="1.5" height="1.5" fill="currentColor"/>
                <rect x="11.5" y="11.5" width="1.5" height="1.5" fill="currentColor"/>
              </svg>
              Descargar QR
            </>
          )}
        </button>
      </div>
    </div>
  )
}
