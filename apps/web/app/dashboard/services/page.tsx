import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getServices, deleteService } from "@/lib/actions/services"

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function formatPrice(price: string | null) {
  if (!price) return "Sin precio"
  return `$ ${Number(price).toLocaleString("es-AR")}`
}

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const serviceList = await getServices()

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-xl font-extrabold text-[var(--color-primary)]">Bookzi</a>
          <span className="text-[var(--color-border)]">/</span>
          <span className="text-sm font-medium text-[var(--color-text-dark)]">Servicios</span>
        </div>
        <a
          href="/dashboard/services/new"
          className="h-9 px-4 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm flex items-center hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          + Nuevo servicio
        </a>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[var(--color-text-dark)] mb-6">
          Tus servicios
        </h1>

        {serviceList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center">
            <p className="text-[var(--color-text-muted)] mb-4">
              Todavía no agregaste ningún servicio.
            </p>
            <a
              href="/dashboard/services/new"
              className="inline-flex items-center h-10 px-5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              + Agregar primer servicio
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {serviceList.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-[var(--color-border)] px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-[var(--color-text-dark)]">{service.name}</p>
                  {service.description && (
                    <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full px-2 py-0.5 text-[var(--color-text-mid)]">
                      {formatDuration(service.durationMinutes)}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-accent)]">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </div>
                <form action={deleteService.bind(null, service.id)}>
                  <button
                    type="submit"
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
