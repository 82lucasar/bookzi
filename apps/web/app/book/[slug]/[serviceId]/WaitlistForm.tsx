"use client"

import { useState, useTransition } from "react"
import { joinWaitlist } from "@/lib/actions/waitlist"

interface Props {
  businessId:    string
  serviceId:     string
  selectedDate:  string
  serviceName:   string
}

export default function WaitlistForm({ businessId, serviceId, selectedDate, serviceName }: Props) {
  const [open, setOpen]       = useState(false)
  const [done, setDone]       = useState(false)
  const [alreadyIn, setAlreadyIn] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set("businessId", businessId)
    fd.set("serviceId",  serviceId)
    fd.set("requestedDate", selectedDate)

    startTransition(async () => {
      try {
        const res = await joinWaitlist(fd)
        if (res.alreadyIn) setAlreadyIn(true)
        setDone(true)
      } catch {
        setError("No pudimos anotarte. Intentá de nuevo.")
      }
    })
  }

  if (done) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", margin: "0 0 6px" }}>
          {alreadyIn ? "¡Ya estás en la lista!" : "¡Te anotamos!"}
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          Te avisamos por email cuando se libere un turno para <strong>{serviceName}</strong>.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", margin: "0 0 4px" }}>
          Sin horarios para este día
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
          Probá otro día, o anotate en la lista de espera.
        </p>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: "100%", padding: "13px 16px", borderRadius: 12,
            background: "white", border: "2px dashed var(--primary)",
            color: "var(--primary)", fontSize: 14, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Anotarme en lista de espera
        </button>
      ) : (
        <div style={{
          background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
          padding: "18px 16px",
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dark)", margin: "0 0 14px" }}>
            Te avisamos cuando haya un horario disponible
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="hidden" name="businessId"    value={businessId} />
            <input type="hidden" name="serviceId"     value={serviceId} />
            <input type="hidden" name="requestedDate" value={selectedDate} />

            <input
              name="clientName" required placeholder="Tu nombre"
              style={inputStyle}
            />
            <input
              name="clientPhone" required placeholder="Teléfono (con código de área)"
              type="tel"
              style={inputStyle}
            />
            <input
              name="clientEmail" placeholder="Email (opcional, para recibir el aviso)"
              type="email"
              style={inputStyle}
            />

            {error && (
              <p style={{ fontSize: 12, color: "var(--error)", margin: 0 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "white", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "var(--primary)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: isPending ? 0.7 : 1 }}
              >
                {isPending ? "Anotando…" : "Anotarme"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1.5px solid var(--border)", fontSize: 14, fontFamily: "inherit",
  color: "var(--text-dark)", background: "var(--bg)", outline: "none",
  boxSizing: "border-box",
}
