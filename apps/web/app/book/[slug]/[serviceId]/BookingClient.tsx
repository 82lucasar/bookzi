"use client"

import { useState, useTransition } from "react"
import { getAvailableSlots, bookAppointment } from "@/lib/actions/booking"

type Service = {
  id: string
  name: string
  durationMinutes: number
  price: string | null
}

type Business = {
  id: string
  name: string
  slug: string
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAYS_SHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(first).fill(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  return cells
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export default function BookingClient({
  business,
  service,
}: {
  business: Business
  service: Service
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isPending, startTransition] = useTransition()

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
    const available = await getAvailableSlots(business.id, service.id, dateStr)
    setSlots(available)
    setLoadingSlots(false)
  }

  const isPastDay = (day: number) => {
    const d = new Date(year, month, day)
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d < t
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Calendario */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">←</button>
          <span className="font-semibold text-[var(--color-text-dark)]">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">→</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-xs font-medium text-[var(--color-text-muted)] py-1">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr = toDateStr(year, month, day)
            const past = isPastDay(day)
            const selected = selectedDate === dateStr
            return (
              <button
                key={i}
                disabled={past}
                onClick={() => selectDate(day)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors
                  ${past ? "text-[var(--color-border)] cursor-not-allowed" : "hover:bg-[var(--color-bg)]"}
                  ${selected ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]" : ""}
                `}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Slots */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
          <h3 className="font-semibold text-[var(--color-text-dark)] mb-3 text-sm">
            Horarios disponibles
          </h3>
          {loadingSlots ? (
            <p className="text-sm text-[var(--color-text-muted)]">Cargando horarios...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Sin disponibilidad para este día.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`h-10 rounded-lg text-sm font-medium border transition-colors
                    ${selectedSlot === slot
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text-dark)]"
                    }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulario del cliente */}
      {selectedSlot && (
        <form
          action={(formData) => {
            startTransition(() => bookAppointment(formData))
          }}
          className="bg-white rounded-2xl border border-[var(--color-border)] p-5 flex flex-col gap-4"
        >
          <input type="hidden" name="businessId" value={business.id} />
          <input type="hidden" name="serviceId" value={service.id} />
          <input type="hidden" name="date" value={selectedDate!} />
          <input type="hidden" name="time" value={selectedSlot} />

          <h3 className="font-semibold text-[var(--color-text-dark)] text-sm">Tus datos</h3>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
              Nombre completo <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              name="clientName"
              type="text"
              required
              placeholder="Tu nombre"
              className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
              Teléfono <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              name="clientPhone"
              type="tel"
              required
              placeholder="+54 9 11 1234-5678"
              className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
              Email
            </label>
            <input
              name="clientEmail"
              type="email"
              placeholder="tu@email.com"
              className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="bg-[var(--color-bg)] rounded-xl p-3 text-sm">
            <p className="font-medium text-[var(--color-text-dark)]">{service.name}</p>
            <p className="text-[var(--color-text-muted)]">
              {selectedDate} a las {selectedSlot}
              {service.price && ` · $ ${Number(service.price).toLocaleString("es-AR")}`}
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)] disabled:opacity-60 transition-colors"
          >
            {isPending ? "Reservando..." : "Confirmar turno"}
          </button>
        </form>
      )}
    </div>
  )
}
