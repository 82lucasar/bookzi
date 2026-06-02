"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="es">
      <body style={{ fontFamily: "sans-serif", textAlign: "center", padding: "80px 24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>
          Algo salió mal
        </h2>
        <p style={{ color: "#64748B", marginBottom: "24px" }}>
          El error fue registrado automáticamente. Podés intentar de nuevo.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#0284C7", color: "#fff", border: "none",
            padding: "10px 24px", borderRadius: "8px", cursor: "pointer",
            fontSize: "15px", fontWeight: 600,
          }}
        >
          Intentar de nuevo
        </button>
      </body>
    </html>
  )
}
