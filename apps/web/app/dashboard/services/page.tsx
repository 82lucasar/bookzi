export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getServices, deleteService } from "@/lib/actions/services"
import Link from "next/link"

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

const PALETTE = [
  { bg: "rgba(2,132,199,0.10)",   color: "#0284C7" },
  { bg: "rgba(124,58,237,0.10)",  color: "#7C3AED" },
  { bg: "rgba(5,150,105,0.10)",   color: "#059669" },
  { bg: "rgba(234,88,12,0.10)",   color: "#EA580C" },
  { bg: "rgba(219,39,119,0.10)",  color: "#DB2777" },
]

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const serviceList = await getServices()

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard/profile" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Servicios</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/dashboard" className="logo-home-btn">
            <div className="logo-mark">B</div>
            <span className="logo-text">Bookzi</span>
          </Link>
          <Link
            href="/dashboard/services/new"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 36, padding: "0 14px", borderRadius: 10,
              background: "linear-gradient(135deg, var(--primary), #0369A1)",
              color: "white", fontSize: 13, fontWeight: 700,
              textDecoration: "none", boxShadow: "0 2px 8px rgba(2,132,199,0.30)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Nuevo
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, padding: "20px 16px 100px", display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {/* Strip de stats */}
        {serviceList.length > 0 && (
          <div style={{
            background: "var(--bg-white)", borderRadius: 14, border: "1px solid var(--border)",
            padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(2,132,199,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4h14M2 9h9M2 14h6" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.3px" }}>
                  {serviceList.length} servicio{serviceList.length !== 1 ? "s" : ""} activo{serviceList.length !== 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                  Todos aparecen en tu página de reservas
                </div>
              </div>
            </div>
          </div>
        )}

        {serviceList.length === 0 ? (
          /* ── Empty state ── */
          <div style={{
            background: "var(--bg-white)", borderRadius: 20, border: "1px solid var(--border)",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            padding: "52px 24px",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, marginBottom: 20,
              background: "rgba(2,132,199,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 8h20M6 14h13M6 20h9" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.4px", marginBottom: 8 }}>
              Todavía no tenés servicios
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 260, marginBottom: 28 }}>
              Agregá tus servicios para que los clientes puedan hacer reservas online.
            </p>
            <Link
              href="/dashboard/services/new"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                height: 46, padding: "0 24px", borderRadius: 13,
                background: "linear-gradient(135deg, var(--primary), #0369A1)",
                color: "white", fontSize: 14, fontWeight: 700,
                textDecoration: "none", boxShadow: "0 4px 14px rgba(2,132,199,0.35)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Agregar mi primer servicio
            </Link>
          </div>
        ) : (
          /* ── Lista de servicios ── */
          serviceList.map((service, i) => {
            const palette = PALETTE[i % PALETTE.length]!
            return (
              <div
                key={service.id}
                style={{
                  background: "var(--bg-white)", borderRadius: 16,
                  border: "1px solid var(--border)", overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px" }}>
                  {/* Ícono */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: palette.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M3 5h16M3 10h10M3 15h7" stroke={palette.color} strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.3px", marginBottom: 4 }}>
                      {service.name}
                    </div>
                    {service.description && (
                      <div style={{
                        fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4,
                        marginBottom: 8, overflow: "hidden",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      }}>
                        {service.description}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        background: palette.bg, color: palette.color,
                      }}>
                        ⏱ {formatDuration(service.durationMinutes)}
                      </span>
                      {service.bufferMinutes > 0 && (
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          background: "rgba(100,116,139,0.08)", color: "var(--text-muted)",
                        }}>
                          +{service.bufferMinutes} min pausa
                        </span>
                      )}
                      {service.price && Number(service.price) > 0 && (
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)" }}>
                          ${Number(service.price).toLocaleString("es-AR")}
                        </span>
                      )}
                      {service.maxPerDay && (
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          background: "rgba(5,150,105,0.08)", color: "var(--accent)",
                        }}>
                          👥 Máx. {service.maxPerDay}/día
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer de acciones */}
                <div style={{
                  borderTop: "1px solid var(--border)",
                  background: "var(--bg)",
                  padding: "10px 16px",
                  display: "flex", justifyContent: "flex-end",
                }}>
                  <form action={deleteService.bind(null, service.id)}>
                    <button type="submit" className="service-delete-btn">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            )
          })
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
