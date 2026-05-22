"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Status = "pending" | "confirmed" | "cancelled" | "rescheduled"

const STATUS: Record<Status, { badge: string; cls: string }> = {
  pending:     { badge: "⏳ Pendiente",    cls: "badge-pending" },
  confirmed:   { badge: "✓ Confirmado",   cls: "badge-confirmed" },
  cancelled:   { badge: "✕ Cancelado",    cls: "badge-cancelled" },
  rescheduled: { badge: "↻ Reprogramado", cls: "badge-rescheduled" },
}

export default function AppointmentDetailPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("confirmed")
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const cfg = STATUS[status]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>

      {/* Header */}
      <header className="app-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)", flex: 1 }}>Turno</span>
        <div className="menu-btn" ref={menuRef} onClick={() => setOpen(v => !v)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="3" r="1.3" fill="currentColor"/>
            <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
            <circle cx="8" cy="13" r="1.3" fill="currentColor"/>
          </svg>
          {open && (
            <div className="dropdown">
              <button className="dropdown-item" onClick={() => { router.push("/dashboard/appointments/new"); setOpen(false) }}>Crear turno similar</button>
              <button className="dropdown-item" onClick={() => { setStatus("rescheduled"); setOpen(false) }}>Reprogramar</button>
              <button className="dropdown-item danger" onClick={() => { setStatus("cancelled"); setOpen(false) }}>Cancelar turno</button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: "20px 16px 100px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Hero */}
        <div className="turno-hero">
          <div className="big-date-box">
            <span className="bday">10</span>
            <span className="bmon">Jun</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-dark)", marginBottom: 4, letterSpacing: "-0.3px" }}>Valentina Ruiz</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>Consulta general · 30 min</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>09:30</div>
            <div style={{ marginTop: 10 }}>
              <span className={`badge ${cfg.cls}`} style={{ fontSize: 15, padding: "8px 20px" }}>{cfg.badge}</span>
            </div>
          </div>
        </div>

        {/* Demo estado */}
        <div className="detail-section" style={{ padding: "14px 20px" }}>
          <div className="det-section-title">Demo — Cambiar estado</div>
          <div className="state-demo">
            {(Object.keys(STATUS) as Status[]).map(s => (
              <button key={s} className={`state-btn${status === s ? " active" : ""}`} onClick={() => setStatus(s)}>
                {STATUS[s].badge}
              </button>
            ))}
          </div>
        </div>

        {/* Historial */}
        <div className="detail-section">
          <div className="det-section-title">Historial</div>
          <div className="history-list">
            {[
              { event: "Turno confirmado", time: "Hoy 08:15 — por Martina L.", active: true },
              { event: "Reserva creada", time: "Ayer 20:32 — por el cliente", active: false },
              { event: "Recordatorio enviado por WhatsApp", time: "Ayer 20:33 — automático", active: false, last: true },
            ].map((h, i) => (
              <div key={i} className="history-item">
                <div className="history-spine">
                  <div className={`history-dot${h.active ? " active" : ""}`}></div>
                  {!h.last && <div className="history-connector"></div>}
                </div>
                <div>
                  <div className="history-event">{h.event}</div>
                  <div className="history-time">{h.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cliente */}
        <div className="detail-section">
          <div className="det-section-title">Cliente</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="avatar avatar-lg">VR</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-dark)" }}>Valentina Ruiz</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>3 turnos anteriores</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="contact-chip wa" href="https://wa.me/541112345678" target="_blank" rel="noreferrer">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1C3.69 1 1 3.69 1 7c0 1.04.27 2.02.74 2.87L1 13l3.23-.73A5.97 5.97 0 007 13c3.31 0 6-2.69 6-6S10.31 1 7 1z" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
              WhatsApp
            </a>
            <a className="contact-chip" href="mailto:valentina@email.com">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Email
            </a>
          </div>
        </div>

      </div>

      {/* Action bar */}
      <div className="action-bar">
        {status === "pending" && <>
          <button className="btn btn-accent" onClick={() => setStatus("confirmed")}>Confirmar</button>
          <button className="btn btn-outline" onClick={() => setStatus("cancelled")}>Cancelar</button>
        </>}
        {status === "confirmed" && <>
          <button className="btn btn-secondary" onClick={() => router.push("/dashboard/appointments/new")}>Reprogramar</button>
          <button className="btn btn-outline" onClick={() => setStatus("cancelled")}>Cancelar</button>
        </>}
        {status === "cancelled" && (
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => router.push("/dashboard/appointments/new")}>Crear turno similar</button>
        )}
        {status === "rescheduled" && <>
          <button className="btn btn-accent" onClick={() => setStatus("confirmed")}>Confirmar</button>
          <button className="btn btn-outline" onClick={() => setStatus("cancelled")}>Cancelar</button>
        </>}
      </div>

    </div>
  )
}
