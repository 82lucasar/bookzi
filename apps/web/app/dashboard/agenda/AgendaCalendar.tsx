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

const TZ      = "America/Argentina/Buenos_Aires"
const MONTHS  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const MONTH_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const DAY_CHIP_LABELS = ["L","M","X","J","V","S","D"]

const HOUR_H = 64   // px por hora
const START_H = 7   // 07:00
const END_H   = 24  // 24:00
const HOURS   = Array.from({ length: END_H - START_H }, (_, i) => i + START_H)

const STATUS_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  confirmed:   { bg: "rgba(2,132,199,0.12)",   border: "#0284C7", text: "#0369A1" },
  pending:     { bg: "rgba(245,158,11,0.12)",  border: "#F59E0B", text: "#B45309" },
  completed:   { bg: "rgba(5,150,105,0.12)",   border: "#059669", text: "#047857" },
  cancelled:   { bg: "rgba(220,38,38,0.09)",   border: "#DC2626", text: "#B91C1C" },
  rescheduled: { bg: "rgba(2,132,199,0.09)",   border: "#0284C7", text: "#0369A1" },
}
const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmado", pending: "Pendiente", completed: "Completado",
  cancelled: "Cancelado",  rescheduled: "Reprogramado",
}

function getWeekDays(weekOffset: number): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dow = today.getDay()
  const daysBack = dow === 0 ? 6 : dow - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysBack + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

// Hora decimal en timezone Argentina usando Intl
function localH(dateStr: string): number {
  const d = new Date(dateStr)
  const parts = new Intl.DateTimeFormat("en-CA", {
    hour: "numeric", minute: "numeric", hour12: false, timeZone: TZ,
  }).formatToParts(d)
  const h = parseInt(parts.find(p => p.type === "hour")?.value ?? "0")
  const m = parseInt(parts.find(p => p.type === "minute")?.value ?? "0")
  return h + m / 60
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })
}

// Calcula col/cols para appointments solapados en un día
function layoutAppts(appts: Appt[]): Map<string, { col: number; cols: number }> {
  const result = new Map<string, { col: number; cols: number }>()
  if (!appts.length) return result

  const sorted = [...appts].sort((a, b) =>
    new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  )

  // Agrupa por solapamiento
  const groups: Appt[][] = []
  let group: Appt[] = []
  let maxEnd = -Infinity

  for (const a of sorted) {
    const start = new Date(a.startAt).getTime()
    const end   = new Date(a.endAt).getTime()
    if (!group.length || start < maxEnd) {
      group.push(a)
      maxEnd = Math.max(maxEnd, end)
    } else {
      groups.push(group)
      group  = [a]
      maxEnd = end
    }
  }
  if (group.length) groups.push(group)

  for (const g of groups) {
    const cols: Appt[][] = []
    for (const a of g) {
      const start = new Date(a.startAt).getTime()
      let placed  = false
      for (let ci = 0; ci < cols.length; ci++) {
        const col  = cols[ci]
        const last = col && col.length > 0 ? col[col.length - 1] : undefined
        if (col && last && new Date(last.endAt).getTime() <= start) {
          col.push(a)
          placed = true
          break
        }
      }
      if (!placed) cols.push([a])
    }
    cols.forEach((col, ci) =>
      col.forEach(a => result.set(a.id, { col: ci, cols: cols.length }))
    )
  }
  return result
}

