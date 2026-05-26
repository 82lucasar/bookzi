"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveAvailability, type DayConfig } from "@/lib/actions/availability"

const DAYS = [
  { key: "monday",    label: "L", name: "Lun", fullName: "Lunes"     },
  { key: "tuesday",   label: "M", name: "Mar", fullName: "Martes"    },
  { key: "wednesday", label: "X", name: "Mié", fullName: "Miércoles" },
  { key: "thursday",  label: "J", name: "Jue", fullName: "Jueves"    },
  { key: "friday",    label: "V", name: "Vie", fullName: "Viernes"   },
  { key: "saturday",  label: "S", name: "Sáb", fullName: "Sábado"    },
  { key: "sunday",    label: "D", name: "Dom", fullName: "Domingo"   },
]

type ServiceItem = { id: string; name: string }

type Props = {
  services: ServiceItem[]
}

export default function AvailabilityOnboardingForm({ services }: Props) {
  const router = useRouter()
  const [active, setActive] = useState<Set<string>>(
    new Set(["monday", "tuesday", "wednesday", "thursday", "friday"])
  )
  const [hours, setHours] = useState<Record<string, { from: string; to: string }>>(
    Object.fromEntries(DAYS.map(d => [d.key, { from: "09:00", to: "18:00" }]))
  )
  const [dayServices, setDayServices] = useState<Record<string, Set<string>>>(
    // Initially, all services enabled for all days
    Object.fromEntries(DAYS.map(d => [d.key, new Set(services.map(s => s.id))]))
  )
  const [loading, setLoading] = useState(false)

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

  const toggleService = (day: string, serviceId: string) => {
    setDayServices(prev => {
      const current = new Set(prev[day] ?? [])
      if (current.has(serviceId)) current.delete(serviceId)
      else current.add(serviceId)
      return { ...prev, [day]: current }
    })
  }

  const buildDayConfigs = (): DayConfig[] =>
    DAYS.map(d => ({
      day: d.key,
      isActive: active.has(d.key),
      startTime: hours[d.key]?.from ?? "09:00",
      endTime: hours[d.key]?.to ?? "18:00",
      enabledServiceIds: Array.from(dayServices[d.key] ?? []),
    }))

  const handleSave = async () => {
    setLoading(true)
    await saveAvailability(buildDayConfigs())
    router.push("/onboarding/done")
  }

  const handleSkip = () => router.push("/onboarding/done")

  return (
    <div className="ob-screen">
      <div className="ob-header">
        <div className="ob-header-left">
          <button
            className="ob-back-btn"
            onClick={() => router.push("/onboarding/services")}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="step-label">Paso 3 de 3</span>
        </div>
        <a href="/dashboard" className="logo-home-btn">
          <div className="logo-mark">B</div>
          <span className="logo-text">Bookzi</span>
        </a>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "100%" }}></div>
        </div>
      </div>

      <div className="ob-body" style={{ gap: 24, paddingBottom: 130 }}>
        <div>
          <h1 className="ob-title">¿Cuándo trabajás?</h1>
          <p className="ob-subtitle">
            Seleccioná los días, configurá el horario y elegí qué servicios ofrecés cada día.
          </p>
        </div>

        {/* Chips de días */}
        <div className="days-row">
          {DAYS.map(d => (
            <div
              key={d.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
              onClick={() => toggleDay(d.key)}
            >
              <div className={`day-btn${active.has(d.key) ? " active" : ""}`}>{d.label}</div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {d.name}
              </span>
            </div>
          ))}
        </div>

        {/* Cards por día activo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DAYS.filter(d => active.has(d.key)).map(d => (
            <div key={d.key} className="day-hours-block">
              <div className="day-hours-title">{d.fullName}</div>

              {/* Horario */}
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

              {/* Servicios por día */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Servicios
                </span>

                {services.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                    No hay servicios definidos.{" "}
                    <button
                      type="button"
                      style={{ color: "var(--primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 0, fontFamily: "inherit" }}
                      onClick={() => router.push("/onboarding/services")}
                    >
                      Volvé al paso anterior para agregarlos.
                    </button>
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {services.map(svc => {
                      const enabled = dayServices[d.key]?.has(svc.id) ?? true
                      return (
                        <div
                          key={svc.id}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            gap: 12, padding: "8px 0",
                          }}
                        >
                          <span style={{ fontSize: 14, color: enabled ? "var(--text-dark)" : "var(--text-muted)", fontWeight: 500, transition: "color 150ms" }}>
                            {svc.name}
                          </span>

                          {/* Toggle switch */}
                          <label className="toggle" style={{ flexShrink: 0 }}>
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => toggleService(d.key, svc.id)}
                            />
                            <div className="toggle-track"></div>
                            <div className="toggle-thumb"></div>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ob-footer" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          className="btn btn-primary btn-full btn-lg"
          type="button"
          disabled={loading}
          style={{ opacity: loading ? 0.8 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          onClick={handleSave}
        >
          {loading ? "Guardando..." : "¡Listo! Ver mi agenda"}
        </button>
        <button
          className="btn btn-secondary btn-full"
          type="button"
          disabled={loading}
          onClick={handleSkip}
        >
          Configurar más tarde
        </button>
      </div>
    </div>
  )
}
