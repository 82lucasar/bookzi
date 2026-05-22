"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

const CONFETTI_COLORS = ["#0284C7","#059669","#34D399","#38BDF8","#F59E0B","#FFFFFF"]

export default function ConfirmedPage() {
  const confettiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = confettiRef.current
    if (!container) return
    for (let i = 0; i < 60; i++) {
      const el = document.createElement("div")
      el.className = "confetti-piece"
      el.style.cssText = `
        left: ${Math.random() * 100}%;
        top: -10px;
        width: ${5 + Math.random() * 7}px;
        height: ${5 + Math.random() * 7}px;
        background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        animation-duration: ${1.5 + Math.random() * 2.5}s;
        animation-delay: ${Math.random() * 0.6}s;
      `
      container.appendChild(el)
    }
  }, [])

  const addToCalendar = () => {
    const url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Turno+Dra.+Martina+López&dates=20250610T173000Z/20250610T180000Z&details=Consulta+general+30+min+%23BZ-20250610-4821"
    window.open(url, "_blank")
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start" }}>
      <div className="confetti-wrap" ref={confettiRef}/>

      <div className="confirm-page" style={{ position: "relative", zIndex: 1 }}>

        {/* Banner */}
        <div className="confirm-banner">
          <div className="check-wrap">
            <svg viewBox="0 0 32 32" fill="none" style={{ width: 32, height: 32 }}>
              <path
                d="M6 16l7 7 13-14"
                stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 36, strokeDashoffset: 36, animation: "drawC 0.5s ease-out 0.3s forwards" }}
              />
            </svg>
          </div>
          <h1 className="confirm-title">¡Turno reservado!</h1>
          <p className="confirm-sub">Te confirmamos tu turno con Martina López. Ya te mandamos los detalles por WhatsApp.</p>
        </div>

        {/* Detail card */}
        <div className="detail-card">
          <div className="detail-row">
            <div className="detail-icon blue">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6"/><path d="M2 18c0-3.5 3.6-6 8-6s8 2.5 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div className="detail-label">Profesional</div>
              <div className="detail-val">Dra. Martina López</div>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-icon green">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1.5" y="3" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M6 1.5v3M14 1.5v3M1.5 9h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div className="detail-label">Fecha y hora</div>
              <div className="detail-val">Martes 10 de junio · 14:30</div>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#B45309" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6"/><path d="M10 6v4.5l3 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div className="detail-label">Servicio</div>
              <div className="detail-val">Consulta general · 30 min</div>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-icon" style={{ background: "rgba(51,65,85,0.08)", color: "var(--text-mid)" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 0M4 9l8 0M4 14l5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div className="detail-label">Número de reserva</div>
              <div className="detail-val" style={{ fontFamily: "ui-monospace, monospace", fontSize: 14 }}>#BZ-20250610-4821</div>
            </div>
          </div>
        </div>

        {/* WhatsApp notice */}
        <div className="notif-notice">
          <div className="notif-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C5.13 1 2 4.13 2 8c0 .73.19 1.41.52 2.01L2 16l5.99-.52A6.96 6.96 0 009 16c3.87 0 7-3.13 7-7s-3.13-8-7-8z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
          </div>
          <div className="notif-text">
            <strong>Confirmación enviada.</strong> Te mandamos un WhatsApp con los detalles de tu turno. Si necesitás cancelar, respondé ese mensaje.
          </div>
        </div>

        {/* Calendar */}
        <div className="cal-add" onClick={addToCalendar}>
          <div className="cal-add-left">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.08)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="2.5" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M13 1v3M1 8h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/></svg>
            </div>
            <div>
              <div className="cal-add-text">Agregar al calendario</div>
              <div className="cal-add-sub">Google Calendar · Apple Calendar</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#64748B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        {/* Actions */}
        <div style={{ padding: "20px 16px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/book/mi-turno">
            <button className="btn btn-secondary btn-full">Reservar otro turno</button>
          </Link>
        </div>

        {/* Powered */}
        <div style={{ textAlign: "center", padding: "0 0 32px", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          Reservas gestionadas por <a href="/" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Bookzi</a>
        </div>

      </div>

      <style>{`@keyframes drawC { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  )
}
