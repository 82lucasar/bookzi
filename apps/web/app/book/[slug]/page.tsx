"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"

type Step = 1 | 2 | 3

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAYS_ABR = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"]
const AVAIL_DAYS = [9,10,11,12,13,16,17,18,19,20,24,25,26]
const TAKEN_SLOTS = ["09:00","11:30","15:00"]
const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"]

export default function BookPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(2)
  const [selectedService, setSelectedService] = useState(0)
  const [calYear, setCalYear] = useState(2025)
  const [calMonth, setCalMonth] = useState(5)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const calCells = useMemo(() => {
    const cells: { n: number; type: "prev"|"cur"|"next"; disabled: boolean; avail: boolean }[] = []
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const lastDate = new Date(calYear, calMonth + 1, 0).getDate()
    const prevLast = new Date(calYear, calMonth, 0).getDate()
    const today = new Date(2025, 5, 10)

    for (let i = 0; i < firstDay; i++) {
      cells.push({ n: prevLast - firstDay + 1 + i, type: "prev", disabled: true, avail: false })
    }
    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(calYear, calMonth, d)
      const isSun = date.getDay() === 0
      const isPast = date < today
      const isAvail = AVAIL_DAYS.includes(d) && !isSun && !isPast
      cells.push({ n: d, type: "cur", disabled: isSun || isPast, avail: isAvail })
    }
    const left = 42 - cells.length
    for (let d = 1; d <= left; d++) {
      cells.push({ n: d, type: "next", disabled: true, avail: false })
    }
    return cells
  }, [calYear, calMonth])

  const SERVICES = [
    { name: "Consulta general", meta: "30 minutos · Primera vez o control", price: "$5.000" },
    { name: "Seguimiento", meta: "45 minutos · Pacientes en tratamiento", price: "$6.500" },
    { name: "Control de resultados", meta: "30 minutos · Revisión de estudios", price: "$4.500" },
  ]

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1); setSelectedDay(null); setSelectedSlot(null) }
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1); setSelectedDay(null); setSelectedSlot(null) }

  const slotsDate = selectedDay ? `${DAYS_ABR[new Date(calYear, calMonth, selectedDay).getDay()]} ${selectedDay} de ${MONTHS[calMonth]}` : ""

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>

      {/* Header */}
      <div className="pub-header">
        <div className="pub-avatar-wrap">ML</div>
        <div className="pub-name">Martina López</div>
        <div className="pub-role">Médica · Buenos Aires</div>
        <div className="pub-meta">
          <span className="pub-meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.3"/><path d="M6 3v3.5l2 1" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Confirmación inmediata
          </span>
          <span className="pub-meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1C3.24 1 1 3.24 1 6c0 .87.22 1.69.62 2.4L1 11l2.68-.62A4.97 4.97 0 006 11c2.76 0 5-2.24 5-5S8.76 1 6 1z" stroke="white" strokeWidth="1.3" fill="none"/></svg>
            WhatsApp + Email
          </span>
        </div>
      </div>

      {/* Step tabs */}
      <div className="step-tabs">
        <div className={`step-tab${step === 1 ? " active" : step > 1 ? " done" : ""}`} onClick={() => setStep(1)}>1. Servicio</div>
        <div className={`step-tab${step === 2 ? " active" : step > 2 ? " done" : ""}`} onClick={() => setStep(2)}>2. Fecha</div>
        <div className={`step-tab${step === 3 ? " active" : ""}`} onClick={() => setStep(3)}>3. Tus datos</div>
      </div>

      {/* Step 1: Servicio */}
      {step === 1 && (
        <div className="page-body">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.5px", marginBottom: 6 }}>¿Qué servicio necesitás?</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Seleccioná el tipo de consulta.</p>
          </div>
          <div className="service-cards">
            {SERVICES.map((s, i) => (
              <div key={i} className={`service-card${selectedService === i ? " selected" : ""}`} onClick={() => setSelectedService(i)}>
                <div className="service-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <div className="service-info">
                  <div className="service-card-name">{s.name}</div>
                  <div className="service-card-meta">{s.meta}</div>
                </div>
                <div className="service-price">{s.price}</div>
                <div className="check-circle">
                  {selectedService === i && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Fecha */}
      {step === 2 && (
        <div className="page-body">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.5px", marginBottom: 6 }}>Elegí fecha y hora</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Los días con <span style={{ color: "var(--accent)", fontWeight: 600 }}>●</span> tienen turnos disponibles.</p>
          </div>
          <div style={{ background: "var(--bg-white)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 18 }}>
            <div className="cal-nav">
              <button className="cal-arrow" type="button" onClick={prevMonth}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 10L4.5 6.5 8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span className="cal-month-label">{MONTHS[calMonth]} {calYear}</span>
              <button className="cal-arrow" type="button" onClick={nextMonth}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 3l3.5 3.5L5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div className="cal-grid">
              {DAYS_ABR.map(d => <div key={d} className="cal-day-lbl">{d}</div>)}
              {calCells.map((cell, i) => {
                const isSel = cell.type === "cur" && selectedDay === cell.n
                let cls = "cal-cell-round"
                if (cell.type !== "cur") cls += " other"
                if (cell.disabled) cls += " disabled"
                if (isSel) cls += " selected"
                if (cell.avail && !isSel) cls += " has-slots"
                return (
                  <div key={i} className={cls} onClick={() => { if (cell.avail) { setSelectedDay(cell.n); setSelectedSlot(null) } }}>
                    {cell.n}
                  </div>
                )
              })}
            </div>
          </div>
          {selectedDay && (
            <div>
              <div className="slots-head">Horarios para <span style={{ color: "var(--primary)" }}>{slotsDate}</span></div>
              <div className="slots-grid">
                {TIMES.map(t => {
                  const isTaken = TAKEN_SLOTS.includes(t)
                  const isSel = selectedSlot === t
                  return (
                    <div key={t} className={`slot-pill${isTaken ? " taken" : ""}${isSel ? " selected" : ""}`}
                      onClick={() => { if (!isTaken) setSelectedSlot(t) }}>
                      {t}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Datos */}
      {step === 3 && (
        <div className="page-body">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.5px", marginBottom: 6 }}>Tus datos</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Te enviamos la confirmación por WhatsApp y email.</p>
          </div>
          <div style={{ background: "rgba(2,132,199,0.08)", border: "1px solid rgba(2,132,199,0.2)", borderRadius: "var(--radius-md)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="2.5" width="16" height="13.5" rx="2.5" stroke="white" strokeWidth="1.5"/><path d="M5 1v3M13 1v3M1 7.5h16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{SERVICES[selectedService]?.name ?? "Consulta"} · 30 min</div>
              <div style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 2 }}>
                {selectedDay ? `${slotsDate} · ${selectedSlot || "—"}` : "Martes 10 de junio · 14:30"}
              </div>
            </div>
          </div>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Tu nombre completo *</label>
              <input className="form-input" type="text" placeholder="Nombre y apellido"/>
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp *</label>
              <div className="phone-row">
                <select className="form-select prefix-sel">
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+598">🇺🇾 +598</option>
                </select>
                <input className="form-input" type="tel" placeholder="11 1234 5678" style={{ flex: 1 }}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span></label>
              <input className="form-input" type="email" placeholder="vos@email.com"/>
            </div>
            <div className="form-group">
              <label className="form-label">¿Traés indicaciones o estudios? <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span></label>
              <textarea className="form-input" rows={3} placeholder="Ej: Vengo con resultados de laboratorio del 5 de junio..."></textarea>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            Powered by <span style={{ fontWeight: 700, color: "var(--primary)" }}>Bookzi</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1.5" fill="#0284C7"/><rect x="8" y="1" width="5" height="5" rx="1.5" fill="#0284C7" opacity=".4"/><rect x="1" y="8" width="5" height="5" rx="1.5" fill="#0284C7" opacity=".4"/><rect x="8" y="8" width="5" height="5" rx="1.5" fill="#0284C7" opacity=".4"/></svg>
          </div>
        </div>
      )}

      {/* CTA footer */}
      <div className="bottom-cta">
        {step === 1 && <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(2)}>Siguiente — Elegir fecha</button>}
        {step === 2 && <>
          <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(3)}>Siguiente — Mis datos</button>
          <div className="hint">Seleccioná día y horario para continuar</div>
        </>}
        {step === 3 && <a href="/book/confirmed"><button className="btn btn-accent btn-full btn-lg">Reservar turno</button></a>}
      </div>

    </div>
  )
}
