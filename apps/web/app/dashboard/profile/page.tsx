export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import Link from "next/link"
import LogoutButton from "./LogoutButton"
import BookingLinkBox from "./BookingLinkBox"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/onboarding/welcome")

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://bookzi-three.vercel.app").replace(/\/$/, "")
  const bookingUrl = `${appUrl}/book/${business.slug}`

  const initials = business.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Perfil</span>
        </div>
        <Link href="/dashboard" className="logo-home-btn">B</Link>
      </header>

      <div style={{ flex: 1, padding: "24px 16px 100px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {/* Avatar + nombre */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 16px 24px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 800, color: "white",
          }}>
            {initials}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-dark)" }}>{business.name}</div>
            {business.category && (
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>{business.category}</div>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{ background: "var(--bg-white)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Email</div>
            <div style={{ fontSize: 15, color: "var(--text-dark)" }}>{user.email}</div>
          </div>
          {business.phone && (
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>WhatsApp</div>
              <div style={{ fontSize: 15, color: "var(--text-dark)" }}>{business.phone}</div>
            </div>
          )}
          <div style={{ padding: "14px 16px" }}>
            <BookingLinkBox bookingUrl={bookingUrl} />
          </div>
        </div>

        {/* Configuración */}
        <div style={{ background: "var(--bg-white)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
          <Link href="/dashboard/availability" style={{ textDecoration: "none" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(2,132,199,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="3" width="16" height="13" rx="2.5" stroke="var(--primary)" strokeWidth="1.5"/><path d="M5 1v3M13 1v3M1 8h16" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-dark)" }}>Disponibilidad</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </Link>
          <Link href="/dashboard/services" style={{ textDecoration: "none" }}>
            <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(2,132,199,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 5h14M2 10h9M2 15h7" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-dark)" }}>Servicios</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </Link>
        </div>

        {/* Cerrar sesión */}
        <LogoutButton />

      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/dashboard" className="nav-item">
          <svg viewBox="0 0 22 22" fill="none"><rect x="1" y="1" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/><rect x="13" y="1" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/><rect x="1" y="13" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/><rect x="13" y="13" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/></svg>
          Inicio
        </Link>
        <Link href="/dashboard/agenda" className="nav-item">
          <svg viewBox="0 0 22 22" fill="none"><rect x="1" y="3" width="20" height="17" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M6 1v4M16 1v4M1 10h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Agenda
        </Link>
        <Link href="/dashboard/appointments/new" className="nav-item">
          <svg viewBox="0 0 22 22" fill="none"><path d="M2 5h18M2 11h12M2 17h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          Turnos
        </Link>
        <Link href="/dashboard/profile" className="nav-item active">
          <svg viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M2 20c0-3.5 4-6 9-6s9 2.5 9 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Perfil
        </Link>
      </nav>

    </div>
  )
}
