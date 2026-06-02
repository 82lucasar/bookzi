export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAvailability } from "@/lib/actions/availability"
import { getServices } from "@/lib/actions/services"
import { getStaff } from "@/lib/actions/staff"
import { getBlocks } from "@/lib/actions/blocks"
import AvailabilityForm from "./AvailabilityForm"
import BlocksManager from "./BlocksManager"
import Link from "next/link"

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const [schedule, serviceList, staffList, blocks] = await Promise.all([
    getAvailability(),
    getServices(),
    getStaff(),
    getBlocks(),
  ])
  const activeStaffCount = staffList.filter(s => s.isActive).length

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

      <div style={{ flex: 1, padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>

        {activeStaffCount >= 2 && (
          <div style={{
            background: "rgba(2,132,199,0.07)", borderRadius: 14,
            border: "1.5px solid rgba(2,132,199,0.20)", padding: "12px 16px",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="9" cy="9" r="8" stroke="var(--primary)" strokeWidth="1.4"/>
              <path d="M9 8v5M9 6h.01" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", marginBottom: 2 }}>
                Tenés {activeStaffCount} colaboradores activos
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Estos horarios se usan como respaldo cuando un colaborador no tiene su propia disponibilidad configurada.
                Los clientes ven la disponibilidad combinada de todos.{" "}
                <Link href="/dashboard/staff" style={{ color: "var(--primary)", fontWeight: 700 }}>
                  Configurar por colaborador →
                </Link>
              </div>
            </div>
          </div>
        )}

        <AvailabilityForm initial={schedule} services={services} />

        {/* Separador */}
        <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

        {/* Bloques puntuales */}
        <BlocksManager initial={blocks} />

      </div>
    </div>
  )
}
