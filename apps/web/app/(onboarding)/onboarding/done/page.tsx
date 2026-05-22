import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import DoneClient from "./DoneClient"

export default async function OnboardingDonePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  const slug = business?.slug ?? "mi-negocio"

  return <DoneClient slug={slug} />
}
