"use client"

import { useState, useTransition } from "react"
import { getAvailableSlots, bookAppointment } from "@/lib/actions/booking"
import { BookziIcon } from "@/components/BookziLogo"

type Service = { id: string; name: string; durationMinutes: number; price: string | null }
type Business = { id: string; name: string; slug: string }

const MONTHS  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAYS_S  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

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

type Step = "date" | "slot" | "form"

export default function BookingClient({ business, service }: { business: Business; service: Service }) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [step, setStep]   = useState<Step>("date")
  const [isPending, startTransition] = useTransition()

  const cells = buildCalendar(year, month)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null); setSlots([]); setSelectedSlot(null); setStep("date")
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null); setSlots([]); setSelectedSlot(null); setStep("date")
  }

  async function selectDate(day: number) {
    const dateStr = toDateStr(year, month, day)
    setSelectedDate(dateStr)
    setSelectedSlot(null)
    setLoadingSlots(true)
    setStep("date")
    const available = await getAvailableSlots(business.id, service.id, dateStr)
    setSlots(available)
    setLoadingSlots(false)
    if (available.length > 0) setStep("slot")
  }

  const isPastDay = (day: number) => {
    const d = new Date(year, month, day)
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d < t
  }

  const steps = ["Fecha", "Horario", "Tus datos"]
  const stepIdx = step === "date" ? 0 : step === "slot" ? 1 : 2

  return (
    <div className="flex flex-col gap-5">

      {/* ── Progress ── */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all"
                style={i < stepIdx
                  ? { background: "var(--color-accent)", color: "white", boxShadow: "0 2px 8px rgba(5,150,105,0.3)" }
                  : i === stepIdx
                    ? { background: "linear-gradient(135deg, #0284C7, #0369A1)", color: "white", boxShadow: "0 2px 8px rgba(2,132,199,0.35)" }
                    : { background: "var(--color-border)", color: "var(--color-text-muted)" }
                }
              >
                {i < stepIdx ? "✓" : i + 1}
              </div>
              <span
                className="text-xs font-bold"
                style={{ color: i <= stepIdx ? "var(--color-text-dark)" : "var(--color-text-muted)" }}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 rounded-full transition-colors"
                style={{ background: i < stepIdx ? "var(--color-accent)" : "var(--color-border)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Resumen del servicio ── */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
        style={{ background: "rgba(2,132,199,0.06)", border: "1.5px solid rgba(2,132,199,0.15)" }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(2,132,199,0.12)" }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#0284C7" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-extrabold text-[var(--color-text-dark)] leading-tight text-sm">{service.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-medium">{formatDuration(service.durationMinutes)}</p>
          </div>
        </div>
        {service.price && (
          <p className="font-extrabold text-[var(--color-accent)] text-xl shrink-0">
            ${Number(service.price).toLocaleString("es-AR")}
          </p>
        )}
      </div>

      {/* ── Calendario ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm" style={{ border: "1.5px solid var(--color-border)" }}>

        {/* Nav del mes */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors hover:bg-[var(--color-bg)]"
            style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-extrabold text-[var(--color-text-dark)] text-base" style={{ letterSpacing: "-0.3px" }}>
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors hover:bg-[var(--color-bg)]"
            style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAYS_S.map(d => (
            <div key={d} className="text-[10px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-wide py-1">{d}</div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr = toDateStr(year, month, day)
            const past     = isPastDay(day)
            const selected = selectedDate === dateStr
            const isToday  = dateStr === toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
            return (
              <button
                key={i}
                disabled={past}
                onClick={() => selectDate(day)}
                className="aspect-square rounded-2xl text-sm font-bold transition-all relative"
                style={selected
                  ? {
                      background: "linear-gradient(135deg, #0284C7, #0369A1)",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(2,132,199,0.4)",
                    }
                  : isToday
                    ? {
                        color: "var(--color-primary)",
                        border: "1.5px solid var(--color-primary)",
                        background: "rgba(2,132,199,0.06)",
                      }
                    : past
                      ? { color: "var(--color-border)", cursor: "not-allowed" }
                      : { color: "var(--color-text-dark)" }
                }
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Slots disponibles ── */}
      {selectedDate && (
        <div className="bg-white rounded-3xl p-6 shadow-sm" style={{ border: "1.5px solid var(--color-border)" }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-extrabold text-[var(--color-text-dark)] text-base" style={{ letterSpacing: "-0.3px" }}>
                Horarios disponibles
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5 capitalize font-medium">
                {formatDateNice(selectedDate)}
              </p>
            </div>
            {selectedSlot && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(2,132,199,0.1)", color: "var(--color-primary)" }}
              >
                {selectedSlot} hs
              </span>
            )}
          </div>

          {loadingSlots ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] font-medium">Buscando horarios disponibles...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl mb-3">😕</p>
              <p className="text-[var(--color-text-dark)] font-bold mb-1">Sin horarios disponibles</p>
              <p className="text-sm text-[var(--color-text-muted)]">Intentá con otro día.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(slot => {
                const isSelected = selectedSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => { setSelectedSlot(slot); setStep("form") }}
                    className="h-12 rounded-2xl text-sm font-bold transition-all"
                    style={isSelected
                      ? {
                          background: "linear-gradient(135deg, #0284C7, #0369A1)",
                          color: "white",
                          border: "1.5px solid transparent",
                          boxShadow: "0 4px 12px rgba(2,132,199,0.35)",
                        }
                      : {
                          background: "var(--color-bg)",
                          color: "var(--color-text-dark)",
                          border: "1.5px solid var(--color-border)",
                        }
                    }
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "var(--color-primary)"
                        e.currentTarget.style.color = "var(--color-primary)"
                        e.currentTarget.style.background = "rgba(2,132,199,0.05)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "var(--color-border)"
                        e.currentTarget.style.color = "var(--color-text-dark)"
                        e.currentTarget.style.background = "var(--color-bg)"
                      }
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

      {/* ── Formulario de datos ── */}
      {selectedSlot && (
        <form
          action={(formData) => { startTransition(() => bookAppointment(formData)) }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm"
          style={{ border: "1.5px solid var(--color-border)" }}
        >
          <input type="hidden" name="businessId" value={business.id} />
          <input type="hidden" name="serviceId"  value={service.id} />
          <input type="hidden" name="date"        value={selectedDate!} />
          <input type="hidden" name="time"        value={selectedSlot} />

          <div className="px-6 pt-6 pb-2">
            <h3 className="font-extrabold text-[var(--color-text-dark)] text-base mb-0.5" style={{ letterSpacing: "-0.3px" }}>
              Tus datos de contacto
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">Para confirmar tu turno necesitamos estos datos.</p>
          </div>

          <div className="px-6 py-5 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                Nombre completo <span className="text-[var(--color-error)]">*</span>
              </label>
              <input name="clientName" type="text" required placeholder="Tu nombre completo" autoComplete="name" />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                WhatsApp / Teléfono <span className="text-[var(--color-error)]">*</span>
              </label>
              <input name="clientPhone" type="tel" required placeholder="+54 9 11 1234-5678" autoComplete="tel" />
              <p className="text-xs text-[var(--color-text-muted)] mt-2">Recibirás la confirmación por WhatsApp.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                Email <span className="text-xs font-medium text-[var(--color-text-muted)]">(opcional)</span>
              </label>
              <input name="clientEmail" type="email" placeholder="tu@email.com" autoComplete="email" />
            </div>
          </div>

          {/* Resumen + CTA */}
          <div
            className="px-6 py-5"
            style={{ borderTop: "1.5px solid var(--color-border)", background: "var(--color-bg)" }}
          >
            {/* Resumen del turno */}
            <div
              className="rounded-2xl px-5 py-4 mb-5"
              style={{ background: "white", border: "1.5px solid rgba(2,132,199,0.15)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-[var(--color-text-dark)] text-sm">{service.name}</p>
                  <p className="text-[var(--color-primary)] font-bold text-sm mt-1 capitalize">
                    {selectedDate ? formatDateNice(selectedDate) : ""} · {selectedSlot} hs
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-medium">
                    Duración: {formatDuration(service.durationMinutes)}
                  </p>
                </div>
                {service.price && (
                  <p className="font-extrabold text-[var(--color-accent)] text-lg shrink-0">
                    ${Number(service.price).toLocaleString("es-AR")}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-14 rounded-2xl font-extrabold text-white transition-all"
              style={{
                background: isPending ? "#0369A1" : "linear-gradient(135deg, #0284C7, #0369A1)",
                boxShadow: isPending ? "none" : "0 6px 20px rgba(2,132,199,0.45)",
                fontSize: 16,
              }}
            >
              {isPending ? "Confirmando tu turno..." : "Confirmar turno →"}
            </button>
            <p className="text-center text-xs text-[var(--color-text-muted)] mt-3 font-medium">
              Recibirás una confirmación por WhatsApp
            </p>
          </div>
        </form>
      )}

      <div className="flex items-center justify-center gap-2 pt-2">
        <BookziIcon size={14} />
        <p className="text-xs text-[var(--color-text-muted)] font-medium">
          Powered by <span className="font-bold text-[var(--color-primary)]">Bookzi</span>
        </p>
      </div>
    </div>
  )
}
