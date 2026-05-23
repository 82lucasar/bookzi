export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAppointmentsForCalendar } from "@/lib/actions/appointments"
import AgendaCalendar from "./AgendaCalendar"

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const appts = await getAppointmentsForCalendar()

  const serialized = appts.map(a => ({
    id: a.id,
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    status: a.status,
    clientName: a.clientName,
    serviceName: a.serviceName,
  }))

  return <AgendaCalendar appointments={serialized} />
}
