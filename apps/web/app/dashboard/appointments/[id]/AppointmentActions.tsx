"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { confirmAppointment, cancelAppointment, rescheduleAppointment } from "@/lib/actions/appointments"
import { getAvailableSlots } from "@/lib/actions/booking"

type Props = {
  id: string
  status: string
  clientName: string
  clientPhone: string | null
  serviceName: string
  serviceId: string
  durationMinutes: number
  startAtISO: string
  businessId: string
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAY_HDR = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"]

export default function AppointmentActions({
  id, status, clientName, clientPhone, serviceName,
  serviceId, durationMinutes, startAtISO, businessId,
}: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<"idle" | "reschedule" | "loading" | "done">("idle")
  const [doneLabel, setDoneLabel] = useState("")

  const [calYear,      setCalYear]      = useState(() => new Date().getFullYear())
  const [calMonth,     setCalMonth]     = useState(() => new Date().getMonth())
  const [selectedDay,  setSelectedDay]  = useState<number | null>(null)
  const [slots,        setSlots]        = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const startAt = new Date(startAtISO)

  function sendWhatsApp(msg: string) {
    if (!clientPhone) return
    const phone = clientPhone.replace(/\D/g, "")
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  function fmtDate(d: Date) {
    return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
  }
  function fmtTime(d: Date) {
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  }

  async function handleConfirm() {
    setPhase("loading")
    await confirmAppointment(id)
    sendWhatsApp(
      `Hola ${clientName}! ✅ Tu turno para *${serviceName}* el *${fmtDate(startAt)}* a las *${fmtTime(startAt)}* quedó *CONFIRMADO*. ¡Te esperamos!`
    )
    setDoneLabel("Turno confirmado")
    setPhase("done")
    setTimeout(() => router.push("/dashboard"), 1800)
  }

  async function handleCancel() {
    setPhase("loading")
    await cancelAppointment(id)
    sendWhatsApp(
      `Hola ${clientName}! ❌ Tu turno para *${serviceName}* del *${fmtDate(startAt)}* fue *CANCELADO*. Podés reservar un nuevo turno cuando quieras.`
    )
    setDoneLabel("Turno cancelado")
    setPhase("done")
    setTimeout(() => router.push("/dashboard"), 1800)
  }

  async function handleReschedule() {
    if (!selectedDay || !selectedSlot) return
    setPhase("loading")
    const newDate = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    await rescheduleAppointment(id, newDate, selectedSlot, durationMinutes)
    const newDT = new Date(`${newDate}T${selectedSlot}:00`)
    sendWhatsApp(
      `Hola ${clientName}! 🔄 Tu turno para *${serviceName}* fue *REPROGRAMADO* para el *${fmtDate(newDT)}* a las *${selectedSlot}*. ¡Te esperamos!`
    )
    setDoneLabel("Turno reprogramado")
    setPhase("done")
    setTimeout(() => router.push("/dashboard"), 1800)
  }

  useEffect(() => {
    if (phase !== "reschedule" || !selectedDay) { setSlots([]); return }
    let active = true
    setLoadingSlots(true)
    setSelectedSlot(null)
    const date = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    getAvailableSlots(businessId, serviceId, date)
      .then(s => { if (active) { setSlots(s); setLoadingSlots(false) } })
      .catch(() => { if (active) { setSlots([]); setLoadingSlots(false) } })
    return () => { active = false }
  }, [selectedDay, calYear, calMonth, phase])

  const calCells = useMemo(() => {
    const cells: { n: number; type: "prev" | "cur" | "next"; disabled: boolean }[] = []
    const firstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7
    const lastDate = new Date(calYear, calMonth + 1, 0).getDate()
    const prevLast = new Date(calYear, calMonth, 0).getDate()
    const now = new Date()
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    for (let i = 0; i < firstDow; i++) cells.push({ n: prevLast - firstDow + 1 + i, type: "prev", disabled: true })
    for (let d = 1; d <= lastDate; d++) cells.push({ n: d, type: "cur", disabled: new Date(calYear, calMonth, d) < todayMidnight })
    for (let d = 1; d <= 42 - cells.length; d++) cells.push({ n: d, type: "next", disabled: true })
    return cells
  }, [calYear, calMonth])

  const isPending   = status === "pending"
  const isConfirmed = status === "confirmed"
  if (!isPending && !isConfirmed) return null

  if (phase === "loading" || phase === "done") {
    return (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "white", borderTop: "1.5px solid #E0F0F8",
        padding: "0 16px", height: 80, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {phase === "loading" ? (
          <span style={{ fontWeight: 600, color: "#64748B", fontSize: 15 }}>Procesando...</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(5,150,105,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l3.5 3.5L12 2" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#059669" }}>{doneLabel} · Volviendo al inicio...</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1.5px solid #E0F0F8", zIndex: 50 }}>

      {/* Panel de reprogramación */}
      {phase === "reschedule" && (
        <div style={{ padding: "16px", borderBottom: "1.5px solid #E0F0F8", maxHeight: "58vh", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Nueva fecha y hora</span>
            <button
              onClick={() => { setPhase("idle"); setSelectedDay(null); setSelectedSlot(null) }}
              style={{ background: "none", border: "none", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer", fontFamily: "inherit" }}
            >
              Cerrar
            </button>
          </div>

          {/* Navegación del calendario */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button
              onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1); setSelectedDay(null) }}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E0F0F8", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{MONTHS[calMonth]} {calYear}</span>
            <button
              onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1); setSelectedDay(null) }}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E0F0F8", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 10l4-4-4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Grilla del calendario */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 14 }}>
            {DAY_HDR.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94A3B8", padding: "4px 0" }}>{d}</div>
            ))}
            {calCells.map((cell, i) => {
              const isSel   = cell.type === "cur" && selectedDay === cell.n
              const now     = new Date()
              const isToday = cell.type === "cur" && cell.n === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear()
              return (
                <div
                  key={i}
                  onClick={() => { if (!cell.disabled && cell.type === "cur") setSelectedDay(cell.n) }}
                  style={{
                    textAlign: "center", padding: "6px 0", borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isSel || isToday ? 700 : 500,
                    color: isSel ? "white" : cell.disabled ? "#CBD5E1" : isToday ? "#0284C7" : "#0F172A",
                    background: isSel ? "#0284C7" : isToday ? "rgba(2,132,199,0.08)" : "transparent",
                    cursor: cell.disabled ? "default" : "pointer",
                  }}
                >
                  {cell.n}
                </div>
              )
            })}
          </div>

          {/* Horarios disponibles */}
          {selectedDay && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Horarios disponibles
              </div>
              {loadingSlots ? (
                <p style={{ fontSize: 13, color: "#94A3B8" }}>Cargando...</p>
              ) : slots.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94A3B8" }}>Sin horarios disponibles para este día.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {slots.map(t => (
                    <div
                      key={t}
                      onClick={() => setSelectedSlot(t)}
                      style={{
                        padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${selectedSlot === t ? "#0284C7" : "#E0F0F8"}`,
                        background: selectedSlot === t ? "#0284C7" : "white",
                        color: selectedSlot === t ? "white" : "#0F172A",
                        fontSize: 13, fontWeight: 700,
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botón confirmar reprogramación */}
          {selectedSlot && (
            <button
              onClick={handleReschedule}
              style={{
                marginTop: 14, width: "100%", height: 46, borderRadius: 12,
                border: "none", background: "linear-gradient(135deg, #0284C7, #0369A1)",
                color: "white", fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                cursor: "pointer", boxShadow: "0 2px 8px rgba(2,132,199,0.3)",
              }}
            >
              Confirmar — {MONTHS[calMonth].slice(0, 3)} {selectedDay} a las {selectedSlot}
            </button>
          )}
        </div>
      )}

      {/* Botones principales */}
      <div style={{ padding: "12px 16px", display: "flex", gap: 8 }}>
        {isPending && (
          <button
            onClick={handleConfirm}
            style={{
              flex: 2, height: 48, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #059669, #047857)",
              color: "white", fontWeight: 700, fontSize: 14,
              fontFamily: "inherit", cursor: "pointer",
              boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
            }}
          >
            ✓ Confirmar
          </button>
        )}
        <button
          onClick={() => setPhase(phase === "reschedule" ? "idle" : "reschedule")}
          style={{
            flex: 1, height: 48, borderRadius: 12, fontFamily: "inherit",
            border: `1.5px solid ${phase === "reschedule" ? "#0284C7" : "#E0F0F8"}`,
            background: phase === "reschedule" ? "rgba(2,132,199,0.08)" : "white",
            color: phase === "reschedule" ? "#0284C7" : "#334155",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          Reprogramar
        </button>
        <button
          onClick={handleCancel}
          style={{
            flex: 1, height: 48, borderRadius: 12,
            border: "1.5px solid #FFE4E4", background: "white",
            color: "#DC2626", fontWeight: 700, fontSize: 14,
            fontFamily: "inherit", cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
