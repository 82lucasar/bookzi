"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveAvailability, type DayConfig } from "@/lib/actions/availability"

const DAYS_LIST = [
  { key: "monday",    label: "Lunes" },
  { key: "tuesday",   label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday",  label: "Jueves" },
  { key: "friday",    label: "Viernes" },
  { key: "saturday",  label: "Sábado" },
  { key: "sunday",    label: "Domingo" },
]

// 00:00 → 24:00 en pasos de 30 min
const TIMES = Array.from({ length: 49 }, (_, i) => {
  const total = i * 30
  const h = String(Math.floor(total / 60)).padStart(2, "0")
  const m = String(total % 60).padStart(2, "0")
  return `${h}:${m}`
})

export default function AvailabilityForm({ initial }: { initial: DayConfig[] }) {
  const router = useRouter()
  const [schedule, setSchedule] = useState<DayConfig[]>(initial)
  const [saving,   setSaving]   = useState(false)

  function toggle(day: string) {
    setSchedule(s => s.map(d => d.day === day ? { ...d, isActive: !d.isActive } : d))
  }

  function setTime(day: string, field: "startTime" | "endTime", value: string) {
    setSchedule(s => s.map(d => d.day === day ? { ...d, [field]: value } : d))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData()
    schedule.forEach(({ day, isActive, startTime, endTime }) => {
      if (isActive) formData.set(`${day}_active`, "on")
      formData.set(`${day}_start`, startTime)
      formData.set(`${day}_end`, endTime)
    })
    await saveAvailability(formData)
    router.push("/dashboard")
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
            {/* Fila superior: checkbox + nombre del día */}
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              userSelect: "none",
            }}>
              {/* Checkbox custom */}
              <div
                onClick={() => toggle(key)}
                style={{
                  width: 22, height: 22,
                  borderRadius: 6,
                  border: `2px solid ${day.isActive ? "var(--color-primary, #0284C7)" : "#CBD5E1"}`,
                  background: day.isActive ? "var(--color-primary, #0284C7)" : "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 150ms",
                  cursor: "pointer",
                }}
              >
                {day.isActive && (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 7l3.5 3.5L11 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              <span style={{
                fontSize: 15,
                fontWeight: 700,
                color: day.isActive ? "var(--color-text-dark, #0F172A)" : "#94A3B8",
                transition: "color 150ms",
              }}>
                {label}
              </span>

              {!day.isActive && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#94A3B8",
                }}>
                  No disponible
                </span>
              )}
            </label>

            {/* Fila inferior: selectores de horario (solo si activo) */}
            {day.isActive && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingLeft: 34,
                flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Desde
                  </span>
                  <select
                    value={day.startTime}
                    onChange={e => setTime(key, "startTime", e.target.value)}
                    style={selectStyle}
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ alignSelf: "flex-end", paddingBottom: 10, color: "#94A3B8", fontWeight: 700, fontSize: 16 }}>
                  —
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Hasta
                  </span>
                  <select
                    value={day.endTime}
                    onChange={e => setTime(key, "endTime", e.target.value)}
                    style={selectStyle}
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Botón guardar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            marginLeft: "auto",
            height: 44,
            padding: "0 28px",
            borderRadius: 12,
            border: "none",
            background: saving ? "#0369A1" : "linear-gradient(135deg, #0284C7, #0369A1)",
            color: "white",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.8 : 1,
            boxShadow: "0 2px 8px rgba(2,132,199,0.30)",
          }}
        >
          {saving ? "Guardando..." : "Guardar horarios"}
        </button>
      </div>
    </form>
  )
}
