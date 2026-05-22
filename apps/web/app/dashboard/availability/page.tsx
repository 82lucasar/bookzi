import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAvailability } from "@/lib/actions/availability"
import AvailabilityForm from "./AvailabilityForm"

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const schedule = await getAvailability()

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center gap-3">
        <a href="/dashboard" className="text-xl font-extrabold text-[var(--color-primary)]">Bookzi</a>
        <span className="text-[var(--color-border)]">/</span>
        <span className="text-sm font-medium text-[var(--color-text-dark)]">Disponibilidad</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">
            Horarios de atención
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Configurá los días y horarios en que tu negocio acepta turnos.
          </p>
        </div>

        <AvailabilityForm initial={schedule} />
      </main>
    </div>
  )
}
