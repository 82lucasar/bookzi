"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveAvailability, type DayConfig } from "@/lib/actions/availability"

const DAYS_LIST = [
  { key: "monday",    label: "Lunes"     },
  { key: "tuesday",   label: "Martes"    },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday",  label: "Jueves"    },
  { key: "friday",    label: "Viernes"   },
  { key: "saturday",  label: "Sábado"    },
  { key: "sunday",    label: "Domingo"   },
]

const TIMES = Array.from({ length: 49 }, (_, i) => {
  const total = i * 30
  const h = String(Math.floor(total / 60)).padStart(2, "0")
  const m = String(total % 60).padStart(2, "0")
  return `${h}:${m}`
})

type ServiceItem = { id: string; name: string }

export default function AvailabilityForm({
  initial,
  services,
  staffId,
}: {
  initial: DayConfig[]
  services: ServiceItem[]
  staffId?: string
}) {
  const router = useRouter()
  const [schedule, setSchedule] = useState<DayConfig[]>(initial)
  const [saving, setSaving] = useState(false)

  function toggle(day: string) {
    setSchedule(s => s.map(d => d.day === day ? { ...d, isActive: !d.isActive } : d))
  }

  function setTime(day: string, field: "startTime" | "endTime", value: string) {
    setSchedule(s => s.map(d => d.day === day ? { ...d, [field]: value } : d))
  }

  function toggleService(day: string, serviceId: string) {
    setSchedule(s => s.map(d => {
      if (d.day !== day) return d
      const current = new Set(d.enabledServiceIds)
      if (current.has(serviceId)) current.delete(serviceId)
      else current.add(serviceId)
      return { ...d, enabledServiceIds: Array.from(current) }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await saveAvailability(schedule, staffId)
    router.push(staffId ? `/dashboard/staff/${staffId}` : "/dashboard")
  }

  const selectStyle: React.CSSProperties = {
    height: 42,
    borderRadius: 10,
    border: "1.5px solid var(--color-border, #E0F0F8)",
    background: "white",
    color: "var(--color-text-dark, #0F172A)",
    fontSize: 14,
    fontWeight: 600,
    padding: "0 10px",
    fontFamily: "inherit",
    cursor: "pointer",
    outline: "none",
    minWidth: 90,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {DAYS_LIST.map(({ key, label }) => {
        const day = schedule.find(d => d.day === key)!
        return (
          <div
            key={key}
            style={{
              background: day.isActive ? "white" : "#F8FAFC",
              border: `1.5px solid ${day.isActive ? "var(--color-border, #E0F0F8)" : "#E2E8F0"}`,
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              transition: "background 150ms, border-color 150ms",
            }}
          >
            {/* Fila superior */}
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}>
              <div
                onClick={() => toggle(key)}
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${day.isActive ? "var(--color-primary, #0284C7)" : "#CBD5E1"}`,
                  background: day.isActive ? "var(--color-primary, #0284C7)" : "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 150ms", cursor: "pointer",
                }}
              >
                {day.isActive && (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 7l3.5 3.5L11 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{
                fontSize: 15, fontWeight: 700,
                color: day.isActive ? "var(--color-text-dark, #0F172A)" : "#94A3B8",
                transition: "color 150ms",
              }}>
                {label}
              </span>
              {!day.isActive && (
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>
                  No disponible
                </span>
              )}
            </label>

            {day.isActive && (
              <>
                {/* Horarios */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 34, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Desde</span>
                    <select value={day.startTime} onChange={e => setTime(key, "startTime", e.target.value)} style={selectStyle}>
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ alignSelf: "flex-end", paddingBottom: 10, color: "#94A3B8", fontWeight: 700, fontSize: 16 }}>—</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hasta</span>
                    <select value={day.endTime} onChange={e => setTime(key, "endTime", e.target.value)} style={selectStyle}>
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Servicios */}
                {services.length > 0 && (
                  <div style={{ paddingLeft: 34, borderTop: "1px solid var(--color-border, #E0F0F8)", paddingTop: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Servicios habilitados
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {services.map(svc => {
                        const enabled = day.enabledServiceIds.includes(svc.id)
                        return (
                          <div key={svc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <span style={{ fontSize: 14, color: enabled ? "#0F172A" : "#94A3B8", fontWeight: 500, transition: "color 150ms" }}>
                              {svc.name}
                            </span>
                            <label className="toggle" style={{ flexShrink: 0 }}>
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={() => toggleService(key, svc.id)}
                              />
                              <div className="toggle-track"></div>
                              <div className="toggle-thumb"></div>
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            marginLeft: "auto", height: 44, padding: "0 28px", borderRadius: 12,
            border: "none", background: saving ? "#0369A1" : "linear-gradient(135deg, #0284C7, #0369A1)",
            color: "white", fontWeight: 700, fontSize: 14, fontFamily: "inherit",
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.8 : 1,
            boxShadow: "0 2px 8px rgba(2,132,199,0.30)",
          }}
        >
          {saving ? "Guardando..." : "Guardar horarios"}
        </button>
      </div>
    </form>
  )
}
