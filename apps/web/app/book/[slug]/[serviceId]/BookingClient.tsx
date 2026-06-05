"use client"

import { useState, useTransition, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getAvailableSlots, bookAppointment } from "@/lib/actions/booking"
import WaitlistForm from "./WaitlistForm"
import { BookziIcon } from "@/components/BookziLogo"

type Service = { id: string; name: string; durationMinutes: number; price: string | null }
type Business = {
  id: string
  name: string
  slug: string
  transferTitular: string | null
  transferCbu: string | null
  transferAlias: string | null
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAYS_S = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(first).fill(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  return cells
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function formatDateNice(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  })
}

type Step = "staff" | "fecha" | "datos" | "pago"

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step, showStaff }: { step: Step; showStaff: boolean }) {
  const steps = showStaff
    ? ["SERVICIO", "PROFES.", "FECHA", "DATOS", "PAGO"]
    : ["SERVICIO", "FECHA", "DATOS", "PAGO"]
  const stepIdx = showStaff
    ? ({ staff: 1, fecha: 2, datos: 3, pago: 4 } as Record<Step, number>)[step]
    : ({ fecha: 1, datos: 2, pago: 3 } as Record<Step, number>)[step] ?? 1

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "white",
      borderBottom: "1.5px solid var(--border)",
      padding: "14px 16px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", maxWidth: 540, margin: "0 auto" }}>
        {steps.map((label, i) => {
          const done = i < stepIdx
          const active = i === stepIdx
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                  background: done
                    ? "var(--accent)"
                    : active
                      ? "linear-gradient(135deg, #0284C7, #0369A1)"
                      : "var(--border)",
                  color: done || active ? "white" : "var(--text-muted)",
                  boxShadow: done
                    ? "0 2px 8px rgba(5,150,105,0.3)"
                    : active
                      ? "0 2px 8px rgba(2,132,199,0.35)"
                      : "none",
                  transition: "all 300ms",
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
                  color: done || active ? "var(--text-dark)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: 2, borderRadius: 2, margin: "0 4px", marginBottom: 16,
                  background: done ? "var(--accent)" : "var(--border)",
                  transition: "background 300ms",
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Resumen del turno (reutilizable en pasos 2 y 3) ──────────────────────────
function TurnoResumen({
  service,
  selectedDate,
  selectedSlot,
  staffName,
  showPrice,
}: {
  service: Service
  selectedDate: string
  selectedSlot: string
  staffName?: string | null
  showPrice?: boolean
}) {
  return (
    <div style={{
      background: "rgba(2,132,199,0.05)",
      border: "1.5px solid rgba(2,132,199,0.14)",
      borderRadius: 16, padding: "14px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "rgba(2,132,199,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#0284C7" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round"/>
            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-dark)", margin: 0, lineHeight: 1.3 }}>
            {service.name}
          </p>
          <p style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, margin: "3px 0 0", textTransform: "capitalize" }}>
            {formatDateNice(selectedDate)} · {selectedSlot} hs
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "1px 0 0", fontWeight: 500 }}>
            {formatDuration(service.durationMinutes)}
            {staffName ? ` · ${staffName}` : ""}
          </p>
        </div>
      </div>
      {showPrice && service.price && (
        <p style={{ fontSize: 20, fontWeight: 900, color: "var(--accent)", margin: 0, flexShrink: 0 }}>
          ${Number(service.price).toLocaleString("es-AR")}
        </p>
      )}
    </div>
  )
}

type StaffItem = { id: string; name: string }

// ── Componente principal ──────────────────────────────────────────────────────
export default function BookingClient({
  business,
  service,
  staffList = [],
}: {
  business: Business
  service: Service
  staffList?: StaffItem[]
}) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const showStaffSelector = staffList.length > 1
  const [step, setStep] = useState<Step>(showStaffSelector ? "staff" : "fecha")
  // Con 1 elegible: pre-asignar su ID automáticamente
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(
    staffList.length === 1 ? (staffList[0]?.id ?? null) : null,
  )

  // Paso datos
  const [clientName, setClientName]   = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientNotes, setClientNotes] = useState("")

  // Paso pago
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const cells = buildCalendar(year, month)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null); setSlots([]); setSelectedSlot(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null); setSlots([]); setSelectedSlot(null)
  }

  async function selectDate(day: number) {
    const dateStr = toDateStr(year, month, day)
    setSelectedDate(dateStr)
    setSelectedSlot(null)
    setLoadingSlots(true)
    const available = await getAvailableSlots(business.id, service.id, dateStr, selectedStaffId)
    setSlots(available)
    setLoadingSlots(false)
  }

  function handleStaffChange(staffId: string | null) {
    setSelectedStaffId(staffId)
    setSelectedDate(null)
    setSlots([])
    setSelectedSlot(null)
  }

  const isPastDay = useCallback((day: number) => {
    const d = new Date(year, month, day)
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d < t
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  function handleProofChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => setProofPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setProofPreview(null)
    }
  }

  function handleSubmit() {
    const fd = new FormData()
    fd.append("businessId", business.id)
    fd.append("serviceId", service.id)
    if (selectedStaffId) fd.append("staffId", selectedStaffId)
    fd.append("date", selectedDate!)
    fd.append("time", selectedSlot!)
    fd.append("clientName", clientName)
    fd.append("clientPhone", clientPhone)
    fd.append("clientEmail", clientEmail)
    fd.append("notes", clientNotes)
    if (proofFile) fd.append("paymentProof", proofFile)
    startTransition(async () => {
      const id = await bookAppointment(fd)
      router.push(`/book/confirmed?id=${id}`)
    })
  }

  const canGoToDatos = !!selectedDate && !!selectedSlot
  const canGoToPago  = clientName.trim().length > 0 && clientPhone.trim().length > 0

  return (
    <>
      <ProgressBar step={step} showStaff={showStaffSelector} />

      <div style={{ padding: "20px 0 120px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ═══════════════════════════════════════════════════
            PASO 0: ELEGIR PROFESIONAL (solo si hay >1)
        ═══════════════════════════════════════════════════ */}
        {step === "staff" && (
          <>
            <div style={{ padding: "4px 16px 0" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.4px", margin: "0 0 6px" }}>
                ¿Con quién querés atenderte?
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Elegí tu profesional preferido o dejanos asignarte uno.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 16px" }}>

              {/* Sin preferencia */}
              <button
                onClick={() => { setSelectedStaffId(null); setStep("fecha") }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14,
                  background: "white", border: "1.5px solid var(--border)", borderRadius: 16,
                  padding: "14px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  transition: "border-color 150ms, box-shadow 150ms",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "var(--bg-muted)", border: "1.5px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  🎲
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-dark)" }}>Sin preferencia</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    Te asignamos el profesional disponible
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M6 4l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Cada colaborador */}
              {staffList.map(s => {
                const initials = s.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")
                return (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStaffId(s.id); setStep("fecha") }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 14,
                      background: "white", border: "1.5px solid var(--border)", borderRadius: 16,
                      padding: "14px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      transition: "border-color 150ms, box-shadow 150ms",
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 800, color: "white",
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-dark)" }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginTop: 2 }}>
                        Disponible
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M6 4l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            PASO 1: FECHA + SLOTS
        ═══════════════════════════════════════════════════ */}
        {step === "fecha" && (
          <>
            {/* Resumen servicio */}
            <div style={{
              background: "rgba(2,132,199,0.06)",
              border: "1.5px solid rgba(2,132,199,0.15)",
              borderRadius: 16, padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(2,132,199,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#0284C7" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-dark)", margin: 0, lineHeight: 1.3 }}>
                    {service.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0", fontWeight: 500 }}>
                    {formatDuration(service.durationMinutes)}
                  </p>
                </div>
              </div>
              {service.price && (
                <p style={{ fontSize: 20, fontWeight: 900, color: "var(--accent)", margin: 0, flexShrink: 0 }}>
                  ${Number(service.price).toLocaleString("es-AR")}
                </p>
              )}
            </div>

            {/* Calendario */}
            <div style={{ background: "white", borderRadius: 20, padding: "20px 16px", border: "1.5px solid var(--border)" }}>
              {/* Nav del mes */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <button
                  onClick={prevMonth}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--border)",
                    background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-muted)", cursor: "pointer",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.3px" }}>
                  {MONTHS[month]} {year}
                </span>
                <button
                  onClick={nextMonth}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--border)",
                    background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-muted)", cursor: "pointer",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              {/* Días de la semana */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
                {DAYS_S.map(d => (
                  <div key={d} style={{
                    textAlign: "center", fontSize: 10, fontWeight: 700,
                    color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "4px 0",
                  }}>{d}</div>
                ))}
              </div>

              {/* Celdas */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />
                  const dateStr  = toDateStr(year, month, day)
                  const past     = isPastDay(day)
                  const selected = selectedDate === dateStr
                  const isToday  = dateStr === toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
                  return (
                    <button
                      key={i}
                      disabled={past}
                      onClick={() => selectDate(day)}
                      style={{
                        aspectRatio: "1", borderRadius: "50%",
                        fontSize: 13, fontWeight: 700, border: "none", cursor: past ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 150ms",
                        ...(selected
                          ? { background: "linear-gradient(135deg, #0284C7, #0369A1)", color: "white", boxShadow: "0 3px 10px rgba(2,132,199,0.4)" }
                          : isToday
                            ? { color: "var(--primary)", background: "rgba(2,132,199,0.08)", fontWeight: 800 }
                            : past
                              ? { color: "var(--border)", background: "transparent" }
                              : { color: "var(--text-dark)", background: "transparent" }
                        ),
                      }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Slots disponibles */}
            {selectedDate && (
              <div style={{ background: "white", borderRadius: 20, padding: "18px 16px", border: "1.5px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-dark)", margin: 0, letterSpacing: "-0.2px" }}>
                      Horarios disponibles
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0", textTransform: "capitalize", fontWeight: 500 }}>
                      {formatDateNice(selectedDate)}
                    </p>
                  </div>
                  {selectedSlot && (
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20,
                      background: "rgba(2,132,199,0.1)", color: "var(--primary)",
                    }}>
                      {selectedSlot} hs
                    </span>
                  )}
                </div>

                {loadingSlots ? (
                  <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0,1,2].map(i => (
                        <div
                          key={i}
                          style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: "var(--primary)",
                            animation: "bounce 0.9s infinite",
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, margin: 0 }}>
                      Buscando horarios...
                    </p>
                  </div>
                ) : slots.length === 0 ? (
                  <WaitlistForm
                    businessId={business.id}
                    serviceId={service.id}
                    selectedDate={selectedDate}
                    serviceName={service.name}
                  />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {slots.map(slot => {
                      const isSelected = selectedSlot === slot
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            height: 44, borderRadius: 10, fontSize: 13, fontWeight: 700,
                            cursor: "pointer", transition: "all 150ms",
                            ...(isSelected
                              ? {
                                  background: "linear-gradient(135deg, #0284C7, #0369A1)",
                                  color: "white", border: "1.5px solid transparent",
                                  boxShadow: "0 3px 10px rgba(2,132,199,0.35)",
                                }
                              : {
                                  background: "var(--bg)", color: "var(--primary)",
                                  border: "1.5px solid var(--border)",
                                }
                            ),
                          }}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            PASO 2: TUS DATOS
        ═══════════════════════════════════════════════════ */}
        {step === "datos" && selectedDate && selectedSlot && (
          <>
            <TurnoResumen
              service={service}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              staffName={staffList.find(s => s.id === selectedStaffId)?.name ?? null}
              showPrice={false}
            />

            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "20px 16px 4px" }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text-dark)", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
                  Tus datos de contacto
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                  Para confirmar tu turno necesitamos estos datos.
                </p>
              </div>

              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-mid)" }}>
                    Nombre completo <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Tu nombre completo"
                    autoComplete="name"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-mid)" }}>
                    WhatsApp / Teléfono <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    autoComplete="tel"
                  />
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>
                    Recibirás la confirmación por WhatsApp.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-mid)" }}>
                    Email{" "}
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>(opcional)</span>
                  </label>
                  <input
                    className="form-input"
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-mid)" }}>
                    Notas{" "}
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>(opcional)</span>
                  </label>
                  <textarea
                    className="form-input"
                    value={clientNotes}
                    onChange={e => setClientNotes(e.target.value)}
                    placeholder="Algo que quieras aclarar al profesional..."
                    rows={3}
                    style={{ resize: "none" }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            PASO 3: PAGO + COMPROBANTE
        ═══════════════════════════════════════════════════ */}
        {step === "pago" && selectedDate && selectedSlot && (
          <>
            <TurnoResumen
              service={service}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              staffName={staffList.find(s => s.id === selectedStaffId)?.name ?? null}
              showPrice={true}
            />

            {/* Instrucciones de pago */}
            {service.price && (
              <div style={{
                background: "white", borderRadius: 20,
                border: "1.5px solid var(--border)", padding: "18px 16px",
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
                  Instrucciones de pago
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: "rgba(5,150,105,0.1)", color: "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      fontSize: 14, fontWeight: 800,
                    }}>1</div>
                    <p style={{ fontSize: 13, color: "var(--text-mid)", margin: 0, lineHeight: 1.5, paddingTop: 4 }}>
                      Realizá la transferencia por el monto indicado.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: "rgba(5,150,105,0.1)", color: "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      fontSize: 14, fontWeight: 800,
                    }}>2</div>
                    <p style={{ fontSize: 13, color: "var(--text-mid)", margin: 0, lineHeight: 1.5, paddingTop: 4 }}>
                      Adjuntá el comprobante para que el profesional confirme tu turno.
                    </p>
                  </div>
                </div>

                {/* Monto destacado */}
                <div style={{
                  marginTop: 16, padding: "14px 16px",
                  background: "rgba(5,150,105,0.06)", borderRadius: 12,
                  border: "1.5px solid rgba(5,150,105,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-mid)" }}>Total a transferir</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "var(--accent)", letterSpacing: "-0.5px" }}>
                    ${Number(service.price).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            )}

            {/* Datos bancarios del negocio */}
            {(business.transferTitular || business.transferCbu || business.transferAlias) && (
              <div style={{
                background: "rgba(2,132,199,0.04)",
                borderRadius: 16,
                border: "1.5px solid rgba(2,132,199,0.15)",
                padding: "16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0284C7" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h12M3 18h8"/>
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Datos para la transferencia
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {business.transferTitular && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Titular</span>
                      <span style={{ fontSize: 13, color: "var(--text-dark)", fontWeight: 700, textAlign: "right" }}>
                        {business.transferTitular}
                      </span>
                    </div>
                  )}
                  {business.transferCbu && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>CBU</span>
                      <span style={{ fontSize: 13, color: "var(--text-dark)", fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
                        {business.transferCbu}
                      </span>
                    </div>
                  )}
                  {business.transferAlias && (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Alias</span>
                      <span style={{ fontSize: 13, color: "var(--text-dark)", fontWeight: 700, textAlign: "right" }}>
                        {business.transferAlias}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload comprobante */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid var(--border)", padding: "18px 16px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
                Comprobante de pago{!service.price && <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, marginLeft: 6, fontSize: 12 }}>(opcional)</span>}
              </p>

              {service.price && (
                <p style={{ fontSize: 13, color: "var(--text-mid)", margin: "0 0 14px", lineHeight: 1.5 }}>
                  Subí el comprobante para que el profesional confirme tu turno en breve.
                </p>
              )}

              {/* Zona de upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${proofFile ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 14,
                  background: proofFile ? "rgba(5,150,105,0.04)" : "var(--bg)",
                  padding: "20px 16px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 200ms",
                }}
              >
                {proofPreview ? (
                  // Preview imagen
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <img
                      src={proofPreview}
                      alt="Comprobante"
                      style={{
                        maxHeight: 180, borderRadius: 8,
                        objectFit: "contain", maxWidth: "100%",
                      }}
                    />
                    <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, margin: 0 }}>
                      ✓ Comprobante listo
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                      Tocá para cambiar
                    </p>
                  </div>
                ) : proofFile ? (
                  // PDF u otro archivo
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: "rgba(5,150,105,0.1)", color: "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", margin: 0 }}>
                      ✓ {proofFile.name}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Tocá para cambiar</p>
                  </div>
                ) : (
                  // Sin archivo
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: "rgba(2,132,199,0.08)", color: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>
                      Subir comprobante
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                      Imagen o PDF · tocá para seleccionar
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleProofChange}
                style={{ display: "none" }}
              />
            </div>
          </>
        )}

        {/* Powered by */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 4 }}>
          <BookziIcon size={14} />
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, margin: 0 }}>
            Powered by <span style={{ fontWeight: 700, color: "var(--primary)" }}>Bookzi</span>
          </p>
        </div>

      </div>

      {/* ── CTA fijo abajo ─────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "white", borderTop: "1.5px solid var(--border)",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}>
        {step === "staff" && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: 0, fontWeight: 500 }}>
            Tocá un profesional para continuar
          </p>
        )}

        {step === "fecha" && (
          <div style={{ display: "flex", gap: 8 }}>
            {showStaffSelector && (
              <button
                onClick={() => setStep("staff")}
                style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  border: "1.5px solid var(--border)", background: "var(--bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--text-mid)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                disabled={!canGoToDatos}
                onClick={() => setStep("datos")}
                style={{
                  width: "100%", height: 52, borderRadius: 14,
                  fontSize: 15, fontWeight: 800, color: "white",
                  background: canGoToDatos ? "linear-gradient(135deg, #0284C7, #0369A1)" : "var(--border)",
                  boxShadow: canGoToDatos ? "0 5px 18px rgba(2,132,199,0.40)" : "none",
                  cursor: canGoToDatos ? "pointer" : "not-allowed",
                  border: "none", transition: "all 200ms",
                }}
              >
                {canGoToDatos ? "Siguiente — Mis datos →" : "Seleccioná una fecha y horario"}
              </button>
              {canGoToDatos && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", margin: 0, fontWeight: 500 }}>
                  {formatDateNice(selectedDate!)} · {selectedSlot} hs
                  {selectedStaffId && staffList.find(s => s.id === selectedStaffId) && (
                    <> · {staffList.find(s => s.id === selectedStaffId)!.name}</>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {step === "datos" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setStep("fecha")}
              style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                border: "1.5px solid var(--border)", background: "var(--bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-mid)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              disabled={!canGoToPago}
              onClick={() => setStep("pago")}
              style={{
                flex: 1, height: 52, borderRadius: 14,
                fontSize: 15, fontWeight: 800, color: "white",
                background: canGoToPago
                  ? "linear-gradient(135deg, #0284C7, #0369A1)"
                  : "var(--border)",
                boxShadow: canGoToPago ? "0 5px 18px rgba(2,132,199,0.40)" : "none",
                cursor: canGoToPago ? "pointer" : "not-allowed",
                border: "none", transition: "all 200ms",
              }}
            >
              {service.price ? "Siguiente — Pago →" : "Siguiente — Confirmar →"}
            </button>
          </div>
        )}

        {step === "pago" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setStep("datos")}
              style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                border: "1.5px solid var(--border)", background: "var(--bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--text-mid)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              disabled={isPending}
              onClick={handleSubmit}
              style={{
                flex: 1, height: 52, borderRadius: 14,
                fontSize: 15, fontWeight: 800, color: "white",
                background: isPending
                  ? "#0369A1"
                  : "linear-gradient(135deg, #0284C7, #0369A1)",
                boxShadow: isPending ? "none" : "0 5px 18px rgba(2,132,199,0.40)",
                cursor: isPending ? "not-allowed" : "pointer",
                border: "none", transition: "all 200ms",
              }}
            >
              {isPending ? "Confirmando..." : "Confirmar turno →"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  )
}
