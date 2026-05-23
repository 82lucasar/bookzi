"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Appt = {
  id: string
  startAt: string
  endAt: string
  status: string
  clientName: string
  serviceName: string
}

type ViewMode = "week" | "month"

const MONTHS  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAY_ABBR = ["Lu","Mar","Mié","Jue","Vie","Sáb","Dom"]
const HOUR_H  = 60
const START_H = 8
const HOURS   = Array.from({ length: 12 }, (_, i) => `${String(i + START_H).padStart(2, "0")}:00`)

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  confirmed:   { background: "rgba(2,132,199,0.12)",  borderLeft: "3px solid #0284C7", color: "#0284C7"  },
  pending:     { background: "rgba(245,158,11,0.12)", borderLeft: "3px solid #F59E0B", color: "#B45309"  },
  completed:   { background: "rgba(5,150,105,0.12)",  borderLeft: "3px solid #059669", color: "#047857"  },
  rescheduled: { background: "rgba(2,132,199,0.08)",  borderLeft: "3px solid #0284C7", color: "#0369A1"  },
}

function getWeekMonday(weekOffset: number): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dow = today.getDay()
  const daysBack = dow === 0 ? 6 : dow - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysBack + weekOffset * 7)
  return monday
}

function sameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export default function AgendaCalendar({ appointments }: { appointments: Appt[] }) {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>("week")
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // ─── Week view ─────────────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const monday = getWeekMonday(weekOffset)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [weekOffset])

  const periodLabel = useMemo(() => {
    if (view === "week") {
      const first = weekDays[0]!
      const last  = weekDays[6]!
      return `${first.getDate()} ${MONTHS[first.getMonth()]!.slice(0, 3)} — ${last.getDate()} ${MONTHS[last.getMonth()]!.slice(0, 3)}`
    }
    const now = new Date()
    const m = ((now.getMonth() + monthOffset) % 12 + 12) % 12
    const y = now.getFullYear() + Math.floor((now.getMonth() + monthOffset) / 12)
    return `${MONTHS[m]} ${y}`
  }, [view, weekOffset, monthOffset, weekDays])

  function apptsByDay(day: Date): Appt[] {
    return appointments.filter(a => sameDay(new Date(a.startAt), day))
  }

  // ─── Month view ─────────────────────────────────────────────────────────
  const { currentMonth, currentYear, monthCells } = useMemo(() => {
    const now = new Date()
    const m   = ((now.getMonth() + monthOffset) % 12 + 12) % 12
    const y   = now.getFullYear() + Math.floor((now.getMonth() + monthOffset) / 12)
    const cells: { n: number; type: "prev"|"cur"|"next"; isToday: boolean; hasPending: boolean; hasConfirmed: boolean }[] = []
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7
    const lastDate = new Date(y, m + 1, 0).getDate()
    const prevLast = new Date(y, m, 0).getDate()

    for (let i = 0; i < firstDow; i++) cells.push({ n: prevLast - firstDow + 1 + i, type: "prev", isToday: false, hasPending: false, hasConfirmed: false })
    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(y, m, d)
      const dayAppts = appointments.filter(a => sameDay(new Date(a.startAt), date))
      cells.push({
        n: d, type: "cur",
        isToday: sameDay(date, today),
        hasPending: dayAppts.some(a => a.status === "pending"),
        hasConfirmed: dayAppts.some(a => a.status === "confirmed" || a.status === "completed"),
      })
    }
    const left = 42 - cells.length
    for (let d = 1; d <= left; d++) cells.push({ n: d, type: "next", isToday: false, hasPending: false, hasConfirmed: false })

    return { currentMonth: m, currentYear: y, monthCells: cells }
  }, [monthOffset, appointments, today])

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="back-btn" onClick={() => router.push("/dashboard")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Agenda</span>
        </div>
        <Link href="/dashboard/appointments/new">
          <button className="btn btn-primary btn-sm">+ Nuevo turno</button>
        </Link>
      </header>

      {/* Sub-header */}
      <div style={{ background: "var(--bg-white)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 56, zIndex: 40 }}>
        <div style={{ display: "inline-flex", background: "var(--bg-muted)", borderRadius: 10, padding: 3, gap: 2 }}>
          {(["week", "month"] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "var(--font)", border: "none", cursor: "pointer", background: view === v ? "var(--primary)" : "none", color: view === v ? "#fff" : "var(--text-muted)", transition: "all 150ms" }}
            >
              {v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mid)" }}
            onClick={() => view === "week" ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1)}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 10L4.5 6.5 8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", minWidth: 130, textAlign: "center" }}>{periodLabel}</span>
          <button
            style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mid)" }}
            onClick={() => view === "week" ? setWeekOffset(o => o + 1) : setMonthOffset(o => o + 1)}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 3l3.5 3.5L5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* ─── Vista semana ─────────────────────────────────────────────── */}
      {view === "week" && (
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Cabecera de días */}
          <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", background: "var(--bg-white)", borderBottom: "1px solid var(--border)", position: "sticky", top: 112, zIndex: 30, padding: "0 8px" }}>
            <div/>
            {weekDays.map((day, i) => {
              const isToday = sameDay(day, today)
              return (
                <div key={i} style={{ textAlign: "center", padding: "10px 4px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{DAY_ABBR[i]}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isToday ? "#fff" : "var(--text-dark)", width: 32, height: 32, borderRadius: "50%", background: isToday ? "var(--primary)" : "none", display: "flex", alignItems: "center", justifyContent: "center", margin: "4px auto 0" }}>
                    {day.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cuerpo de la semana */}
          <div style={{ overflowX: "auto", paddingBottom: 80 }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", minWidth: 480, padding: "0 8px" }}>
              {/* Columna de horas */}
              <div>
                {HOURS.map(h => (
                  <div key={h} style={{ height: HOUR_H, display: "flex", alignItems: "flex-start", paddingTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textAlign: "right", paddingRight: 8, width: "100%" }}>{h}</span>
                  </div>
                ))}
              </div>
              {/* Columnas de días */}
              {weekDays.map((day, di) => {
                const dayAppts = apptsByDay(day)
                return (
                  <div key={di} style={{ borderLeft: "1px solid var(--border)", position: "relative" }}>
                    {HOURS.map((_, i) => (
                      <div key={i} style={{ height: HOUR_H, borderBottom: "1px solid var(--bg-muted)", background: i % 2 === 1 ? "rgba(240,249,255,0.5)" : "none" }}/>
                    ))}
                    {/* Línea de hora actual */}
                    {sameDay(day, today) && (() => {
                      const now = new Date()
                      const h = now.getHours() + now.getMinutes() / 60
                      if (h < START_H || h > START_H + HOURS.length) return null
                      const top = (h - START_H) * HOUR_H
                      return (
                        <div style={{ position: "absolute", left: 0, right: 0, top, height: 2, background: "var(--error)", zIndex: 10 }}>
                          <div style={{ position: "absolute", left: -4, top: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--error)" }}/>
                        </div>
                      )
                    })()}
                    {/* Bloques de turnos */}
                    {dayAppts.map(appt => {
                      const start = new Date(appt.startAt)
                      const end   = new Date(appt.endAt)
                      const sh = start.getHours() + start.getMinutes() / 60
                      const eh = end.getHours() + end.getMinutes() / 60
                      const top    = Math.max(0, (sh - START_H) * HOUR_H)
                      const height = Math.max(20, (eh - sh) * HOUR_H - 4)
                      const style  = STATUS_STYLE[appt.status] ?? STATUS_STYLE.confirmed!
                      return (
                        <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ position: "absolute", left: 3, right: 3, top, height, borderRadius: "0 6px 6px 0", padding: "4px 6px", fontSize: 11, fontWeight: 600, cursor: "pointer", zIndex: 5, overflow: "hidden", ...style }}>
                            {appt.clientName}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Vista mes ────────────────────────────────────────────────── */}
      {view === "month" && (
        <div style={{ padding: "16px 16px 80px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", padding: "6px 0", textTransform: "uppercase" }}>{d}</div>
            ))}
            {monthCells.map((cell, i) => {
              const date = new Date(currentYear, currentMonth, cell.n)
              const dayAppts = cell.type === "cur" ? appointments.filter(a => sameDay(new Date(a.startAt), date)) : []
              return (
                <div
                  key={i}
                  onClick={() => { if (cell.type === "cur" && dayAppts.length > 0) router.push(`/dashboard/appointments?filter=upcoming`) }}
                  style={{
                    background: "var(--bg-white)",
                    border: cell.isToday ? "2px solid var(--primary)" : "1px solid var(--border)",
                    borderRadius: 10, minHeight: 70, padding: 8,
                    cursor: dayAppts.length > 0 ? "pointer" : "default",
                    display: "flex", flexDirection: "column", gap: 4,
                    opacity: cell.type !== "cur" ? 0.4 : 1,
                    transition: "box-shadow 150ms",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: cell.isToday ? "var(--primary)" : "var(--text-dark)" }}>{cell.n}</div>
                  {dayAppts.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {dayAppts.slice(0, 3).map(a => (
                        <div key={a.id} style={{ width: 6, height: 6, borderRadius: "50%", background: a.status === "pending" ? "#F59E0B" : "#059669" }}/>
                      ))}
                      {dayAppts.length > 3 && <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>+{dayAppts.length - 3}</span>}
                    </div>
                  )}
                  {dayAppts.length > 0 && (
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
                      {dayAppts.length} turno{dayAppts.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      <Link href="/dashboard/appointments/new">
        <button className="fab">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
        </button>
      </Link>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/dashboard" className="nav-item">
          <svg viewBox="0 0 22 22" fill="none"><rect x="1" y="1" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/><rect x="13" y="1" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/><rect x="1" y="13" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/><rect x="13" y="13" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/></svg>
          Inicio
        </Link>
        <Link href="/dashboard/agenda" className="nav-item active">
          <svg viewBox="0 0 22 22" fill="none"><rect x="1" y="3" width="20" height="17" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M6 1v4M16 1v4M1 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Agenda
        </Link>
        <Link href="/dashboard/appointments/new" className="nav-item">
          <svg viewBox="0 0 22 22" fill="none"><path d="M2 5h18M2 11h12M2 17h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          Turnos
        </Link>
        <Link href="/dashboard/profile" className="nav-item">
          <svg viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M2 20c0-3.5 4-6 9-6s9 2.5 9 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Perfil
        </Link>
      </nav>

    </div>
  )
}
