import { notFound } from "next/navigation"
import { getBookingBusiness } from "@/lib/actions/booking"

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getBookingBusiness(slug)
  if (!data) notFound()

  const { business, services } = data

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-5 text-center">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Reserva online</p>
        <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">{business.name}</h1>
        {business.category && (
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{business.category}</p>
        )}
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <h2 className="text-base font-semibold text-[var(--color-text-mid)] mb-4">
          Elegí un servicio
        </h2>

        {services.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm text-center py-12">
            Este negocio aún no tiene servicios disponibles.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {services.map((service) => (
              <a
                key={service.id}
                href={`/book/${slug}/${service.id}`}
                className="bg-white rounded-2xl border border-[var(--color-border)] px-6 py-4 flex items-center justify-between hover:border-[var(--color-primary)] hover:shadow-sm transition-all group"
              >
                <div>
                  <p className="font-semibold text-[var(--color-text-dark)] group-hover:text-[var(--color-primary)]">
                    {service.name}
                  </p>
                  {service.description && (
                    <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{service.description}</p>
                  )}
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {formatDuration(service.durationMinutes)}
                  </p>
                </div>
                <div className="text-right ml-4">
                  {service.price && (
                    <p className="font-bold text-[var(--color-accent)]">
                      $ {Number(service.price).toLocaleString("es-AR")}
                    </p>
                  )}
                  <span className="text-[var(--color-primary)] text-sm">→</span>
                </div>
              </a>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-10">
          Powered by <span className="font-semibold text-[var(--color-primary)]">Bookzi</span>
        </p>
      </main>
    </div>
  )
}
