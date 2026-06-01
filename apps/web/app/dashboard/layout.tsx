import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import DashboardSidebar from "@/components/DashboardSidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()

  return (
    <div className="page-wrap">
      <DashboardSidebar
        businessName={business?.name ?? "Mi negocio"}
        businessCategory={business?.category ?? null}
      />
      <div className="main-wrap">
        {children}
      </div>
    </div>
  )
}
