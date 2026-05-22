import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { db } from "@bookzi/db"
import { appointments } from "@bookzi/db/schema"
import { eq, and, gte, lt, count } from "drizzle-orm"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86400000)
  const weekEnd = new Date(todayStart.getTime() + 7 * 86400000)

  const [todayCount] = await db
    .select({ count: count() })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, business.id),
      gte(appointments.startAt, todayStart),
      lt(appointments.startAt, todayEnd),
    ))

  const [weekCount] = await db
    .select({ count: count() })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, business.id),
      gte(appointments.startAt, todayStart),
      lt(appointments.startAt, weekEnd),
    ))

  const stats = [
    { label: "Turnos de hoy", value: todayCount?.count ?? 0 },
    { label: "Esta semana", value: weekCount?.count ?? 0 },
    { label: "Servicios activos", value: "—" },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xl font-extrabold text-[var(--color-primary)]">Bookzi</span>
          <span className="ml-3 text-sm text-[var(--color-text-muted)]">{business.name}</span>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-dark)] transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[var(--color-text-dark)] mb-1">
          Buen día 👋
        </h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-[var(--color-border)] p-6"
            >
              <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
              <p className="text-3xl font-bold text-[var(--color-text-dark)] mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 text-center">
          <p className="text-[var(--color-text-muted)] text-sm mb-4">
            Tu agenda está lista. Próximamente vas a poder agregar servicios y ver los turnos acá.
          </p>
          <a
            href="/dashboard/services/new"
            className="inline-flex items-center h-10 px-5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            + Agregar primer servicio
          </a>
        </div>
      </main>
    </div>
  )
}
