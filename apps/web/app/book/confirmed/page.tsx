import { db } from "@bookzi/db"
import { appointments, services, businesses } from "@bookzi/db/schema"
import { eq } from "drizzle-orm"

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  let info: { service: string; business: string; startAt: Date } | null = null

  if (id) {
    const [appt] = await db
      .select({
        startAt: appointments.startAt,
        serviceName: services.name,
        businessName: businesses.name,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(businesses, eq(appointments.businessId, businesses.id))
      .where(eq(appointments.id, id))
      .limit(1)

    if (appt) {
      info = {
        service: appt.serviceName,
        business: appt.businessName,
        startAt: appt.startAt,
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-text-dark)] mb-2">
          ¡Turno confirmado!
        </h1>

        {info ? (
          <div className="bg-[var(--color-bg)] rounded-xl p-4 text-sm text-left mt-4 mb-6">
            <p className="font-semibold text-[var(--color-text-dark)]">{info.service}</p>
            <p className="text-[var(--color-text-muted)] mt-0.5">{info.business}</p>
            <p className="text-[var(--color-primary)] font-medium mt-2">
              {new Date(info.startAt).toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              a las{" "}
              {new Date(info.startAt).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)] mt-2 mb-6">
            Tu turno fue registrado correctamente.
          </p>
        )}

        <p className="text-sm text-[var(--color-text-muted)]">
          Te vemos pronto 👋
        </p>

        <p className="text-xs text-[var(--color-text-muted)] mt-8">
          Powered by <span className="font-semibold text-[var(--color-primary)]">Bookzi</span>
        </p>
      </div>
    </div>
  )
}
