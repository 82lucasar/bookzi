import { notFound } from "next/navigation"
import { getBookingBusiness } from "@/lib/actions/booking"
import BookingClient from "./BookingClient"

export default async function BookServicePage({
  params,
}: {
  params: Promise<{ slug: string; serviceId: string }>
}) {
  const { slug, serviceId } = await params
  const data = await getBookingBusiness(slug)
  if (!data) notFound()

  const service = data.services.find((s) => s.id === serviceId)
  if (!service) notFound()

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center gap-3">
        <a
          href={`/book/${slug}`}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-dark)] text-sm"
        >
          ← {data.business.name}
        </a>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">{service.name}</h1>
          {service.description && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{service.description}</p>
          )}
        </div>

        <BookingClient
          business={{
            id: data.business.id,
            name: data.business.name,
            slug: data.business.slug,
          }}
          service={{
            id: service.id,
            name: service.name,
            durationMinutes: service.durationMinutes,
            price: service.price,
          }}
        />

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-10">
          Powered by <span className="font-semibold text-[var(--color-primary)]">Bookzi</span>
        </p>
      </main>
    </div>
  )
}
