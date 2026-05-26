"use client"

import { useState } from "react"
import Link from "next/link"
import { saveOnboardingServices } from "@/lib/actions/services"

interface Service {
  id: number
  name: string
  duration: string
  price: string
  maxPerDay: string
}

const DURATIONS = [
  { value: "15",  label: "15 min" },
  { value: "30",  label: "30 min" },
  { value: "45",  label: "45 min" },
  { value: "60",  label: "1 hora" },
  { value: "90",  label: "1h 30m" },
  { value: "120", label: "2 horas" },
  { value: "180", label: "3 horas" },
]

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([
    { id: 1, name: "", duration: "30", price: "", maxPerDay: "" }
  ])
  const [nextId, setNextId] = useState(2)
  const [loading, setLoading] = useState(false)

  const addService = () => {
    setServices(prev => [...prev, { id: nextId, name: "", duration: "30", price: "", maxPerDay: "" }])
    setNextId(n => n + 1)
  }

  const removeService = (id: number) => {
    setServices(prev => prev.filter(s => s.id !== id))
  }

  const update = (id: number, field: keyof Service, value: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const handleNext = async () => {
    setLoading(true)
    await saveOnboardingServices(
      services.map(s => ({
        name: s.name,
        durationMinutes: parseInt(s.duration),
        price: s.price,
        maxPerDay: s.maxPerDay.trim() !== "" ? parseInt(s.maxPerDay) : null,
      }))
    )
  }

  return (
    <div className="ob-screen">
      <div className="ob-header">
        <div className="ob-header-left">
          <Link href="/dashboard/setup" className="ob-back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span className="step-label">Paso 2 de 3</span>
        </div>
        <Link href="/dashboard" className="logo-home-btn">
          <div className="logo-mark">B</div>
          <span className="logo-text">Bookzi</span>
        </Link>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "66%" }}></div>
        </div>
      </div>

      <div className="ob-body" style={{ gap: 24, paddingBottom: 120 }}>
        <div>
          <h1 className="ob-title">¿Qué servicios ofrecés?</h1>
          <p className="ob-subtitle">Podés agregar más después desde tu perfil.</p>
        </div>

        <div className="services-list">
          {services.map((s, i) => (
            <div key={s.id} className="service-item">
              <div className="service-item-header">
                <span className="service-num">Servicio {i + 1}</span>
                {services.length > 1 && (
                  <button className="service-remove" type="button" onClick={() => removeService(s.id)}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>

              <div className="service-fields">
                {/* Nombre */}
                <div className="form-group">
                  <label className="form-label">Nombre del servicio</label>
                  <input
                    className="form-input"
                    type="text"
                    value={s.name}
                    placeholder="Ej: Consulta general"
                    onChange={e => update(s.id, "name", e.target.value)}
                  />
                </div>

                {/* Duración + Precio */}
                <div className="service-row-inline">
                  <div className="form-group">
                    <label className="form-label">Duración</label>
                    <select
                      className="form-select"
                      value={s.duration}
                      onChange={e => update(s.id, "duration", e.target.value)}
                    >
                      {DURATIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio (opcional)</label>
                    <input
                      className="form-input"
                      type="text"
                      inputMode="decimal"
                      value={s.price}
                      placeholder="$ 0.00"
                      onChange={e => update(s.id, "price", e.target.value)}
                    />
                  </div>
                </div>

                {/* Reservas por día */}
                <div className="form-group">
                  <label className="form-label">Reservas disponibles por día (opcional)</label>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      color: "var(--text-muted)", display: "flex", alignItems: "center",
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <input
                      className="form-input"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={s.maxPerDay}
                      placeholder="Sin límite"
                      onChange={e => update(s.id, "maxPerDay", e.target.value)}
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    Cuántos turnos de este servicio podés tomar en un día. Dejalo vacío si no querés limitar.
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="add-service-btn" type="button" onClick={addService}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Agregar servicio
        </button>
      </div>

      <div className="ob-footer" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          className="btn btn-primary btn-full btn-lg"
          type="button"
          disabled={loading}
          style={{ opacity: loading ? 0.8 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          onClick={handleNext}
        >
          {loading ? "Guardando..." : "Siguiente →"}
        </button>
      </div>
    </div>
  )
}
