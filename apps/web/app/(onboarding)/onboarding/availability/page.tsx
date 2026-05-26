import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getServices } from "@/lib/actions/services"
import AvailabilityOnboardingForm from "./AvailabilityOnboardingForm"

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const serviceList = await getServices()
  const services = serviceList.map(s => ({ id: s.id, name: s.name }))

  return <AvailabilityOnboardingForm services={services} />
}
