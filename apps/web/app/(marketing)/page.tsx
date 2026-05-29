import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const C = {
  primary:     "#0284C7",
  primaryDark: "#0369A1",
  accent:      "#059669",
  bg:          "#F0F9FF",
  textDark:    "#0F172A",
  textMid:     "#334155",
  textMuted:   "#64748B",
  border:      "#E0F0F8",
  white:       "#FFFFFF",
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <div style={{ background: C.bg, color: C.textDark, minHeight: "100dvh", fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}>

      {/* ── Navbar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(240,249,255,0.90)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth: 1120, margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="14" rx="3" stroke="white" strokeWidth="1.6"/>
                <path d="M6 2v3M14 2v3M2 9h16" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M6 13l2.5 2.5L14 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.textDark, letterSpacing: "-0.4px" }}>Bookzi</span>
          </a>

          <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href="/login"
              style={{
                fontSize: 14, fontWeight: 600, color: C.textMid,
                textDecoration: "none", padding: "8px 16px", borderRadius: 8,
              }}
            >
              Iniciar sesión
            </a>
            <a
              href="/register"
              style={{
                fontSize: 14, fontWeight: 700, color: C.white,
                textDecoration: "none", padding: "9px 20px", borderRadius: 10,
                background: C.primary,
                boxShadow: "0 2px 8px rgba(2,132,199,0.30)",
              }}
            >
              Registrarse
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: 1120, margin: "0 auto",
        padding: "80px 24px 96px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(5,150,105,0.08)",
          border: "1px solid rgba(5,150,105,0.20)",
          borderRadius: 100, padding: "6px 14px",
          marginBottom: 32,
        }}>
          <span style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>
            ✓ Sin tarjeta de crédito
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 56px)",
          fontWeight: 800,
          letterSpacing: "-1.5px",
          lineHeight: 1.1,
          color: C.textDark,
          maxWidth: 760,
          margin: "0 auto 24px",
        }}>
          Tu agenda inteligente para{" "}
          <span style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            profesionales y negocios
          </span>
        </h1>

        <p style={{
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.6,
          color: C.textMuted,
          maxWidth: 540,
          margin: "0 auto 40px",
        }}>
          Reservas online, confirmaciones automáticas y recordatorios por WhatsApp. Todo desde un solo lugar.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <a
            href="/register"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 54, padding: "0 32px", borderRadius: 14,
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
              color: C.white, fontWeight: 800, fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(2,132,199,0.35)",
            }}
          >
            Empezá gratis →
          </a>
          <a
            href="#features"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 54, padding: "0 28px", borderRadius: 14,
              background: C.white,
              border: `1.5px solid ${C.border}`,
              color: C.textMid, fontWeight: 700, fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(2,132,199,0.08)",
            }}
          >
            Ver demo
          </a>
        </div>

        {/* Hero illustration card */}
        <div style={{
          marginTop: 64,
          background: C.white,
          border: `1.5px solid ${C.border}`,
          borderRadius: 20,
          padding: "32px 28px",
          maxWidth: 640,
          marginLeft: "auto",
          marginRight: "auto",
          boxShadow: "0 8px 40px rgba(2,132,199,0.10)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FC685F" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FDBC40" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#35C749" }} />
            <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500, marginLeft: 4 }}>Panel de turnos — Hoy</span>
          </div>

          {[
            { time: "09:00", name: "Martina López", service: "Corte + color", status: "confirmed" },
            { time: "10:30", name: "Carlos Ruiz", service: "Consulta inicial", status: "pending" },
            { time: "12:00", name: "Sofía Gómez", service: "Peluquería", status: "confirmed" },
          ].map((apt, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 0",
              borderBottom: i < 2 ? `1px solid ${C.border}` : "none",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, minWidth: 36 }}>{apt.time}</span>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.white }}>
                  {apt.name.split(" ").map(w => w[0]).join("")}
                </span>
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textDark }}>{apt.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{apt.service}</div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700,
                padding: "4px 10px", borderRadius: 100,
                background: apt.status === "confirmed" ? "rgba(5,150,105,0.10)" : "rgba(251,191,36,0.12)",
                color: apt.status === "confirmed" ? C.accent : "#B45309",
              }}>
                {apt.status === "confirmed" ? "Confirmado" : "Pendiente"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{
        background: C.white,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: "80px 24px",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px", color: C.textDark, marginBottom: 12 }}>
              Todo lo que necesitás en un lugar
            </h2>
            <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
              Diseñado para profesionales que quieren crecer sin complicarse.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}>
            {[
              {
                icon: "📅",
                title: "Agenda inteligente",
                desc: "Visualizá todos tus turnos del día en un timeline claro. Drag & drop, colores por servicio y vista semanal.",
              },
              {
                icon: "💬",
                title: "WhatsApp automático",
                desc: "Recordatorios y confirmaciones automáticas por WhatsApp. Reducí ausencias hasta un 40%.",
              },
              {
                icon: "✅",
                title: "Confirmación de turnos",
                desc: "Tus clientes confirman o cancelan con un toque. Vos sabés en tiempo real qué pasa con tu agenda.",
              },
              {
                icon: "📊",
                title: "Panel profesional",
                desc: "Estadísticas de ingresos, clientes frecuentes y servicios más populares. Todo desde tu celular.",
              },
            ].map((feature, i) => (
              <div key={i} style={{
                background: C.bg,
                border: `1.5px solid ${C.border}`,
                borderRadius: 20,
                padding: "28px 24px",
                transition: "box-shadow 200ms",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: C.white,
                  border: `1.5px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, marginBottom: 18,
                  boxShadow: "0 2px 8px rgba(2,132,199,0.08)",
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: C.textDark, marginBottom: 8, letterSpacing: "-0.3px" }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px", color: C.textDark, marginBottom: 12 }}>
              Empezá en 3 pasos
            </h2>
            <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6 }}>
              Sin configuraciones complicadas. En menos de 5 minutos ya estás recibiendo turnos.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}>
            {[
              {
                step: "01",
                title: "Creá tu cuenta gratis",
                desc: "Registrate con tu email o Google. Sin tarjeta de crédito, sin compromisos.",
              },
              {
                step: "02",
                title: "Configurá tu agenda",
                desc: "Agregá tus servicios, horarios y días disponibles. Lleva menos de 5 minutos.",
              },
              {
                step: "03",
                title: "Compartí tu enlace y listo",
                desc: "Tus clientes reservan solos. Vos recibís confirmaciones y recordatorios automáticos.",
              },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                background: C.white,
                border: `1.5px solid ${C.border}`,
                borderRadius: 20,
                padding: "28px 24px",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 20, right: 20,
                  fontSize: 48, fontWeight: 900,
                  color: "rgba(2,132,199,0.06)",
                  lineHeight: 1, letterSpacing: "-2px",
                  fontFamily: "inherit",
                }}>
                  {s.step}
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 18, flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(2,132,199,0.30)",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: C.white }}>{parseInt(s.step)}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: C.textDark, marginBottom: 10, letterSpacing: "-0.4px", lineHeight: 1.2 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{
        padding: "80px 24px 96px",
        background: `linear-gradient(160deg, ${C.primaryDark} 0%, ${C.primary} 60%, #38BDF8 100%)`,
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 800,
            letterSpacing: "-1.2px",
            lineHeight: 1.15,
            color: C.white,
            marginBottom: 16,
          }}>
            Empezá a llenar tu agenda hoy mismo
          </h2>
          <p style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.6,
            marginBottom: 36,
          }}>
            Más de 12.000 profesionales en Argentina y Uruguay ya usan Bookzi para gestionar sus turnos.
          </p>

          <a
            href="/register"
            style={{
              display: "inline-flex", alignItems: "center",
              height: 56, padding: "0 36px", borderRadius: 14,
              background: C.white,
              color: C.primary, fontWeight: 800, fontSize: 17,
              textDecoration: "none",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            Crear mi cuenta gratis →
          </a>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 16, fontWeight: 500 }}>
            ✓ Sin tarjeta de crédito · ✓ Gratis para siempre en el plan básico
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: C.textDark,
        padding: "28px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: C.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: C.white }}>B</span>
          </div>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", fontWeight: 500 }}>
            © 2026 Bookzi. Todos los derechos reservados.
          </span>
        </div>
      </footer>

    </div>
  )
}
