import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { db } from "@bookzi/db"
import { appointments, services } from "@bookzi/db/schema"
import { eq, and, gte, lt, count, isNull } from "drizzle-orm"

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

  const [serviceCount] = await db
    .select({ count: count() })
    .from(services)
    .where(and(
      eq(services.businessId, business.id),
      eq(services.isActive, true),
      isNull(services.deletedAt),
    ))

  const stats = [
    { label: "Turnos de hoy", value: todayCount?.count ?? 0 },
    { label: "Esta semana", value: weekCount?.count ?? 0 },
    { label: "Servicios activos", value: serviceCount?.count ?? 0 },
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              href: "/dashboard/services",
              title: "Servicios",
              desc: "Administrá los servicios que ofrecés y sus precios.",
              icon: "✂️",
            },
            {
              href: "/dashboard/availability",
              title: "Horarios",
              desc: "Configurá los días y horarios de atención.",
              icon: "🕐",
            },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl border border-[var(--color-border)] p-6 hover:border-[var(--color-primary)] hover:shadow-sm transition-all group"
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="font-semibold text-[var(--color-text-dark)] mt-2 group-hover:text-[var(--color-primary)]">
                {item.title}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{item.desc}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
