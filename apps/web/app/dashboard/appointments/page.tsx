export const dynamic = "force-dynamic"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAppointments, confirmAppointment, cancelAppointment } from "@/lib/actions/appointments"

const TZ = "America/Argentina/Buenos_Aires"

const STATUS_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  pending:   { label: "Pendiente",  icon: "⏳", bg: "rgba(245,158,11,0.08)",  text: "#B45309", border: "rgba(245,158,11,0.2)"  },
  confirmed: { label: "Confirmado", icon: "✓",  bg: "rgba(5,150,105,0.08)",   text: "#047857", border: "rgba(5,150,105,0.2)"   },
  completed: { label: "Completado", icon: "—",  bg: "rgba(100,116,139,0.08)", text: "#64748B", border: "rgba(100,116,139,0.15)" },
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
}

type Filter = "upcoming" | "today" | "past"

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const { filter: rawFilter } = await searchParams
  const filter: Filter = rawFilter === "today" ? "today" : rawFilter === "past" ? "past" : "upcoming"

  const apptList = await getAppointments(filter)

  const tabs: { label: string; value: Filter }[] = [
    { label: "Próximos",    value: "upcoming" },
    { label: "Hoy",         value: "today"    },
    { label: "Anteriores",  value: "past"     },
  ]

  const emptyMessages: Record<Filter, { icon: string; title: string; subtitle: string }> = {
    upcoming: { icon: "📭", title: "No hay turnos próximos",  subtitle: "Cuando lleguen nuevas reservas, aparecerán acá." },
    today:    { icon: "☀️",  title: "No hay turnos para hoy", subtitle: "Disfrutá el tiempo libre."                       },
    past:     { icon: "🗂️",  title: "Sin historial de turnos", subtitle: "Los turnos completados aparecerán acá."         },
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", paddingBottom: "calc(var(--nav-h) + 16px)" }}>

      {/* Header */}
      <div style={{
        background: "white", borderBottom: "1.5px solid var(--border)",
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Turnos</span>
        <Link href="/dashboard/appointments/new" style={{ textDecoration: "none" }}>
          <button style={{
            height: 34, padding: "0 14px", borderRadius: 10,
            background: "var(--primary)", color: "white",
            fontWeight: 700, fontSize: 13, border: "none",
            cursor: "pointer", fontFamily: "var(--font)",
          }}>
            + Nuevo
          </button>
        </Link>
      </div>

      <div style={{ padding: "16px 16px 0", maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, background: "white",
          borderRadius: 16, padding: 5,
          border: "1.5px solid var(--border)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {tabs.map((tab) => (
            <a
              key={tab.value}
              href={`/dashboard/appointments?filter=${tab.value}`}
              style={{
                flex: 1, textAlign: "center", padding: "9px 0",
                borderRadius: 12, fontSize: 13, fontWeight: 700,
                textDecoration: "none",
                background: filter === tab.value ? "linear-gradient(135deg, #0284C7, #0369A1)" : "transparent",
                color: filter === tab.value ? "white" : "var(--text-muted)",
                boxShadow: filter === tab.value ? "0 2px 8px rgba(2,132,199,0.3)" : "none",
              }}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {/* Contenido */}
        {apptList.length === 0 ? (
          <div style={{
            background: "white", borderRadius: 24, padding: "56px 24px",
            textAlign: "center", border: "1.5px solid var(--border)",
            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>{emptyMessages[filter].icon}</p>
            <p style={{ fontWeight: 800, color: "var(--text-dark)", fontSize: 18, letterSpacing: "-0.4px", marginBottom: 8 }}>
              {emptyMessages[filter].title}
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 240, margin: "0 auto", lineHeight: 1.6 }}>
              {emptyMessages[filter].subtitle}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {apptList.map((appt) => {
              const sc = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending!
              const d  = new Date(appt.startAt)
              const day   = Number(d.toLocaleDateString("en-CA", { day: "numeric", timeZone: TZ }))
              const month = d.toLocaleDateString("es-AR", { month: "short", timeZone: TZ }).replace(".", "").toUpperCase()

              return (
                <div
                  key={appt.id}
                  style={{
                    background: "white", borderRadius: 20,
                    overflow: "hidden", border: "1.5px solid var(--border)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Card principal — clickeable */}
                  <Link href={`/dashboard/appointments/${appt.id}`} style={{ display: "block", textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "stretch" }}>

                      {/* Columna fecha */}
                      <div style={{
                        background: "linear-gradient(180deg, #0284C7, #0369A1)",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        padding: "20px 14px", minWidth: 66, flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 26, fontWeight: 900, color: "white", lineHeight: 1 }}>{day}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", marginTop: 4, letterSpacing: "0.05em" }}>{month}</span>
                      </div>

                      {/* Contenido */}
                      <div style={{ flex: 1, padding: "14px 14px", minWidth: 0 }}>

                        {/* Nombre + badge */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontWeight: 800, color: "var(--text-dark)", fontSize: 15, lineHeight: 1.25, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                              {appt.clientName}
                            </p>
                            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontWeight: 500 }}>
                              {appt.serviceName}
                            </p>
                          </div>
                          <span style={{
                            flexShrink: 0, fontSize: 11, fontWeight: 700,
                            padding: "4px 9px", borderRadius: 20,
                            background: sc.bg, color: sc.text, border: `1.5px solid ${sc.border}`,
                            display: "flex", alignItems: "center", gap: 4,
                            whiteSpace: "nowrap",
                          }}>
                            <span>{sc.icon}</span>
                            {sc.label}
                          </span>
                        </div>

                        {/* Meta */}
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#0284C7" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
                              {formatTime(appt.startAt)}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
                              {formatTime(appt.endAt)}
                            </span>
                          </div>
                          {appt.priceSnapshot && (
                            <>
                              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border)", flexShrink: 0 }} />
                              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>
                                ${Number(appt.priceSnapshot).toLocaleString("es-AR")}
                              </span>
                            </>
                          )}
                        </div>

                      </div>
                    </div>
                  </Link>

                  {/* Acciones rápidas */}
                  {(appt.status === "pending" || appt.status === "confirmed") && (
                    <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderTop: "1.5px solid var(--border)", background: "var(--bg)" }}>
                      {appt.status === "pending" && (
                        <form action={confirmAppointment.bind(null, appt.id)} style={{ flex: 1 }}>
                          <button
                            type="submit"
                            style={{
                              width: "100%", height: 38, borderRadius: 10, border: "none",
                              background: "linear-gradient(135deg, #059669, #047857)",
                              color: "white", fontWeight: 700, fontSize: 13,
                              fontFamily: "var(--font)", cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(5,150,105,0.25)",
                            }}
                          >
                            ✓ Confirmar
                          </button>
                        </form>
                      )}
                      <form action={cancelAppointment.bind(null, appt.id)} style={{ flex: 1 }}>
                        <button
                          type="submit"
                          style={{
                            width: "100%", height: 38, borderRadius: 10,
                            border: "1.5px solid var(--border)", background: "white",
                            color: "var(--text-muted)", fontWeight: 700, fontSize: 13,
                            fontFamily: "var(--font)", cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
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
        <Link href="/dashboard/appointments" className="nav-item active">
          <svg viewBox="0 0 22 22" fill="none"><path d="M2 5h18M2 11h12M2 17h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          Turnos
        </Link>
        <Link href="/dashboard/profile" className="nav-item">
          <svg viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M2 20c0-3.5 4-6 9-6s9 2.5 9 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Perfil
        </Link>
      </nav>

    </div>
  )
}
