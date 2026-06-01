import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import DashboardSidebar from "@/components/DashboardSidebar"
import TrialBanner from "@/components/TrialBanner"
import TrialExpiredBanner from "@/components/TrialExpiredBanner"
import { db } from "@bookzi/db"
import { subscriptions } from "@bookzi/db/schema"
import { eq } from "drizzle-orm"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()

  const [sub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.businessId, business?.id ?? ""))
    .limit(1)

  const daysLeft = sub?.trialEndsAt
    ? Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : -1

  return (
    <div className="page-wrap">
      <DashboardSidebar
        businessName={business?.name ?? "Mi negocio"}
        businessCategory={business?.category ?? null}
      />
      <div className="main-wrap">
        {sub?.status === "active" && sub?.trialEndsAt && daysLeft >= 0 && (
          <TrialBanner daysLeft={daysLeft} />
        )}
        {sub && sub.trialEndsAt && daysLeft < 0 && sub.status !== "active" && (
          <TrialExpiredBanner />
        )}
        {children}
      </div>
    </div>
  )
}
