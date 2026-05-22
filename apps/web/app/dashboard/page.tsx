import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-extrabold text-[var(--color-primary)]">Bookzi</span>
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
          ¡Bienvenido!
        </h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          {user.email}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Turnos de hoy", value: "—" },
            { label: "Esta semana", value: "—" },
            { label: "Clientes activos", value: "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-[var(--color-border)] p-6"
            >
              <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
              <p className="text-3xl font-bold text-[var(--color-text-dark)] mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-[var(--color-border)] p-6">
          <p className="text-sm text-[var(--color-text-muted)] text-center">
            Tu agenda se va a mostrar acá. Próximamente.
          </p>
        </div>
      </main>
    </div>
  )
}