export default function AgendaCalendar({ appointments }: { appointments: Appt[] }) {
  const router = useRouter()
  const today  = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const [view,        setView]        = useState<ViewMode>("week")
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [selDayIdx,   setSelDayIdx]   = useState<number>(() => {
    // Arrancar en el día de hoy (0=lun … 6=dom)
    const dow = new Date().getDay()
    return dow === 0 ? 6 : dow - 1
  })

  // ── Semana ──────────────────────────────────────────────────────────────
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const selDay   = weekDays[selDayIdx] ?? weekDays[0]!

  const selDayAppts = useMemo(
    () => appointments.filter(a => sameDay(new Date(a.startAt), selDay)),
    [appointments, selDay]
  )
  const overlapMap = useMemo(() => layoutAppts(selDayAppts), [selDayAppts])

  const periodLabel = useMemo(() => {
    if (view === "week") {
      const f = weekDays[0]!
      const l = weekDays[6]!
      return `${f.getDate()} ${MONTH_SHORT[f.getMonth()]} — ${l.getDate()} ${MONTH_SHORT[l.getMonth()]}`
    }
    const now = new Date()
    const m   = ((now.getMonth() + monthOffset) % 12 + 12) % 12
    const y   = now.getFullYear() + Math.floor((now.getMonth() + monthOffset) / 12)
    return `${MONTHS[m]} ${y}`
  }, [view, weekOffset, monthOffset, weekDays])

  // ── Mes ─────────────────────────────────────────────────────────────────
  const { currentMonth, currentYear, monthCells } = useMemo(() => {
    const now = new Date()
    const m   = ((now.getMonth() + monthOffset) % 12 + 12) % 12
    const y   = now.getFullYear() + Math.floor((now.getMonth() + monthOffset) / 12)
    const cells: {
      n: number; type: "prev"|"cur"|"next"; isToday: boolean
      appts: Appt[]
    }[] = []

    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7
    const lastDate = new Date(y, m + 1, 0).getDate()
    const prevLast = new Date(y, m, 0).getDate()

    for (let i = 0; i < firstDow; i++)
      cells.push({ n: prevLast - firstDow + 1 + i, type: "prev", isToday: false, appts: [] })
    for (let d = 1; d <= lastDate; d++) {
      const date     = new Date(y, m, d)
      const dayAppts = appointments.filter(a => sameDay(new Date(a.startAt), date))
      cells.push({ n: d, type: "cur", isToday: sameDay(date, today), appts: dayAppts })
    }
    for (let d = 1; d <= 42 - cells.length; d++)
      cells.push({ n: d, type: "next", isToday: false, appts: [] })

    return { currentMonth: m, currentYear: y, monthCells: cells }
  }, [monthOffset, appointments, today])

  // ── Helpers UI ───────────────────────────────────────────────────────────
  const isNowInView = weekOffset === 0

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="back-btn" onClick={() => router.push("/dashboard")} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mid)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Agenda</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/dashboard/appointments/new" style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 10, background: "linear-gradient(135deg, var(--primary), #0369A1)", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 8px rgba(2,132,199,0.28)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            Nuevo turno
          </Link>
          <a href="/dashboard" className="logo-home-btn">B</a>
        </div>
      </header>

      {/* ── Sub-header: toggle + nav ── */}
      <div style={{ background: "var(--bg-white)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 56, zIndex: 40 }}>
        {/* Toggle Semana/Mes */}
        <div style={{ display: "inline-flex", background: "var(--bg-muted)", borderRadius: 10, padding: 3, gap: 2 }}>
          {(["week","month"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "var(--font)", border: "none", cursor: "pointer", background: view === v ? "var(--primary)" : "none", color: view === v ? "#fff" : "var(--text-muted)", transition: "all 150ms" }}>
              {v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
        {/* Nav período */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg-muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mid)" }}
            onClick={() => view === "week" ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 10L4.5 6.5 8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dark)", minWidth: 120, textAlign: "center" }}>{periodLabel}</span>
          <button style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg-muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mid)" }}
            onClick={() => view === "week" ? setWeekOffset(o => o + 1) : setMonthOffset(o => o + 1)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 3l3.5 3.5L4 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* ══ VISTA SEMANA ═══════════════════════════════════════════════════ */}
      {view === "week" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tira de 7 chips de días */}
          <div style={{ background: "var(--bg-white)", borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", gap: 8, overflowX: "auto", position: "sticky", top: 106, zIndex: 30 }}>
            {weekDays.map((day, i) => {
              const isToday = sameDay(day, today)
              const isSel   = i === selDayIdx
              const hasAppt = appointments.some(a => sameDay(new Date(a.startAt), day))
              return (
                <button
                  key={i}
                  onClick={() => setSelDayIdx(i)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "8px 10px", borderRadius: 14, border: "none", cursor: "pointer", flexShrink: 0,
                    background: isSel ? "var(--primary)" : isToday ? "rgba(2,132,199,0.08)" : "var(--bg-muted)",
                    outline: isToday && !isSel ? "1.5px solid var(--primary)" : "none",
                    transition: "background 150ms",
                    minWidth: 44,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: isSel ? "rgba(255,255,255,0.8)" : "var(--text-muted)" }}>
                    {DAY_CHIP_LABELS[i]}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: isSel ? "#fff" : isToday ? "var(--primary)" : "var(--text-dark)", lineHeight: 1 }}>
                    {day.getDate()}
                  </span>
                  {/* Dot si hay turnos */}
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: hasAppt ? (isSel ? "rgba(255,255,255,0.7)" : "var(--primary)") : "transparent" }} />
                </button>
              )
            })}
          </div>

          {/* Cabecera del día seleccionado */}
          <div style={{ background: "var(--bg-white)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)" }}>
                {selDay.toLocaleDateString("es-AR", { weekday: "long", timeZone: TZ }).replace(/^\w/, c => c.toUpperCase())}
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-muted)", marginLeft: 6 }}>
                {selDay.getDate()} de {MONTHS[selDay.getMonth()]}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: selDayAppts.length > 0 ? "var(--primary)" : "var(--text-muted)", background: selDayAppts.length > 0 ? "rgba(2,132,199,0.10)" : "var(--bg-muted)", padding: "4px 10px", borderRadius: 20 }}>
              {selDayAppts.length === 0 ? "Sin turnos" : `${selDayAppts.length} turno${selDayAppts.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* Timeline del día seleccionado */}
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>

            {selDayAppts.length === 0 ? (
              /* Estado vacío */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 32px", gap: 12, textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(2,132,199,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="2" y="4" width="24" height="20" rx="4" stroke="var(--primary)" strokeWidth="1.8"/>
                    <path d="M8 2v4M20 2v4M2 12h24" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M9 18h10M9 22h6" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" opacity=".5"/>
                  </svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-dark)" }}>Sin turnos este día</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 220 }}>No hay turnos agendados. Podés crear uno nuevo desde el botón de arriba.</p>
                <Link href="/dashboard/appointments/new" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 12, background: "var(--primary)", color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                  + Nuevo turno
                </Link>
              </div>
            ) : (
              /* Grid de tiempo con turnos */
              <div style={{ position: "relative", display: "flex" }}>

                {/* Columna de horas */}
                <div style={{ width: 52, flexShrink: 0 }}>
                  {HOURS.map(h => (
                    <div key={h} style={{ height: HOUR_H, display: "flex", alignItems: "flex-start", paddingTop: 6, paddingRight: 8, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>
                        {String(h).padStart(2,"0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Área de turnos */}
                <div style={{ flex: 1, position: "relative", borderLeft: "1px solid var(--border)", marginRight: 16 }}>
                  {/* Líneas de hora */}
                  {HOURS.map((h, i) => (
                    <div key={h} style={{ height: HOUR_H, borderBottom: `1px solid ${i % 2 === 0 ? "var(--border)" : "var(--bg-muted)"}`, background: i % 2 === 1 ? "rgba(240,249,255,0.4)" : "transparent" }} />
                  ))}

                  {/* Línea de hora actual */}
                  {sameDay(selDay, today) && (() => {
                    const now = new Date()
                    const hd  = now.getHours() + now.getMinutes() / 60
                    if (hd < START_H || hd >= END_H) return null
                    return (
                      <div style={{ position: "absolute", left: 0, right: 0, top: (hd - START_H) * HOUR_H, zIndex: 20, display: "flex", alignItems: "center" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--error)", flexShrink: 0, marginLeft: -4 }} />
                        <div style={{ flex: 1, height: 2, background: "var(--error)" }} />
                      </div>
                    )
                  })()}

                  {/* Bloques de turnos */}
                  {selDayAppts.map(appt => {
                    const sh     = localH(appt.startAt)
                    const eh     = localH(appt.endAt)
                    const top    = Math.max(0, (sh - START_H) * HOUR_H)
                    const height = Math.max(28, (eh - sh) * HOUR_H - 4)
                    const layout = overlapMap.get(appt.id) ?? { col: 0, cols: 1 }
                    const pct    = 100 / layout.cols
                    const sc     = STATUS_COLOR[appt.status] ?? STATUS_COLOR.confirmed!
                    const showService = height >= 44
                    const showBadge  = height >= 56

                    return (
                      <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`} style={{ textDecoration: "none" }}>
                        <div style={{
                          position: "absolute",
                          top,
                          height: height - 2,
                          left: `calc(${layout.col * pct}% + 4px)`,
                          width: `calc(${pct}% - 8px)`,
                          borderRadius: 10,
                          background: sc.bg,
                          borderLeft: `3px solid ${sc.border}`,
                          padding: "6px 8px",
                          overflow: "hidden",
                          zIndex: 10,
                          cursor: "pointer",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                          display: "flex", flexDirection: "column", gap: 2,
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: sc.text, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {appt.clientName}
                          </span>
                          {showService && (
                            <span style={{ fontSize: 11, fontWeight: 500, color: sc.text, opacity: 0.8, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {appt.serviceName}
                            </span>
                          )}
                          {showBadge && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: sc.text, opacity: 0.7 }}>
                              {fmtTime(appt.startAt)} — {fmtTime(appt.endAt)}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ VISTA MES ══════════════════════════════════════════════════════ */}
      {view === "month" && (
        <div style={{ padding: "14px 14px 90px", flex: 1, overflowY: "auto" }}>
          {/* Cabecera días de la semana */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", padding: "4px 0", textTransform: "uppercase" }}>{d}</div>
            ))}
          </div>
          {/* Grilla */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {monthCells.map((cell, i) => {
              const isOther = cell.type !== "cur"
              const pending   = cell.appts.filter(a => a.status === "pending")
              const confirmed = cell.appts.filter(a => a.status === "confirmed" || a.status === "completed")
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (!isOther && cell.appts.length > 0) {
                      // Switch to week view on that day
                      // Calculate which weekOffset and dayIdx corresponds to this date
                      const date = new Date(currentYear, currentMonth, cell.n)
                      const now  = new Date(); now.setHours(0,0,0,0)
                      const diffDays = Math.round((date.getTime() - now.getTime()) / 86400000)
                      const dow = date.getDay()
                      const dayIdx = dow === 0 ? 6 : dow - 1
                      const newDaysBack = dayIdx
                      const monday = new Date(date)
                      monday.setDate(date.getDate() - newDaysBack)
                      const nowMonday = new Date(now)
                      const nowDow = now.getDay()
                      nowMonday.setDate(now.getDate() - (nowDow === 0 ? 6 : nowDow - 1))
                      const diffWeeks = Math.round((monday.getTime() - nowMonday.getTime()) / (7 * 86400000))
                      setWeekOffset(diffWeeks)
                      setSelDayIdx(dayIdx)
                      setView("week")
                    }
                  }}
                  style={{
                    background: cell.isToday ? "rgba(2,132,199,0.06)" : "var(--bg-white)",
                    border: cell.isToday ? "2px solid var(--primary)" : "1px solid var(--border)",
                    borderRadius: 12, minHeight: 72, padding: "8px 6px",
                    cursor: !isOther && cell.appts.length > 0 ? "pointer" : "default",
                    display: "flex", flexDirection: "column", gap: 4,
                    opacity: isOther ? 0.35 : 1,
                    transition: "box-shadow 150ms",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: cell.isToday ? "var(--primary)" : "var(--text-dark)", lineHeight: 1 }}>
                    {cell.n}
                  </div>

                  {cell.appts.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
                      {cell.appts.slice(0, 2).map(a => {
                        const sc = STATUS_COLOR[a.status] ?? STATUS_COLOR.confirmed!
                        return (
                          <div key={a.id} style={{ fontSize: 10, fontWeight: 600, color: sc.text, background: sc.bg, borderRadius: 4, padding: "2px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", borderLeft: `2px solid ${sc.border}` }}>
                            {fmtTime(a.startAt)} {a.clientName.split(" ")[0]}
                          </div>
                        )
                      })}
                      {cell.appts.length > 2 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", paddingLeft: 2 }}>
                          +{cell.appts.length - 2} más
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

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
