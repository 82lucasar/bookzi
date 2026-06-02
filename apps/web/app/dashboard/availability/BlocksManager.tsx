"use client"

import { useState, useTransition } from "react"
import { createBlock, deleteBlock, type BlockItem } from "@/lib/actions/blocks"

const TZ = "America/Argentina/Buenos_Aires"

function formatBlockDate(startsAt: Date, endsAt: Date): string {
  const start = new Date(startsAt)
  const end   = new Date(endsAt)

  const startDateStr = start.toLocaleDateString("es-AR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })
  const endDateStr   = end.toLocaleDateString("es-AR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })

  const startTime = start.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
  const endTime   = end.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })

  const isAllDay = startTime === "00:00" && endTime === "23:59"
  const isSameDay = startDateStr === endDateStr

  if (isSameDay) {
    return isAllDay
      ? `${startDateStr} — todo el día`
      : `${startDateStr} · ${startTime}–${endTime}`
  }
  return isAllDay
    ? `${startDateStr} → ${endDateStr}`
    : `${startDateStr} ${startTime} → ${endDateStr} ${endTime}`
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ })
}

export default function BlocksManager({
  initial,
}: {
  initial: BlockItem[]
}) {
  const [blocks, setBlocks] = useState<BlockItem[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form state
  const today = todayStr()
  const [date,      setDate]      = useState(today)
  const [endDate,   setEndDate]   = useState(today)
  const [startTime, setStartTime] = useState("00:00")
  const [endTime,   setEndTime]   = useState("23:59")
  const [allDay,    setAllDay]    = useState(true)
  const [reason,    setReason]    = useState("")
  const [error,     setError]     = useState<string | null>(null)

  function handleAllDayToggle(v: boolean) {
    setAllDay(v)
    if (v) { setStartTime("00:00"); setEndTime("23:59") }
  }

  function handleDateChange(v: string) {
    setDate(v)
    if (endDate < v) setEndDate(v)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createBlock({ date, endDate, startTime, endTime, reason })
      if (res && "error" in res && res.error) {
        setError(res.error)
        return
      }
      // Optimistic: reload page data (revalidatePath fires on server)
      // For now, just close the form; the page will revalidate
      setShowForm(false)
      setDate(today); setEndDate(today)
      setStartTime("00:00"); setEndTime("23:59")
      setAllDay(true); setReason("")
      // Remove from UI after a tick so the list refreshes from server
      window.location.reload()
    })
  }

  async function handleDelete(id: string) {
    setBlocks(b => b.filter(x => x.id !== id))
    startTransition(async () => {
      await deleteBlock(id)
    })
  }

  const inputStyle: React.CSSProperties = {
    height: 42, borderRadius: 10,
    border: "1.5px solid var(--color-border, #E0F0F8)",
    background: "white", color: "var(--color-text-dark, #0F172A)",
    fontSize: 14, fontWeight: 500, padding: "0 12px",
    fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-dark)" }}>Días bloqueados</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Vacaciones, feriados o cualquier momento donde no querés recibir turnos.
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              height: 36, padding: "0 14px", borderRadius: 10, flexShrink: 0,
              border: "1.5px solid var(--color-border, #E0F0F8)",
              background: "white", color: "var(--primary)", fontWeight: 700,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Agregar
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "white", borderRadius: 14,
            border: "1.5px solid rgba(2,132,199,0.20)", padding: "16px",
            display: "flex", flexDirection: "column", gap: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>Nuevo bloqueo</div>

          {/* Dates */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 130, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Desde
              </label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={e => handleDateChange(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: 130, display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Hasta
              </label>
              <input
                type="date"
                value={endDate}
                min={date}
                onChange={e => setEndDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* All-day toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div className="toggle" style={{ flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={allDay}
                onChange={e => handleAllDayToggle(e.target.checked)}
              />
              <div className="toggle-track"></div>
              <div className="toggle-thumb"></div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-mid)" }}>Todo el día</span>
          </label>

          {/* Time range (only if not all-day) */}
          {!allDay && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 120, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Hora inicio
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ alignSelf: "flex-end", paddingBottom: 10, color: "#94A3B8", fontWeight: 700 }}>—</div>
              <div style={{ flex: 1, minWidth: 120, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Hora fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Motivo <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Vacaciones, Feriado, Reunión..."
              maxLength={200}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "var(--error)", fontWeight: 600 }}>{error}</div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              style={{
                height: 38, padding: "0 16px", borderRadius: 10,
                border: "1.5px solid var(--color-border, #E0F0F8)",
                background: "white", color: "var(--text-muted)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                height: 38, padding: "0 20px", borderRadius: 10, border: "none",
                background: isPending ? "#0369A1" : "linear-gradient(135deg, #0284C7, #0369A1)",
                color: "white", fontSize: 13, fontWeight: 700,
                cursor: isPending ? "not-allowed" : "pointer",
                fontFamily: "inherit", opacity: isPending ? 0.8 : 1,
              }}
            >
              {isPending ? "Guardando..." : "Guardar bloqueo"}
            </button>
          </div>
        </form>
      )}

      {/* Block list */}
      {blocks.length === 0 && !showForm ? (
        <div style={{
          background: "#F8FAFC", borderRadius: 12,
          border: "1.5px dashed #E2E8F0",
          padding: "20px 16px", textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>
            No hay días bloqueados próximos.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {blocks.map(block => (
            <div
              key={block.id}
              style={{
                background: "white", borderRadius: 12,
                border: "1.5px solid var(--color-border, #E0F0F8)",
                padding: "12px 14px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "rgba(220,38,38,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round"/>
                    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/>
                    <path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dark)", lineHeight: 1.3 }}>
                    {formatBlockDate(block.startsAt, block.endsAt)}
                  </div>
                  {block.reason && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1, fontWeight: 500 }}>
                      {block.reason}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(block.id)}
                disabled={isPending}
                aria-label="Eliminar bloqueo"
                style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  border: "1.5px solid #FEE2E2", background: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: isPending ? "not-allowed" : "pointer", color: "#DC2626",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
