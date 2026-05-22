import { createService } from "@/lib/actions/services"

const DURATIONS = [
  { label: "15 minutos", value: 15 },
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "1 hora", value: 60 },
  { label: "1h 30min", value: 90 },
  { label: "2 horas", value: 120 },
  { label: "3 horas", value: 180 },
]

export default function NewServicePage() {
  return (
    <div className="min-h-screen">

      {/* Page header */}
      <div
        className="bg-white px-6 lg:px-10 py-6 flex items-center gap-3"
        style={{ borderBottom: "1.5px solid var(--color-border)" }}
      >
        <a
          href="/dashboard/services"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Servicios
        </a>
        <span style={{ color: "var(--color-border)" }}>/</span>
        <span className="text-sm font-bold text-[var(--color-text-dark)]">Nuevo servicio</span>
      </div>

      <div className="px-6 lg:px-10 py-8 max-w-lg">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ letterSpacing: "-0.5px" }}>
            Agregar servicio
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Completá los datos del servicio que querés ofrecer.
          </p>
        </div>

        <form action={createService} className="bg-white rounded-3xl shadow-sm overflow-hidden" style={{ border: "1.5px solid var(--color-border)" }}>
          <div className="p-7 flex flex-col gap-6">

            <div>
              <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                Nombre del servicio <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Ej: Corte de pelo"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                Descripción <span className="text-xs font-medium text-[var(--color-text-muted)]">(opcional)</span>
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Ej: Incluye lavado y secado con blow dry"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-2">Tus clientes verán esta descripción al reservar.</p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                  Duración <span className="text-[var(--color-error)]">*</span>
                </label>
                <select name="durationMinutes" required>
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                  Pausa entre turnos
                </label>
                <select name="bufferMinutes">
                  <option value={0}>Sin pausa</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                Precio <span className="text-xs font-medium text-[var(--color-text-muted)]">(ARS, opcional)</span>
              </label>
              <div className="relative">
                <span
                  className="absolute left-5 top-1/2 -translate-y-1/2 font-extrabold pointer-events-none text-[var(--color-text-muted)]"
                  style={{ fontSize: 15 }}
                >
                  $
                </span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  style={{ paddingLeft: "2.25rem" }}
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">Dejalo en 0 si no querés mostrar precio.</p>
            </div>
          </div>

          {/* Footer del form */}
          <div
            className="px-7 py-5 flex gap-3"
            style={{ borderTop: "1.5px solid var(--color-border)", background: "var(--color-bg)" }}
          >
            <a
              href="/dashboard/services"
              className="flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center transition-all hover:bg-white"
              style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-mid)" }}
            >
              Cancelar
            </a>
            <button
              type="submit"
              className="flex-1 h-12 rounded-2xl font-bold text-sm text-white transition-all hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #0284C7, #0369A1)",
                boxShadow: "0 2px 10px rgba(2,132,199,0.3)",
              }}
            >
              Guardar servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
