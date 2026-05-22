"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type ViewMode = "week" | "month"

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"]
const HOUR_H = 60
const START_H = 8

const APPTS: [number, number, number, string, string][] = [
  [1, 9.5, 1, "Valentina R.", "default"],
  [1, 10.5, 1.5, "Diego Á.", "default"],
  [2, 9, 1, "Ana M.", "warning"],
  [2, 14, 1, "Javier T.", "default"],
  [2, 15.5, 1, "Carlos M.", "warning"],
  [3, 10, 1, "Laura P.", "accent"],
  [3, 14.5, 1.5, "Marcos S.", "default"],
  [4, 9.5, 1, "Rosa V.", "default"],
  [4, 11, 1, "Pedro L.", "default"],
  [5, 10, 1, "Natalia G.", "accent"],
  [5, 14, 1, "Tomás R.", "default"],
]

const APPT_DOT_DAYS: Record<number, "green"|"yellow"> = {
  9:"green",10:"green",11:"yellow",12:"green",13:"yellow",
  16:"green",17:"green",18:"green",19:"green",20:"yellow",
  24:"green",25:"green"
}

export default function AgendaPage() {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>("week")
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  const BASE_MONTH = 5
  const BASE_YEAR  = 2025

  const currentMonth = ((BASE_MONTH + monthOffset) % 12 + 12) % 12
  const currentYear  = BASE_YEAR + Math.floor((BASE_MONTH + monthOffset) / 12)
  const periodLabel  = view === "week"
    ? `${9 + weekOffset * 7}–${15 + weekOffset * 7} Jun`
    : `${MONTHS[currentMonth]} ${currentYear}`

  const monthCells = (() => {
    const cells: { n: number; type: "prev"|"cur"|"next"; isToday: boolean; dotColor: string|null }[] = []
    const firstDow = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate()
    const prevLast = new Date(currentYear, currentMonth, 0).getDate()
    const today = { y: 2025, m: 5, d: 10 }

    for (let i = 0; i < firstDow; i++) {
      cells.push({ n: prevLast - firstDow + 1 + i, type: "prev", isToday: false, dotColor: null })
    }
    for (let d = 1; d <= lastDate; d++) {
      const isToday = currentYear === today.y && currentMonth === today.m && d === today.d
      cells.push({ n: d, type: "cur", isToday, dotColor: APPT_DOT_DAYS[d] ?? null })
    }
    const left = 42 - cells.length
    for (let d = 1; d <= left; d++) cells.push({ n: d, type: "next", isToday: false, dotColor: null })
    return cells
  })()

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

      {/* Sub header */}
      <div style={{ background: "var(--bg-white)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 56, zIndex: 40 }}>
        <div style={{ display: "inline-flex", background: "var(--bg-muted)", borderRadius: 10, padding: 3, gap: 2 }}>
          <button
            style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "var(--font)", border: "none", cursor: "pointer", background: view === "week" ? "var(--primary)" : "none", color: view === "week" ? "#fff" : "var(--text-muted)", transition: "all 150ms" }}
            onClick={() => setView("week")}
          >Semana</button>
          <button
            style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "var(--font)", border: "none", cursor: "pointer", background: view === "month" ? "var(--primary)" : "none", color: view === "month" ? "#fff" : "var(--text-muted)", transition: "all 150ms" }}
            onClick={() => setView("month")}
          >Mes</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mid)" }}
            onClick={() => view === "week" ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1)}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 10L4.5 6.5 8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", minWidth: 100, textAlign: "center" }}>{periodLabel}</span>
          <button
            style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mid)" }}
            onClick={() => view === "week" ? setWeekOffset(o => o + 1) : setMonthOffset(o => o + 1)}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 3l3.5 3.5L5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* Week View */}
      {view === "week" && (
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", background: "var(--bg-white)", borderBottom: "1px solid var(--border)", position: "sticky", top: 112, zIndex: 30, padding: "0 8px" }}>
            <div></div>
            {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d, i) => {
              const dayNum = 9 + i + weekOffset * 7
              return (
                <div key={d} style={{ textAlign: "center", padding: "10px 4px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{d}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: i === 1 ? "#fff" : "var(--text-dark)", width: 32, height: 32, borderRadius: "50%", background: i === 1 ? "var(--primary)" : "none", display: "flex", alignItems: "center", justifyContent: "center", margin: "4px auto 0" }}>{dayNum}</div>
                </div>
              )
            })}
          </div>

          {/* Week body */}
          <div style={{ overflowX: "auto", paddingBottom: 80 }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", minWidth: 480, padding: "0 8px" }}>
              {/* Time col */}
              <div>
                {HOURS.map(h => (
                  <div key={h} style={{ height: HOUR_H, display: "flex", alignItems: "flex-start", paddingTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textAlign: "right", paddingRight: 8, width: "100%" }}>{h}</span>
                  </div>
                ))}
              </div>
              {/* Day cols */}
              {[1,2,3,4,5,6,7].map(d => (
                <div key={d} style={{ borderLeft: "1px solid var(--border)", position: "relative" }}>
                  {HOURS.map((_, i) => (
                    <div key={i} style={{ height: HOUR_H, borderBottom: "1px solid var(--bg-muted)", background: i % 2 === 1 ? "rgba(240,249,255,0.5)" : "none" }}></div>
                  ))}
                  {APPTS.filter(a => a[0] === d).map(([,startH, dur, title, type], i) => {
                    const top = (startH - START_H) * HOUR_H
                    const height = dur * HOUR_H - 4
                    const styles: Record<string, React.CSSProperties> = {
                      default: { background: "rgba(2,132,199,0.12)", borderLeft: "3px solid var(--primary)", color: "var(--primary)" },
                      accent:  { background: "rgba(5,150,105,0.12)",  borderLeft: "3px solid #059669", color: "#047857" },
                      warning: { background: "rgba(245,158,11,0.12)", borderLeft: "3px solid #F59E0B", color: "#B45309" },
                    }
                    return (
                      <Link key={i} href="/dashboard/appointments/1" style={{ textDecoration: "none" }}>
                        <div style={{ position: "absolute", left: 3, right: 3, top, height, borderRadius: "0 6px 6px 0", padding: "4px 6px", fontSize: 11, fontWeight: 600, cursor: "pointer", zIndex: 5, overflow: "hidden", transition: "background 150ms", ...styles[type] }}>
                          {title}
                        </div>
                      </Link>
                    )
                  })}
                  {d === 2 && (
                    <div style={{ position: "absolute", left: 0, right: 0, top: (10.25 - START_H) * HOUR_H, height: 2, background: "var(--error)", zIndex: 10 }}>
                      <div style={{ position: "absolute", left: -4, top: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--error)" }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Month View */}
      {view === "month" && (
        <div style={{ padding: "16px 16px 80px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", padding: "6px 0", textTransform: "uppercase" }}>{d}</div>
            ))}
            {monthCells.map((cell, i) => (
              <Link key={i} href="/dashboard/appointments/1" style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--bg-white)",
                  border: cell.isToday ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: 10, minHeight: 70, padding: 8, cursor: "pointer",
                  transition: "box-shadow 150ms", display: "flex", flexDirection: "column", gap: 4,
                  opacity: cell.type !== "cur" ? 0.4 : 1
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: cell.isToday ? "var(--primary)" : "var(--text-dark)" }}>{cell.n}</div>
                  {cell.dotColor && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: cell.dotColor === "green" ? "var(--accent)" : "var(--warning)" }}></div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
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
        <Link href="#" className="nav-item">
          <svg viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M2 20c0-3.5 4-6 9-6s9 2.5 9 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Perfil
        </Link>
      </nav>

    </div>
  )
}
