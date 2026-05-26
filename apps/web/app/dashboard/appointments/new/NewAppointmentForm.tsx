"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getAvailableSlots } from "@/lib/actions/booking"
import { createDashboardAppointment } from "@/lib/actions/appointments"

const MONTHS   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAY_HDR  = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"]

type ServiceOption = { id: string; name: string; durationMinutes: number; price: string | null }
type BusinessInfo  = { id: string; name: string }

export default function NewAppointmentForm({
  business,
  services,
}: {
  business: BusinessInfo
  services: ServiceOption[]
}) {
  const router = useRouter()

  const [step,    setStep]    = useState<1 | 2 | 3 | "done">(1)
  const [error,   setError]   = useState<string | null>(null)
  const [saving,  setSaving]  = useState(false)

  // Step 1 — datos del cliente
  const [clientName,   setClientName]   = useState("")
  const [clientPrefix, setClientPrefix] = useState("+54")
  const [clientPhone,  setClientPhone]  = useState("")
  const [clientEmail,  setClientEmail]  = useState("")

  // Step 2 — servicio + fecha + horario
  const [serviceId,       setServiceId]       = useState("")
  const [serviceName,     setServiceName]     = useState("")
  const [serviceDuration, setServiceDuration] = useState(0)
  const [calYear,         setCalYear]         = useState(new Date().getFullYear())
  const [calMonth,        setCalMonth]        = useState(new Date().getMonth())
  const [selectedDay,     setSelectedDay]     = useState<number | null>(null)
  const [availableSlots,  setAvailableSlots]  = useState<string[]>([])
  const [loadingSlots,    setLoadingSlots]    = useState(false)
  const [selectedSlot,    setSelectedSlot]    = useState<string | null>(null)

  // Step 3 — notificaciones
  const [waToggle,    setWaToggle]    = useState(true)
  const [emailToggle, setEmailToggle] = useState(true)

  // Done
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  // Calendario (lunes primero)
  const calCells = useMemo(() => {
    const cells: { n: number; type: "prev" | "cur" | "next"; disabled: boolean }[] = []
    const firstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7
    const lastDate = new Date(calYear, calMonth + 1, 0).getDate()
    const prevLast = new Date(calYear, calMonth, 0).getDate()
    const today    = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    for (let i = 0; i < firstDow; i++) {
      cells.push({ n: prevLast - firstDow + 1 + i, type: "prev", disabled: true })
    }
    for (let d = 1; d <= lastDate; d++) {
      cells.push({ n: d, type: "cur", disabled: new Date(calYear, calMonth, d) < todayMidnight })
    }
    for (let d = 1; d <= 42 - cells.length; d++) {
      cells.push({ n: d, type: "next", disabled: true })
    }
    return cells
  }, [calYear, calMonth])

  // Cargar slots disponibles cuando cambia servicio o día
  useEffect(() => {
    if (!serviceId || !selectedDay) {
      setAvailableSlots([])
      setSelectedSlot(null)
      return
    }
    let cancelled = false
    setLoadingSlots(true)
    setSelectedSlot(null)
    const date = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    getAvailableSlots(business.id, serviceId, date)
      .then(slots => { if (!cancelled) { setAvailableSlots(slots); setLoadingSlots(false) } })
      .catch(()  => { if (!cancelled) { setAvailableSlots([]); setLoadingSlots(false) } })
    return () => { cancelled = true }
  }, [serviceId, selectedDay, calYear, calMonth])

  // Helpers
  const selectedDateLabel = selectedDay
    ? `${DAY_HDR[(new Date(calYear, calMonth, selectedDay).getDay() + 6) % 7]} ${selectedDay} de ${MONTHS[calMonth]}`
    : "Seleccioná un día"

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
    setSelectedDay(null)
  }

  const canGoToStep2 = !!clientName.trim() && !!clientPhone.trim()
  const canGoToStep3 = !!serviceId && !!selectedDay && !!selectedSlot

  function goToStep2() {
    if (!canGoToStep2) return
    setError(null)
    setStep(2)
  }

  function goToStep3() {
    if (!canGoToStep3) return
    setError(null)
    setStep(3)
  }

  async function handleConfirm() {
    setError(null)
    setSaving(true)
    try {
      const id = await createDashboardAppointment({
        clientName:  clientName.trim(),
        clientPhone: `${clientPrefix}${clientPhone.trim().replace(/\s+/g, "")}`,
        clientEmail: clientEmail.trim(),
        serviceId,
        date: `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDay!).padStart(2, "0")}`,
        time: selectedSlot!,
      })
      setAppointmentId(id)
      setStep("done")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo crear el turno."
      setError(msg)
      setSaving(false)
    }
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        <header className="app-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="back-btn" onClick={() => router.back()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Nueva reserva</span>
          </div>
          <a href="/dashboard" className="logo-home-btn">B</a>
        </header>

        {/* Paso "done" — pantalla de éxito */}
        {step === "done" && (
          <div style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(5,150,105,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 8,
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 16l7 7L26 9" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-dark)", letterSpacing: "-0.5px" }}>
              ¡Turno creado!
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 300, lineHeight: 1.6 }}>
              El turno para <strong style={{ color: "var(--text-dark)" }}>{clientName}</strong> quedó como <strong>pendiente de confirmación</strong>.
            </p>

            <div style={{
              width: "100%", background: "var(--bg-white)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "20px", marginTop: 8, display: "flex", flexDirection: "column", gap: 12, textAlign: "left",
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", minWidth: 70 }}>Cliente</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>{clientName}</span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", minWidth: 70 }}>Servicio</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>{serviceName} · {serviceDuration} min</span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", minWidth: 70 }}>Fecha</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>{selectedDateLabel} · {selectedSlot}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 8 }}>
              <button
                className="btn btn-accent btn-full btn-lg"
                onClick={() => router.push(`/dashboard/appointments/${appointmentId}`)}
              >
                Ver y confirmar turno →
              </button>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => router.push("/dashboard")}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}

        {/* Tabs de pasos (solo si no es "done") */}
        {step !== "done" && (
          <div className="step-nav">
            <div className={`step-tab${step === 1 ? " active" : step > 1 ? " done" : ""}`} onClick={() => setStep(1)}>1. Cliente</div>
            <div className={`step-tab${step === 2 ? " active" : step > 2 ? " done" : ""}`} onClick={() => { if (step > 2) setStep(2) }}>2. Fecha y hora</div>
            <div className={`step-tab${step === 3 ? " active" : ""}`}>3. Confirmar</div>
          </div>
        )}

        {/* Step 1 — Datos del cliente */}
        {step === 1 && (
          <div className="page-content-form">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.5px", marginBottom: 6 }}>Datos del cliente</h2>
              <p className="t-caption text-muted">Podés buscar un cliente existente o agregar uno nuevo.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input
                className="form-input"
                type="text"
                placeholder="Ej: Juan García"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp *</label>
              <div className="phone-row">
                <select
                  className="form-select prefix-select"
                  value={clientPrefix}
                  onChange={e => setClientPrefix(e.target.value)}
                >
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+598">🇺🇾 +598</option>
                </select>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="11 1234 5678"
                  style={{ flex: 1 }}
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span></label>
              <input
                className="form-input"
                type="email"
                placeholder="juan@email.com"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
              />
            </div>
            {error && <p style={{ color: "var(--error)", fontSize: 13, textAlign: "center" }}>{error}</p>}
          </div>
        )}

        {/* Step 2 — Servicio, fecha y horario */}
        {step === 2 && (
          <div className="page-content-form">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.5px", marginBottom: 6 }}>Servicio y fecha</h2>
              <p className="t-caption text-muted">Seleccioná el servicio y el horario disponible.</p>
            </div>

            {/* Selector de servicio */}
            <div className="form-group">
              <label className="form-label">Servicio *</label>
              {services.length === 0 ? (
                <div style={{ padding: "14px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 14, color: "var(--text-muted)" }}>
                  No hay servicios configurados.{" "}
                  <Link href="/dashboard/services" style={{ color: "var(--primary)", fontWeight: 700 }}>Configurar servicios →</Link>
                </div>
              ) : (
                <select
                  className="form-select"
                  value={serviceId}
                  onChange={e => {
                    const svc = services.find(s => s.id === e.target.value)
                    setServiceId(e.target.value)
                    setServiceName(svc?.name ?? "")
                    setServiceDuration(svc?.durationMinutes ?? 0)
                    setSelectedSlot(null)
                  }}
                >
                  <option value="" disabled>Elegí un servicio</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Calendario */}
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
                {DAY_HDR.map(d => <div key={d} className="cal-day-lbl">{d}</div>)}
                {calCells.map((cell, i) => {
                  const isSel    = cell.type === "cur" && selectedDay === cell.n
                  const today    = new Date()
                  const isToday  = cell.type === "cur" && cell.n === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
                  let cls = "cal-cell"
                  if (cell.type !== "cur") cls += " other"
                  if (cell.disabled) cls += " disabled"
                  if (isToday && !isSel) cls += " today"
                  if (isSel) cls += " selected"
                  return (
                    <div
                      key={i}
                      className={cls}
                      onClick={() => {
                        if (!cell.disabled && cell.type === "cur") {
                          setSelectedDay(cell.n)
                        }
                      }}
                    >
                      {cell.n}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Slots disponibles */}
            <div>
              <div className="slots-label">
                Horarios disponibles —{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{selectedDateLabel}</span>
              </div>
              {!selectedDay || !serviceId ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                  {!serviceId ? "Elegí un servicio para ver los horarios." : "Seleccioná un día para ver los horarios disponibles."}
                </p>
              ) : loadingSlots ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>Cargando horarios...</p>
              ) : availableSlots.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                  No hay horarios disponibles para este día. Probá con otro día o revisá tu disponibilidad.
                </p>
              ) : (
                <div className="slots-grid">
                  {availableSlots.map(t => (
                    <div
                      key={t}
                      className={`slot-chip${selectedSlot === t ? " selected" : ""}`}
                      onClick={() => setSelectedSlot(t)}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p style={{ color: "var(--error)", fontSize: 13, textAlign: "center" }}>{error}</p>}
          </div>
        )}

        {/* Step 3 — Confirmar */}
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
                  <div className="summary-val">{clientName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{clientPrefix}{clientPhone}</div>
                </div>
              </div>
              <div style={{ height: 1, background: "var(--border)" }}/>
              <div className="summary-row">
                <div className="summary-icon" style={{ background: "rgba(5,150,105,0.10)", color: "var(--accent)" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="2.5" width="16" height="13.5" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M5 1v3M13 1v3M1 8h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="summary-label">Fecha y hora</div>
                  <div className="summary-val">{selectedDateLabel} · {selectedSlot}</div>
                </div>
              </div>
              <div style={{ height: 1, background: "var(--border)" }}/>
              <div className="summary-row">
                <div className="summary-icon" style={{ background: "rgba(245,158,11,0.10)", color: "#B45309" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.6"/><path d="M9 5v4.5l3 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="summary-label">Servicio · Duración</div>
                  <div className="summary-val">{serviceName} · {serviceDuration} min</div>
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

            {error && <p style={{ color: "var(--error)", fontSize: 13, textAlign: "center" }}>{error}</p>}
          </div>
        )}

        {/* Footer de navegación */}
        {step !== "done" && (
          <div className="step-footer">
            {step === 1 && (
              <>
                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={goToStep2}
                  disabled={!canGoToStep2}
                  style={{ opacity: canGoToStep2 ? 1 : 0.4, cursor: canGoToStep2 ? "pointer" : "not-allowed" }}
                >
                  Siguiente — Fecha y hora
                </button>
                <Link href="/dashboard" style={{ width: "100%" }}>
                  <button className="btn btn-secondary btn-full">Cancelar</button>
                </Link>
              </>
            )}
            {step === 2 && (
              <>
                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={goToStep3}
                  disabled={!canGoToStep3}
                  style={{ opacity: canGoToStep3 ? 1 : 0.4, cursor: canGoToStep3 ? "pointer" : "not-allowed" }}
                >
                  Siguiente — Confirmar
                </button>
                <button className="btn btn-secondary btn-full" onClick={() => setStep(1)}>Volver</button>
              </>
            )}
            {step === 3 && (
              <>
                <button
                  className="btn btn-accent btn-full btn-lg"
                  onClick={handleConfirm}
                  disabled={saving}
                  style={{ opacity: saving ? 0.8 : 1, cursor: saving ? "not-allowed" : "pointer" }}
                >
                  {saving ? "Creando turno..." : "Confirmar turno"}
                </button>
                <button className="btn btn-outline btn-full" onClick={() => setStep(2)} disabled={saving}>Volver</button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
