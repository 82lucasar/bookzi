export const dynamic = "force-dynamic"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStaff } from "@/lib/actions/staff"
import { getAvailability } from "@/lib/actions/availability"
import { getServices } from "@/lib/actions/services"
import Link from "next/link"
import AvailabilityForm from "@/app/dashboard/availability/AvailabilityForm"

export default async function StaffAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { id } = await params
  const [staffList, initial, services] = await Promise.all([
    getStaff(),
    getAvailability(id),
    getServices(),
  ])

  const member = staffList.find(s => s.id === id)
  if (!member) notFound()

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={`/dashboard/staff/${id}`} className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)", lineHeight: 1.2 }}>Disponibilidad</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{member.name}</div>
          </div>
        </div>
        <Link href="/dashboard" className="logo-home-btn">B</Link>
      </header>

      <div style={{ flex: 1, padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <AvailabilityForm initial={initial} services={services} staffId={id} />
      </div>
    </div>
  )
}
