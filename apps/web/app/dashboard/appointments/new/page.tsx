"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Step = 1 | 2 | 3
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAYS   = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"]
const TIMES  = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"]
const TAKEN  = new Set(["09:00","11:30","15:00"])

export default function NewAppointmentPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [waToggle, setWaToggle] = useState(true)
  const [emailToggle, setEmailToggle] = useState(true)

  const calCells = useMemo(() => {
    const cells: { n: number; type: "prev"|"cur"|"next"; disabled: boolean }[] = []
    const firstDow = new Date(calYear, calMonth, 1).getDay()
    const lastDate = new Date(calYear, calMonth + 1, 0).getDate()
    const prevLast = new Date(calYear, calMonth, 0).getDate()
    const today = new Date()

    for (let i = 0; i < firstDow; i++) {
      cells.push({ n: prevLast - firstDow + 1 + i, type: "prev", disabled: true })
    }
    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(calYear, calMonth, d)
      const isSun = date.getDay() === 0
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
      cells.push({ n: d, type: "cur", disabled: isSun || isPast })
    }
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      cells.push({ n: d, type: "next", disabled: true })
    }
    return cells
  }, [calYear, calMonth])

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
    setSelectedDay(null); setSelectedSlot(null)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
    setSelectedDay(null); setSelectedSlot(null)
  }

  const selectedDateLabel = selectedDay
    ? `${DAYS[new Date(calYear, calMonth, selectedDay).getDay()]} ${selectedDay} de ${MONTHS[calMonth]}`
    : "Seleccioná un día"

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        <header className="app-header">
          <button className="back-btn" onClick={() => router.back()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)", flex: 1 }}>Nueva reserva</span>
        </header>

        <div className="step-nav">
          <div className={`step-tab${step === 1 ? " active" : step > 1 ? " done" : ""}`} onClick={() => setStep(1)}>1. Cliente</div>
          <div className={`step-tab${step === 2 ? " active" : step > 2 ? " done" : ""}`} onClick={() => setStep(2)}>2. Fecha y hora</div>
          <div className={`step-tab${step === 3 ? " active" : ""}`} onClick={() => setStep(3)}>3. Confirmar</div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="page-content-form">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.5px", marginBottom: 6 }}>Datos del cliente</h2>
              <p className="t-caption text-muted">Podés buscar un cliente existente o agregar uno nuevo.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input className="form-input" type="text" placeholder="Ej: Juan García"/>
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp *</label>
              <div className="phone-row">
                <select className="form-select prefix-select">
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+598">🇺🇾 +598</option>
                </select>
                <input className="form-input" type="tel" placeholder="11 1234 5678" style={{ flex: 1 }}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span></label>
              <input className="form-input" type="email" placeholder="juan@email.com"/>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="page-content-form">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.5px", marginBottom: 6 }}>Servicio y fecha</h2>
              <p className="t-caption text-muted">Seleccioná el servicio y el horario disponible.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Servicio *</label>
              <select className="form-select">
                <option value="" disabled>Elegí un servicio</option>
                <option>Consulta general (30 min)</option>
                <option>Seguimiento (45 min)</option>
                <option>Control (30 min)</option>
                <option>Consulta urgente (20 min)</option>
              </select>
            </div>
            <div>
              <div className="cal-nav">
                <button className="cal-arrow" type="button" onClick={prevMonth}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <span className="cal-month">{MONTHS[calMonth]} {calYear}</span>
                <button className="cal-arrow" type="button" onClick={nextMonth}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div className="cal-grid">
                {DAYS.map(d => <div key={d} className="cal-day-lbl">{d}</div>)}
                {calCells.map((cell, i) => {
                  const isSel = cell.type === "cur" && selectedDay === cell.n
                  const isToday = cell.type === "cur" && cell.n === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear()
                  let cls = "cal-cell"
                  if (cell.type !== "cur") cls += " other"
                  if (cell.disabled) cls += " disabled"
                  if (isToday && !isSel) cls += " today"
                  if (isSel) cls += " selected"
                  return (
                    <div key={i} className={cls} onClick={() => { if (!cell.disabled && cell.type === "cur") { setSelectedDay(cell.n); setSelectedSlot(null) } }}>
                      {cell.n}
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="slots-label">
                Horarios disponibles — <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{selectedDateLabel}</span>
              </div>
              {selectedDay && (
                <div className="slots-grid">
                  {TIMES.map(t => {
                    const isTaken = TAKEN.has(t)
                    const isSel = selectedSlot === t
                    return (
                      <div key={t} className={`slot-chip${isTaken ? " taken" : ""}${isSel ? " selected" : ""}`}
                        onClick={() => { if (!isTaken) setSelectedSlot(t) }}>
                        {t}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="page-content-form">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.5px", marginBottom: 6 }}>Confirmá el turno</h2>
              <p className="t-caption text-muted">Revisá los datos antes de confirmar.</p>
            </div>
            <div className="summary-card">
              <div className="summary-row">
                <div className="summary-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="4" stroke="currentColor" strokeWidth="1.6"/><path d="M1.5 16.5c0-3.5 3.4-6 7.5-6s7.5 2.5 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="summary-label">Cliente</div>
                  <div className="summary-val">Juan García</div>
                </div>
              </div>
              <div style={{ height: 1, background: "var(--border)" }}></div>
              <div className="summary-row">
                <div className="summary-icon" style={{ background: "rgba(5,150,105,0.1)", color: "var(--accent)" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="2.5" width="16" height="13.5" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M5 1v3M13 1v3M1 8h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="summary-label">Fecha y hora</div>
                  <div className="summary-val">{selectedDay ? `${selectedDateLabel} · ${selectedSlot || "—"}` : "Martes 10 de junio · 14:30"}</div>
                </div>
              </div>
              <div style={{ height: 1, background: "var(--border)" }}></div>
              <div className="summary-row">
                <div className="summary-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#B45309" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.6"/><path d="M9 5v4.5l3 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="summary-label">Servicio · Duración</div>
                  <div className="summary-val">Consulta general · 30 min</div>
                </div>
              </div>
            </div>
            <div style={{ background: "var(--bg-white)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>Notificaciones al cliente</div>
              <label className="toggle-wrap">
                <span className="toggle-label">Enviar confirmación por WhatsApp</span>
                <label className="toggle">
                  <input type="checkbox" checked={waToggle} onChange={e => setWaToggle(e.target.checked)}/>
                  <div className="toggle-track"></div>
                  <div className="toggle-thumb"></div>
                </label>
              </label>
              <label className="toggle-wrap">
                <span className="toggle-label">Enviar confirmación por Email</span>
                <label className="toggle">
                  <input type="checkbox" checked={emailToggle} onChange={e => setEmailToggle(e.target.checked)}/>
                  <div className="toggle-track"></div>
                  <div className="toggle-thumb"></div>
                </label>
              </label>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="step-footer">
          {step === 1 && <>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(2)}>Siguiente — Fecha y hora</button>
            <Link href="/dashboard"><button className="btn btn-secondary btn-full">Cancelar</button></Link>
          </>}
          {step === 2 && <>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(3)}>Siguiente — Confirmar</button>
            <button className="btn btn-secondary btn-full" onClick={() => setStep(1)}>Volver</button>
          </>}
          {step === 3 && <>
            <Link href="/dashboard/appointments/1" style={{ width: "100%" }}>
              <button className="btn btn-accent btn-full btn-lg">Confirmar turno</button>
            </Link>
            <button className="btn btn-outline btn-full" onClick={() => setStep(2)}>Volver</button>
          </>}
        </div>

      </div>
    </div>
  )
}
