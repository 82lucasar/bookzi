"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Service { id: number; name: string; duration: string; price: string }

const DURATIONS = ["15", "30", "45", "60", "90", "120", "180"]

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([
    { id: 1, name: "Consulta general", duration: "30", price: "" }
  ])
  const [nextId, setNextId] = useState(2)

  const addService = () => {
    setServices(prev => [...prev, { id: nextId, name: "", duration: "30", price: "" }])
    setNextId(n => n + 1)
  }

  const removeService = (id: number) => {
    setServices(prev => prev.filter(s => s.id !== id))
  }

  const updateService = (id: number, field: keyof Service, value: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  return (
    <div className="ob-screen">
      <div className="ob-header">
        <Link href="/onboarding/availability" className="ob-back-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <span className="step-label">Paso 3 de 3</span>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "100%" }}></div>
        </div>
      </div>

      <div className="ob-body" style={{ gap: 24 }}>
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
                <div className="form-group">
                  <label className="form-label">Nombre del servicio</label>
                  <input
                    className="form-input"
                    type="text"
                    value={s.name}
                    placeholder="Ej: Consulta de seguimiento"
                    onChange={e => updateService(s.id, "name", e.target.value)}
                  />
                </div>
                <div className="service-row-inline">
                  <div className="form-group">
                    <label className="form-label">Duración</label>
                    <select
                      className="form-select"
                      value={s.duration}
                      onChange={e => updateService(s.id, "duration", e.target.value)}
                    >
                      {DURATIONS.map(d => (
                        <option key={d} value={d}>{d} min</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio (opcional)</label>
                    <input
                      className="form-input"
                      type="text"
                      value={s.price}
                      placeholder="$ 0.00"
                      onChange={e => updateService(s.id, "price", e.target.value)}
                    />
                  </div>
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

      <div className="ob-footer">
        <button
          className="btn btn-primary btn-full btn-lg"
          type="button"
          onClick={() => router.push("/onboarding/done")}
        >
          ¡Listo! Ver mi agenda
        </button>
      </div>
    </div>
  )
}
