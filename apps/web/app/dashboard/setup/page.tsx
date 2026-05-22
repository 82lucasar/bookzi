import { createBusiness } from "@/lib/actions/business"

const CATEGORIES = [
  "Peluquería y estética",
  "Salud y bienestar",
  "Odontología",
  "Psicología",
  "Nutrición",
  "Educación y clases",
  "Consultoría",
  "Otro",
]

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[var(--color-border)] p-8">
        <div className="mb-6">
          <span className="text-2xl font-extrabold text-[var(--color-primary)]">Bookzi</span>
          <h1 className="text-xl font-bold text-[var(--color-text-dark)] mt-3">
            Configurá tu negocio
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Completá los datos para empezar a recibir turnos.
          </p>
        </div>

        <form action={createBusiness} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
              Nombre del negocio <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej: Peluquería Sol"
              className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
              Rubro
            </label>
            <select
              name="category"
              className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
            >
              <option value="">Seleccioná un rubro</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
              Teléfono de contacto
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="Ej: +54 9 11 1234-5678"
              className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            className="mt-2 h-10 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Crear mi negocio →
          </button>
        </form>
      </div>
    </div>
  )
}
