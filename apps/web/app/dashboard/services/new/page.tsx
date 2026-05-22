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
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center gap-3">
        <a href="/dashboard/services" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-dark)] text-sm">
          ← Servicios
        </a>
        <span className="text-[var(--color-border)]">/</span>
        <span className="text-sm font-medium text-[var(--color-text-dark)]">Nuevo servicio</span>
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[var(--color-text-dark)] mb-6">
          Agregar servicio
        </h1>

        <form action={createService} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
              Nombre del servicio <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej: Corte de pelo"
              className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Ej: Incluye lavado y secado"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
                Duración <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                name="durationMinutes"
                required
                className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
                Pausa entre turnos
              </label>
              <select
                name="bufferMinutes"
                className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
              >
                <option value={0}>Sin pausa</option>
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-mid)] mb-1">
              Precio (ARS)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">$</span>
              <input
                name="price"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <a
              href="/dashboard/services"
              className="flex-1 h-10 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-mid)] flex items-center justify-center hover:bg-[var(--color-bg)] transition-colors"
            >
              Cancelar
            </a>
            <button
              type="submit"
              className="flex-1 h-10 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Guardar servicio
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
