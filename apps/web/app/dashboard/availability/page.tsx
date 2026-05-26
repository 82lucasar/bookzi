export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAvailability } from "@/lib/actions/availability"
import { getServices } from "@/lib/actions/services"
import AvailabilityForm from "./AvailabilityForm"

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const [schedule, serviceList] = await Promise.all([
    getAvailability(),
    getServices(),
  ])

  const services = serviceList.map(s => ({ id: s.id, name: s.name }))

  return (
    <div>
      <div className="bg-white border-b border-[var(--color-border)] px-6 lg:px-10 py-6">
        <h1 className="text-2xl font-extrabold text-[var(--color-text-dark)]">Horarios de atención</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          Configurá los días y horarios en que tu negocio acepta reservas
        </p>
      </div>

      <div className="px-6 lg:px-10 py-8 max-w-2xl">
        <AvailabilityForm initial={schedule} services={services} />
      </div>
    </div>
  )
}
