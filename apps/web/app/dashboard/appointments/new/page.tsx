export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getServices } from "@/lib/actions/services"
import NewAppointmentForm from "./NewAppointmentForm"

export default async function NewAppointmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const serviceList = await getServices()

  return (
    <NewAppointmentForm
      business={{ id: business.id, name: business.name }}
      services={serviceList.map(s => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        price: s.price ?? null,
      }))}
    />
  )
}
