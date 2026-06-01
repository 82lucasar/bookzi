export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAppointments } from "@/lib/actions/appointments"
import Link from "next/link"

const TZ = "America/Argentina/Buenos_Aires"

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ })
}

function formatDay(date: Date) {
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: TZ }).replace(".", "")
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/onboarding/welcome")

  const initials = business.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("")

  const [todayAppts, upcomingAppts] = await Promise.all([
    getAppointments("today"),
    getAppointments("upcoming"),
  ])

  const todayCount = todayAppts.length
  const pendingCount = upcomingAppts.filter(a => a.status === "pending").length
  const pendingAppts = upcomingAppts.filter(a => a.status === "pending").slice(0, 3)
  const nextAppt = todayAppts.find(a => a.status === "confirmed")

  return (
    <>
      <header className="dash-header">
        <div className="dash-logo">
          <div className="dash-logo-mark">B</div>
          <span className="dash-logo-text">Bookzi</span>
        </div>
        <div className="dash-avatar">{initials}</div>
      </header>

      <div className="content-area page-content-pad">

          {/* Hero */}
          <div className="hero-strip" style={{ margin: "16px 16px 0" }}>
            <div className="hero-greeting">Buenos días, {business.name.split(" ")[0]}</div>
            <div className="hero-count">
              {todayCount === 0 ? "Sin turnos hoy" : `Hoy tenés ${todayCount} turno${todayCount !== 1 ? "s" : ""}`}
            </div>
            {nextAppt && (
              <div className="hero-next">
                Próximo: {nextAppt.clientName} a las {formatTime(new Date(nextAppt.startAt))}
              </div>
            )}
            <Link href="/dashboard/agenda" className="hero-cta">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="2" stroke="white" strokeWidth="1.4"/><path d="M4 1v2M10 1v2M1 6h12" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Ver todos
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <span className={`stat-num${todayCount > 0 ? " green" : ""}`}>{todayCount}</span>
              <span className="stat-label">Hoy</span>
            </div>
            <div className="stat-card">
              <span className={`stat-num${pendingCount > 0 ? " yellow" : ""}`}>{pendingCount}</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{upcomingAppts.length}</span>
              <span className="stat-label">Próximos</span>
            </div>
          </div>

          {/* Pendientes */}
          <div className="section">
            <div className="section-hd">
              <h2>Pendientes de confirmación</h2>
              {pendingCount > 0 && <span>{pendingCount}</span>}
            </div>
            {pendingAppts.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                No hay turnos pendientes de confirmación
              </div>
            ) : (
              <div className="cards-stack">
                {pendingAppts.map((a) => {
                  const d = new Date(a.startAt)
                  const parts = formatDay(d).split(" ")
                  return (
                    <Link key={a.id} href={`/dashboard/appointments/${a.id}`} style={{ textDecoration: "none" }}>
                      <div className="appt-card">
                        <div className="appt-date-box">
                          <span className="day">{parts[0]}</span>
                          <span className="mon">{parts[1]}</span>
                        </div>
                        <div className="appt-info">
                          <div className="appt-name">{a.clientName}</div>
                          <div className="appt-meta">{formatTime(d)} · {a.serviceName}</div>
                        </div>
                        <div className="appt-status">
                          <span className="badge badge-pending">Pendiente</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Agenda de hoy */}
          <div className="section" style={{ paddingBottom: 32 }}>
            <div className="section-hd">
              <h2>Agenda de hoy</h2>
              <Link href="/dashboard/agenda">Ver agenda</Link>
            </div>

            {todayAppts.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
                  No tenés turnos para hoy
                </div>
                <Link href="/dashboard/appointments/new">
                  <button className="btn btn-primary btn-sm">+ Agregar turno</button>
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {todayAppts.map((a) => {
                  const d = new Date(a.startAt)
                  const parts = formatDay(d).split(" ")
                  const badgeClass = a.status === "confirmed" ? "badge-confirmed"
                    : a.status === "rescheduled" ? "badge-rescheduled"
                    : "badge-pending"
                  const badgeText = a.status === "confirmed" ? "Confirmado"
                    : a.status === "rescheduled" ? "Reprogramado"
                    : "Pendiente"
                  return (
                    <div key={a.id} className="tl-row">
                      <div className="tl-time">{formatTime(d)}</div>
                      <div className="tl-spine"><div className="tl-dot"></div><div className="tl-line"></div></div>
                      <div className="tl-content">
                        <Link href={`/dashboard/appointments/${a.id}`} style={{ textDecoration: "none" }}>
                          <div className="appt-card">
                            <div className="appt-date-box">
                              <span className="day">{parts[0]}</span>
                              <span className="mon">{parts[1]}</span>
                            </div>
                            <div className="appt-info">
                              <div className="appt-name">{a.clientName}</div>
                              <div className="appt-meta">{formatTime(d)} · {a.serviceName}</div>
                            </div>
                            <div className="appt-status">
                              <span className={`badge ${badgeClass}`}>{badgeText}</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      {/* FAB */}
      <Link href="/dashboard/appointments/new">
        <button className="fab">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
        </button>
      </Link>
    </>
  )
}
