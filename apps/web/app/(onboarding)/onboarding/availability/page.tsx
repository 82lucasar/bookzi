"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const DAYS = [
  { key: "lunes",    label: "L", name: "Lun", fullName: "Lunes" },
  { key: "martes",   label: "M", name: "Mar", fullName: "Martes" },
  { key: "miercoles",label: "X", name: "Mié", fullName: "Miércoles" },
  { key: "jueves",   label: "J", name: "Jue", fullName: "Jueves" },
  { key: "viernes",  label: "V", name: "Vie", fullName: "Viernes" },
  { key: "sabado",   label: "S", name: "Sáb", fullName: "Sábado" },
  { key: "domingo",  label: "D", name: "Dom", fullName: "Domingo" },
]

export default function AvailabilityPage() {
  const router = useRouter()
  const [active, setActive] = useState<Set<string>>(
    new Set(["lunes", "martes", "miercoles", "jueves", "viernes"])
  )
  const [hours, setHours] = useState<Record<string, { from: string; to: string }>>(
    Object.fromEntries(DAYS.map(d => [d.key, { from: "09:00", to: "18:00" }]))
  )

  const toggleDay = (key: string) => {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const setHour = (day: string, field: "from" | "to", value: string) => {
    setHours(prev => {
      const existing = prev[day] ?? { from: "09:00", to: "18:00" }
      return { ...prev, [day]: { ...existing, [field]: value } }
    })
  }

  return (
    <div className="ob-screen">
      <div className="ob-header">
        <Link href="/dashboard/setup" className="ob-back-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <span className="step-label">Paso 2 de 3</span>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "66%" }}></div>
        </div>
      </div>

      <div className="ob-body" style={{ gap: 24 }}>
        <div>
          <h1 className="ob-title">¿Cuándo trabajás?</h1>
          <p className="ob-subtitle">Seleccioná los días y configurá tu horario.</p>
        </div>

        <div className="days-row">
          {DAYS.map(d => (
            <div key={d.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }} onClick={() => toggleDay(d.key)}>
              <div className={`day-btn${active.has(d.key) ? " active" : ""}`}>{d.label}</div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{d.name}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DAYS.filter(d => active.has(d.key)).map(d => (
            <div key={d.key} className="day-hours-block">
              <div className="day-hours-title">{d.fullName}</div>
              <div className="hours-row">
                <div className="form-group">
                  <label className="form-label">Desde</label>
                  <input
                    className="form-input"
                    type="time"
                    value={hours[d.key]?.from ?? "09:00"}
                    onChange={e => setHour(d.key, "from", e.target.value)}
                  />
                </div>
                <div className="hours-sep">—</div>
                <div className="form-group">
                  <label className="form-label">Hasta</label>
                  <input
                    className="form-input"
                    type="time"
                    value={hours[d.key]?.to ?? "18:00"}
                    onChange={e => setHour(d.key, "to", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ob-footer" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn btn-primary btn-full btn-lg" onClick={() => router.push("/onboarding/services")}>
          Siguiente
        </button>
        <button className="btn btn-secondary btn-full" onClick={() => router.push("/onboarding/services")}>
          Configurar más tarde
        </button>
      </div>
    </div>
  )
}
