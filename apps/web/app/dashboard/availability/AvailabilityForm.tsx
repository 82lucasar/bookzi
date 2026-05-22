"use client"

import { useState } from "react"
import { saveAvailability, type DayConfig } from "@/lib/actions/availability"

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
}

const DAY_ABBR: Record<string, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
}

const TIMES = Array.from({ length: 29 }, (_, i) => {
  const t = 7 * 60 + i * 30
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
})

export default function AvailabilityForm({ initial }: { initial: DayConfig[] }) {
  const [schedule, setSchedule] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  function toggle(day: string) {
    setSchedule((s) => s.map((d) => d.day === day ? { ...d, isActive: !d.isActive } : d))
    setSaved(false)
  }

  function setTime(day: string, field: "startTime" | "endTime", value: string) {
    setSchedule((s) => s.map((d) => d.day === day ? { ...d, [field]: value } : d))
    setSaved(false)
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    await saveAvailability(formData)
    setSaved(true)
    setSaving(false)
  }

  const activeDays = schedule.filter((d) => d.isActive).length

  return (
    <form action={handleSubmit}>
      {/* Info */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <p className="font-bold text-[var(--color-text-dark)]">Días y horarios</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {activeDays === 0 ? "Ningún día activo" : `${activeDays} día${activeDays !== 1 ? "s" : ""} activo${activeDays !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {schedule.map((d) => (
              <span
                key={d.day}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={d.isActive
                  ? { background: "rgba(2,132,199,0.12)", color: "var(--color-primary)" }
                  : { background: "var(--color-bg)", color: "var(--color-border)" }
                }
              >
                {DAY_ABBR[d.day]}
              </span>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {schedule.map(({ day, isActive, startTime, endTime }) => (
            <div
              key={day}
              className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                isActive ? "bg-white" : "bg-[var(--color-bg)]"
              }`}
            >
              <input type="hidden" name={`${day}_active`} value="off" />

              {/* Toggle + Label */}
              <label className="flex items-center gap-3 cursor-pointer select-none w-32 shrink-0">
                <div
                  onClick={() => toggle(day)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    isActive ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    isActive ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                  <input
                    type="checkbox"
                    name={`${day}_active`}
                    value="on"
                    checked={isActive}
                    onChange={() => toggle(day)}
                    className="sr-only"
                  />
                </div>
                <span className={`text-sm font-bold ${isActive ? "text-[var(--color-text-dark)]" : "text-[var(--color-text-muted)]"}`}>
                  {DAY_LABELS[day]}
                </span>
              </label>

              {/* Horarios */}
              {isActive ? (
                <div className="flex items-center gap-2 ml-auto">
                  <select
                    name={`${day}_start`}
                    value={startTime}
                    onChange={(e) => setTime(day, "startTime", e.target.value)}
                    className="text-sm font-semibold rounded-xl border border-[var(--color-border)] bg-white py-1.5 px-3 focus:outline-none focus:border-[var(--color-primary)]"
                    style={{ width: "auto" }}
                  >
                    {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-xs font-bold text-[var(--color-text-muted)]">a</span>
                  <select
                    name={`${day}_end`}
                    value={endTime}
                    onChange={(e) => setTime(day, "endTime", e.target.value)}
                    className="text-sm font-semibold rounded-xl border border-[var(--color-border)] bg-white py-1.5 px-3 focus:outline-none focus:border-[var(--color-primary)]"
                    style={{ width: "auto" }}
                  >
                    {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <span className="ml-auto text-xs text-[var(--color-text-muted)] font-medium">No disponible</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        {saved && (
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-accent)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Horarios guardados
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="ml-auto h-11 px-7 rounded-xl font-bold text-sm text-white transition-all"
          style={{
            background: saving ? "#0369A1" : "linear-gradient(135deg, #0284C7, #0369A1)",
            boxShadow: "0 2px 8px rgba(2,132,199,0.3)",
          }}
        >
          {saving ? "Guardando..." : "Guardar horarios"}
        </button>
      </div>
    </form>
  )
}
