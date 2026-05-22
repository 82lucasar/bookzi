import { createBusiness } from "@/lib/actions/business"
import SetupDurationPicker from "./SetupDurationPicker"
import Link from "next/link"

const CATEGORIES = [
  "Medicina / Salud",
  "Peluquería / Estética",
  "Psicología",
  "Entrenamiento personal",
  "Odontología",
  "Nutrición",
  "Gimnasio",
  "Pádel",
  "Tenis",
  "Fútbol",
  "Otro",
]

export default function SetupPage() {
  return (
    <div className="ob-screen">
      <div className="ob-header">
        <Link href="/onboarding/welcome" className="ob-back-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <span className="step-label">Paso 1 de 3</span>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "33%" }}></div>
        </div>
      </div>

      <form action={createBusiness} className="ob-body">
        <div>
          <h1 className="ob-title">¿Cómo se llama<br/>tu negocio?</h1>
          <p className="ob-subtitle">Esto va a aparecer en tu página de reservas.</p>
        </div>

        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">Nombre del negocio *</label>
            <input
              className="form-input"
              type="text"
              name="name"
              placeholder="Ej: Centro Médico Martina López"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rubro</label>
            <select className="form-select" name="category">
              <option value="" disabled>Seleccioná tu rubro</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <SetupDurationPicker />
        </div>

        <div className="ob-footer">
          <button type="submit" className="btn btn-primary btn-full btn-lg">
            Siguiente
          </button>
        </div>
      </form>
    </div>
  )
}
