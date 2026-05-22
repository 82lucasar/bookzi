export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/onboarding/welcome")

  return (
    <div className="page-wrap">

      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">B</div>
          <span className="sidebar-logo-text">Bookzi</span>
        </div>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="sidebar-link active">
            <svg viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="6.5" height="6.5" rx="2" fill="currentColor"/><rect x="10.5" y="1" width="6.5" height="6.5" rx="2" fill="currentColor" opacity=".5"/><rect x="1" y="10.5" width="6.5" height="6.5" rx="2" fill="currentColor" opacity=".5"/><rect x="10.5" y="10.5" width="6.5" height="6.5" rx="2" fill="currentColor" opacity=".5"/></svg>
            Inicio
          </Link>
          <Link href="/dashboard/agenda" className="sidebar-link">
            <svg viewBox="0 0 18 18" fill="none"><rect x="1" y="3" width="16" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M13 1v3M1 8h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Agenda
          </Link>
          <Link href="/dashboard/appointments" className="sidebar-link">
            <svg viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h9M2 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Turnos
          </Link>
          <Link href="#" className="sidebar-link">
            <svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 16c0-3 3.4-5.5 7.5-5.5s7.5 2.5 7.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Perfil
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="dash-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>ML</div>
          <div>
            <div className="sidebar-profile-name">{business.name}</div>
            <div className="sidebar-profile-role">{business.category || "Profesional"}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrap">
        <header className="dash-header">
          <div className="dash-logo">
            <div className="dash-logo-mark">B</div>
            <span className="dash-logo-text">Bookzi</span>
          </div>
          <div className="dash-avatar">ML</div>
        </header>

        <div className="content-area page-content-pad">

          {/* Hero */}
          <div className="hero-strip" style={{ margin: "16px 16px 0" }}>
            <div className="hero-greeting">Buenos días, {business.name.split(" ")[0]}</div>
            <div className="hero-count">Hoy tenés 6 turnos</div>
            <div className="hero-next">Próximo: Valentina Ruiz a las 09:30</div>
            <Link href="/dashboard/agenda" className="hero-cta">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="2" stroke="white" strokeWidth="1.4"/><path d="M4 1v2M10 1v2M1 6h12" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Ver todos
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-num green">6</span>
              <span className="stat-label">Hoy</span>
            </div>
            <div className="stat-card">
              <span className="stat-num yellow">3</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">28</span>
              <span className="stat-label">Esta semana</span>
            </div>
          </div>

          {/* Pendientes */}
          <div className="section">
            <div className="section-hd">
              <h2>Pendientes de confirmación</h2>
              <span>3</span>
            </div>
            <div className="cards-stack">
              {[
                { day: "10", mon: "Jun", name: "Carlos Méndez", meta: "11:00 · Consulta general · 30 min" },
                { day: "11", mon: "Jun", name: "Luciana Ferreira", meta: "14:00 · Seguimiento · 45 min" },
                { day: "13", mon: "Jun", name: "Roberto Giménez", meta: "10:30 · Consulta general · 30 min" },
              ].map((a, i) => (
                <Link key={i} href="/dashboard/appointments/1" style={{ textDecoration: "none" }}>
                  <div className="appt-card">
                    <div className="appt-date-box">
                      <span className="day">{a.day}</span>
                      <span className="mon">{a.mon}</span>
                    </div>
                    <div className="appt-info">
                      <div className="appt-name">{a.name}</div>
                      <div className="appt-meta">{a.meta}</div>
                    </div>
                    <div className="appt-status">
                      <span className="badge badge-pending">Pendiente</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Agenda de hoy / Timeline */}
          <div className="section" style={{ paddingBottom: 32 }}>
            <div className="section-hd">
              <h2>Agenda de hoy</h2>
              <Link href="/dashboard/agenda">Ver agenda</Link>
            </div>
            <div className="today-label">
              <span className="dot"></span>
              Martes 10 de junio
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>

              <div className="tl-row">
                <div className="tl-time">08:00</div>
                <div className="tl-spine"><div className="tl-dot empty"></div><div className="tl-line"></div></div>
                <div className="tl-content"><div className="tl-empty-slot">Disponible</div></div>
              </div>

              {[
                { time: "09:30", name: "Valentina Ruiz", meta: "09:30 · Consulta · 30 min", badge: "badge-confirmed", badgeText: "Confirmado" },
                { time: "10:30", name: "Diego Álvarez", meta: "10:30 · Seguimiento · 45 min", badge: "badge-confirmed", badgeText: "Confirmado" },
              ].map((a, i) => (
                <div key={i} className="tl-row">
                  <div className="tl-time">{a.time}</div>
                  <div className="tl-spine"><div className="tl-dot"></div><div className="tl-line"></div></div>
                  <div className="tl-content">
                    <Link href="/dashboard/appointments/1" style={{ textDecoration: "none" }}>
                      <div className="appt-card">
                        <div className="appt-date-box">
                          <span className="day">10</span>
                          <span className="mon">Jun</span>
                        </div>
                        <div className="appt-info">
                          <div className="appt-name">{a.name}</div>
                          <div className="appt-meta">{a.meta}</div>
                        </div>
                        <div className="appt-status">
                          <span className={`badge ${a.badge}`}>{a.badgeText}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}

              <div className="tl-row">
                <div className="tl-time">12:00</div>
                <div className="tl-spine"><div className="tl-dot empty"></div><div className="tl-line"></div></div>
                <div className="tl-content"><div className="tl-empty-slot">Disponible</div></div>
              </div>

              {[
                { time: "14:00", name: "Ana Martínez", meta: "14:00 · Control · 30 min", badge: "badge-rescheduled", badgeText: "Reprogramado" },
                { time: "15:30", name: "Javier Torres", meta: "15:30 · Consulta · 30 min", badge: "badge-confirmed", badgeText: "Confirmado" },
              ].map((a, i) => (
                <div key={i} className="tl-row">
                  <div className="tl-time">{a.time}</div>
                  <div className="tl-spine"><div className="tl-dot"></div><div className="tl-line"></div></div>
                  <div className="tl-content">
                    <Link href="/dashboard/appointments/1" style={{ textDecoration: "none" }}>
                      <div className="appt-card">
                        <div className="appt-date-box">
                          <span className="day">10</span>
                          <span className="mon">Jun</span>
                        </div>
                        <div className="appt-info">
                          <div className="appt-name">{a.name}</div>
                          <div className="appt-meta">{a.meta}</div>
                        </div>
                        <div className="appt-status">
                          <span className={`badge ${a.badge}`}>{a.badgeText}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>
      </div>

      {/* FAB */}
      <Link href="/dashboard/appointments/new">
        <button className="fab">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
        </button>
      </Link>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/dashboard" className="nav-item active">
          <svg viewBox="0 0 22 22" fill="none"><rect x="1" y="1" width="8" height="8" rx="2.5" fill="currentColor"/><rect x="13" y="1" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/><rect x="1" y="13" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/><rect x="13" y="13" width="8" height="8" rx="2.5" fill="currentColor" opacity=".45"/></svg>
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
        <Link href="#" className="nav-item">
          <svg viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M2 20c0-3.5 4-6 9-6s9 2.5 9 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Perfil
        </Link>
      </nav>

    </div>
  )
}
