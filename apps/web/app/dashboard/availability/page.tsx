export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAvailability } from "@/lib/actions/availability"
import { getServices } from "@/lib/actions/services"
import AvailabilityForm from "./AvailabilityForm"
import Link from "next/link"

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
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard/profile" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Horarios de atención</span>
        </div>
        <Link href="/dashboard" className="logo-home-btn">B</Link>
      </header>

      <div style={{ flex: 1, padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <AvailabilityForm initial={schedule} services={services} />
      </div>
    </div>
  )
}
