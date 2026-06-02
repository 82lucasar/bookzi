export const dynamic = "force-dynamic"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStaff } from "@/lib/actions/staff"
import Link from "next/link"
import StaffEditForm from "./StaffEditForm"

export default async function StaffEditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { id } = await params
  const staffList = await getStaff()
  const member = staffList.find(s => s.id === id)
  if (!member) notFound()

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard/staff" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Editar colaborador</span>
        </div>
        <Link href={`/dashboard/staff/${id}/availability`} style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
          Disponibilidad
        </Link>
      </header>

      <StaffEditForm id={id} initialName={member.name} isActive={member.isActive} />
    </div>
  )
}
