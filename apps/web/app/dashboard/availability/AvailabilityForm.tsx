"use client"

import { useState } from "react"
import { saveAvailability, type DayConfig } from "@/lib/actions/availability"

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
}

const TIMES = Array.from({ length: 29 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 30
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
  const m = (totalMinutes % 60).toString().padStart(2, "0")
  return `${h}:${m}`
})

export default function AvailabilityForm({ initial }: { initial: DayConfig[] }) {
  const [schedule, setSchedule] = useState(initial)
  const [saved, setSaved] = useState(false)

  function toggle(day: string) {
    setSchedule((s) =>
      s.map((d) => d.day === day ? { ...d, isActive: !d.isActive } : d)
    )
    setSaved(false)
  }

  function setTime(day: string, field: "startTime" | "endTime", value: string) {
    setSchedule((s) =>
      s.map((d) => d.day === day ? { ...d, [field]: value } : d)
    )
    setSaved(false)
  }

  async function handleSubmit(formData: FormData) {
    await saveAvailability(formData)
    setSaved(true)
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      {schedule.map(({ day, isActive, startTime, endTime }) => (
        <div
          key={day}
          className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 transition-opacity ${
            isActive ? "border-[var(--color-border)]" : "border-[var(--color-border)] opacity-50"
          }`}
        >
          {/* Toggle activo */}
          <input type="hidden" name={`${day}_active`} value="off" />
          <label className="flex items-center gap-3 cursor-pointer select-none w-32">
            <input
              type="checkbox"
              name={`${day}_active`}
              value="on"
              checked={isActive}
              onChange={() => toggle(day)}
              className="w-4 h-4 accent-[var(--color-primary)]"
            />
            <span className="text-sm font-semibold text-[var(--color-text-dark)]">
              {DAY_LABELS[day]}
            </span>
          </label>

          {/* Horarios */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              name={`${day}_start`}
              value={startTime}
              disabled={!isActive}
              onChange={(e) => setTime(day, "startTime", e.target.value)}
              className="h-9 px-2 rounded-lg border border-[var(--color-border)] text-sm bg-white disabled:bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <span className="text-[var(--color-text-muted)] text-sm">a</span>

            <select
              name={`${day}_end`}
              value={endTime}
              disabled={!isActive}
              onChange={(e) => setTime(day, "endTime", e.target.value)}
              className="h-9 px-2 rounded-lg border border-[var(--color-border)] text-sm bg-white disabled:bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between mt-2">
        {saved && (
          <span className="text-sm text-[var(--color-accent)] font-medium">
            ✓ Horarios guardados
          </span>
        )}
        <button
          type="submit"
          className="ml-auto h-10 px-6 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          Guardar horarios
        </button>
      </div>
    </form>
  )
}
