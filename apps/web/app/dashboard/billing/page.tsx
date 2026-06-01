export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getMySubscription, startCheckout, cancelPlan } from "@/lib/actions/billing"
import Link from "next/link"

// ── Tipos de plan ────────────────────────────────────────────────────────────

type PlanId = "free" | "pro" | "business"

const PLANS: {
  id: PlanId
  name: string
  price: string
  priceNote: string
  color: string
  colorBg: string
  colorDark: string
  features: string[]
}[] = [
  {
    id: "free",
    name: "Free",
    price: "Gratis",
    priceNote: "para siempre",
    color: "#64748B",
    colorBg: "rgba(100,116,139,0.10)",
    colorDark: "#475569",
    features: [
      "Hasta 30 turnos por mes",
      "Hasta 3 servicios",
      "Notificaciones por email",
      "Página de reservas pública",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "ARS 12.900",
    priceNote: "/ mes",
    color: "#0284C7",
    colorBg: "rgba(2,132,199,0.10)",
    colorDark: "#0369A1",
    features: [
      "Turnos ilimitados",
      "Servicios ilimitados",
      "Notificaciones por WhatsApp",
      "Analytics e informes",
      "Recordatorios automáticos",
      "Soporte por email (48 h)",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "ARS 32.900",
    priceNote: "/ mes",
    color: "#059669",
    colorBg: "rgba(5,150,105,0.10)",
    colorDark: "#047857",
    features: [
      "Todo lo de Pro",
      "Hasta 6 miembros de staff",
      "Pagos online integrados",
      "Lista de espera automática",
      "Analytics avanzado",
      "Soporte email + WhatsApp 24 h",
    ],
  },
]

const STATUS_LABEL: Record<string, string> = {
  active:    "Activo",
  pending:   "Pendiente",
  cancelled: "Cancelado",
  trialing:  "Período de prueba",
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:    { bg: "rgba(5,150,105,0.10)",  color: "#059669" },
  pending:   { bg: "rgba(251,191,36,0.12)", color: "#B45309" },
  cancelled: { bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
  trialing:  { bg: "rgba(2,132,199,0.10)",  color: "#0284C7" },
}

function formatDate(d: Date | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
}

// ── Componente ───────────────────────────────────────────────────────────────

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const sub = await getMySubscription()

  // Si no hay suscripción en la DB, el negocio está en Free
  const planId: PlanId = (sub?.plan as PlanId | undefined) ?? "free"
  const status: string = sub?.status ?? "active"
  const currentPlan = PLANS.find(p => p.id === planId) ?? PLANS[0]!
  const statusStyle = STATUS_STYLE[status] ?? { bg: "rgba(5,150,105,0.10)", color: "#059669" }
  const isCancelled = sub?.cancelledAt != null
  const canCancel = status === "active" && planId !== "free" && !isCancelled

  const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, business: 2 }
  const currentRank = PLAN_RANK[planId]

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Mi plan</span>
        </div>
        <Link href="/dashboard" className="logo-home-btn">B</Link>
      </header>

      {/* ── Contenido ── */}
      <div style={{
        flex: 1,
        padding: "20px 16px 100px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
      }}>

        {/* ── Card: plan actual ── */}
        <div style={{
          background: "var(--bg-white)",
          borderRadius: 18,
          border: `2px solid ${currentPlan.color}`,
          overflow: "hidden",
        }}>
          {/* Encabezado */}
          <div style={{
            padding: "16px 18px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: currentPlan.colorBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="3" width="16" height="14" rx="3" stroke={currentPlan.color} strokeWidth="1.6"/>
                  <path d="M6 1v3M14 1v3M2 8h16" stroke={currentPlan.color} strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginBottom: 2 }}>
                  Plan actual
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.3px" }}>
                  {currentPlan.name}
                </div>
              </div>
            </div>

            <span style={{
              fontSize: 12, fontWeight: 700,
              padding: "4px 12px", borderRadius: 100,
              background: statusStyle.bg, color: statusStyle.color,
            }}>
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>

          {/* Info */}
          <div style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.5px", marginBottom: 4 }}>
              {currentPlan.price}
              {planId !== "free" && (
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)", marginLeft: 4 }}>
                  {currentPlan.priceNote}
                </span>
              )}
            </div>

            {sub?.currentPeriodEnd && (
              <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                {isCancelled
                  ? `Plan activo hasta el ${formatDate(sub.currentPeriodEnd)}`
                  : `Se renueva el ${formatDate(sub.currentPeriodEnd)}`
                }
              </div>
            )}

            {isCancelled && (
              <div style={{
                marginTop: 12,
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(220,38,38,0.06)",
                border: "1px solid rgba(220,38,38,0.15)",
                fontSize: 13, color: "#DC2626", fontWeight: 500, lineHeight: 1.4,
              }}>
                Tu plan fue cancelado. Podés reactivarlo en cualquier momento.
              </div>
            )}

            {canCancel && (
              <form action={cancelPlan} style={{ marginTop: 14 }}>
                <button
                  type="submit"
                  style={{
                    height: 38, padding: "0 16px", borderRadius: 10,
                    background: "transparent",
                    border: "1.5px solid rgba(220,38,38,0.30)",
                    color: "#DC2626", fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancelar plan
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Separador ── */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
          letterSpacing: "0.8px", textTransform: "uppercase", paddingLeft: 2,
        }}>
          Cambiar de plan
        </div>

        {/* ── Cards de planes ── */}
        {PLANS.map(plan => {
          const isCurrent = plan.id === planId
          const isUpgrade = PLAN_RANK[plan.id] > currentRank
          const isDowngrade = PLAN_RANK[plan.id] < currentRank

          return (
            <div
              key={plan.id}
              style={{
                background: "var(--bg-white)",
                borderRadius: 18,
                border: isCurrent
                  ? `2px solid ${plan.color}`
                  : "1px solid var(--border)",
                overflow: "hidden",
                opacity: isDowngrade ? 0.55 : 1,
              }}
            >
              {/* Encabezado del plan */}
              <div style={{
                padding: "16px 18px 12px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    padding: "4px 14px", borderRadius: 100,
                    background: plan.colorBg, color: plan.color,
                  }}>
                    {plan.name}
                  </span>
                  {isCurrent && (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 100,
                      background: plan.colorBg, color: plan.color,
                    }}>
                      Activo
                    </span>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.4px" }}>
                    {plan.price}
                  </span>
                  {plan.id !== "free" && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginLeft: 3 }}>
                      {plan.priceNote}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div style={{ padding: "14px 18px" }}>
                <ul style={{
                  listStyle: "none", margin: 0, padding: 0,
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  {plan.features.map((feat, i) => (
                    <li key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: 13, color: "var(--text-dark)", fontWeight: 500,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="7" cy="7" r="6.5" fill={plan.colorBg} stroke={plan.color} strokeWidth="0.8"/>
                        <path d="M4.5 7l2 2 3-3.5" stroke={plan.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* Botón de acción */}
                <div style={{ marginTop: 16 }}>
                  {isCurrent ? (
                    <div style={{
                      height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 11, border: `1.5px solid ${plan.color}`,
                      fontSize: 13, fontWeight: 700, color: plan.color,
                    }}>
                      Plan activo
                    </div>
                  ) : isUpgrade ? (
                    <form action={startCheckout.bind(null, `${plan.id}_monthly` as "pro_monthly" | "business_monthly")}>
                      <button
                        type="submit"
                        style={{
                          width: "100%", height: 40, borderRadius: 11,
                          background: `linear-gradient(135deg, ${plan.color}, ${plan.colorDark})`,
                          border: "none",
                          color: "white", fontSize: 13, fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: `0 4px 12px ${plan.colorBg}`,
                        }}
                      >
                        Activar {plan.name}
                      </button>
                    </form>
                  ) : (
                    <div style={{
                      height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 11, background: "var(--bg)",
                      fontSize: 13, fontWeight: 600, color: "var(--text-muted)",
                    }}>
                      Plan inferior al actual
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* ── Link a pricing público ── */}
        <div style={{ textAlign: "center", paddingTop: 4 }}>
          <Link
            href="/pricing"
            style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
            target="_blank"
          >
            Ver comparativa completa de planes →
          </Link>
        </div>

      </div>
    </div>
  )
}
