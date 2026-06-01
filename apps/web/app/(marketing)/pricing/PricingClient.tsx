"use client"

import { useState } from "react"

const C = {
  primary:     "#0284C7",
  primaryDark: "#0369A1",
  accent:      "#059669",
  accentDark:  "#047857",
  bg:          "#F0F9FF",
  textDark:    "#0F172A",
  textMid:     "#334155",
  textMuted:   "#64748B",
  border:      "#E0F0F8",
  white:       "#FFFFFF",
  error:       "#DC2626",
}

// ── Datos de planes ─────────────────────────────────────────────────────────

type BillingCycle = "monthly" | "annual"

interface Plan {
  id: string
  name: string
  monthlyPrice: number | null
  annualPrice: number | null
  badge?: string
  badgeColor?: string
  badgeBg?: string
  color: string
  colorBg: string
  ctaLabel: string
  ctaHref: string
  ctaSecondary?: boolean
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: null,
    annualPrice: null,
    color: C.textMid,
    colorBg: "rgba(100,116,139,0.10)",
    ctaLabel: "Empezar gratis",
    ctaHref: "/register",
    ctaSecondary: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 12900,
    annualPrice: 10320,
    badge: "Más popular",
    badgeColor: C.white,
    badgeBg: C.primary,
    color: C.primary,
    colorBg: "rgba(2,132,199,0.10)",
    ctaLabel: "Activar Pro",
    ctaHref: "/register",
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 32900,
    annualPrice: 26320,
    color: C.accent,
    colorBg: "rgba(5,150,105,0.10)",
    ctaLabel: "Activar Business",
    ctaHref: "/register",
  },
]

// ── Tabla de features ────────────────────────────────────────────────────────

const FEATURES: { label: string; free: string | boolean; pro: string | boolean; business: string | boolean }[] = [
  { label: "Turnos por mes",      free: "30",          pro: "Ilimitados",    business: "Ilimitados" },
  { label: "Servicios",           free: "3",           pro: "Ilimitados",    business: "Ilimitados" },
  { label: "Staff adicional",     free: false,         pro: false,           business: "Hasta 6" },
  { label: "Notif. WhatsApp",     free: false,         pro: true,            business: true },
  { label: "Analytics",           free: false,         pro: true,            business: "Avanzado" },
  { label: "Pagos online",        free: false,         pro: false,           business: true },
  { label: "Lista de espera",     free: false,         pro: false,           business: true },
  { label: "Recordatorios auto",  free: false,         pro: true,            business: true },
  { label: "Soporte",             free: "Docs",        pro: "Email 48 h",    business: "Email + WhatsApp 24 h" },
]

// ── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "¿Necesito tarjeta de crédito para empezar?",
    a: "No. El plan Free es gratuito para siempre y no requiere datos de pago. Solo pedimos tu email.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí, podés cancelar cuando quieras desde el dashboard. Tu plan se mantiene activo hasta el final del período ya abonado.",
  },
  {
    q: "¿Cómo funciona la facturación?",
    a: "Facturamos en ARS de forma mensual o anual según el plan que elijas. Usamos Mercado Pago para procesar los pagos de forma segura.",
  },
  {
    q: "¿Qué pasa si supero el límite del plan Free?",
    a: "Cuando alcancés los 30 turnos del mes, te avisamos para que puedas hacer el upgrade. No bloqueamos tu cuenta sin previo aviso.",
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatARS(n: number) {
  return `ARS ${n.toLocaleString("es-AR")}`
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7.5" fill={color} fillOpacity="0.12"/>
      <path d="M5 8l2.2 2.2 4-4.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
      <circle cx="8" cy="8" r="7.5" fill={C.textMuted} fillOpacity="0.08"/>
      <path d="M10 6L6 10M6 6l4 4" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function PricingClient() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* ── Toggle mensual / anual ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        marginBottom: 52,
      }}>
        <button
          onClick={() => setCycle("monthly")}
          style={{
            height: 36, padding: "0 18px", borderRadius: 10, border: "none",
            background: cycle === "monthly" ? C.primary : "transparent",
            color: cycle === "monthly" ? C.white : C.textMuted,
            fontWeight: 700, fontSize: 14, cursor: "pointer",
            transition: "all 150ms",
          }}
        >
          Mensual
        </button>

        <div style={{
          height: 34, borderRadius: 100, padding: "0 2px",
          background: "rgba(2,132,199,0.08)",
          border: `1.5px solid ${C.border}`,
          display: "flex", alignItems: "center",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            padding: "0 4px",
          }}>
            {/* mini dot indicador */}
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: cycle === "annual" ? C.accent : C.border,
              transition: "background 200ms",
            }} />
          </div>
        </div>

        <button
          onClick={() => setCycle("annual")}
          style={{
            height: 36, padding: "0 18px", borderRadius: 10, border: "none",
            background: cycle === "annual" ? C.accent : "transparent",
            color: cycle === "annual" ? C.white : C.textMuted,
            fontWeight: 700, fontSize: 14, cursor: "pointer",
            transition: "all 150ms",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          Anual
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
            background: cycle === "annual" ? "rgba(255,255,255,0.20)" : "rgba(5,150,105,0.12)",
            color: cycle === "annual" ? C.white : C.accent,
          }}>
            20% off
          </span>
        </button>
      </div>

      {/* ── Grid de planes ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
        marginBottom: 72,
      }}>
        {PLANS.map(plan => {
          const price = cycle === "monthly" ? plan.monthlyPrice : plan.annualPrice

          return (
            <div
              key={plan.id}
              style={{
                background: C.white,
                border: plan.badge
                  ? `2px solid ${plan.color}`
                  : `1.5px solid ${C.border}`,
                borderRadius: 20,
                overflow: "hidden",
                position: "relative",
                boxShadow: plan.badge ? `0 8px 32px ${plan.colorBg}` : "0 2px 8px rgba(2,132,199,0.06)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Badge "Más popular" */}
              {plan.badge && (
                <div style={{
                  position: "absolute", top: 0, right: 20,
                  background: plan.color,
                  color: C.white,
                  fontSize: 11, fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: "0 0 10px 10px",
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Encabezado */}
              <div style={{ padding: "28px 24px 20px" }}>
                <span style={{
                  display: "inline-block",
                  fontSize: 13, fontWeight: 700,
                  padding: "4px 14px", borderRadius: 100,
                  background: plan.colorBg, color: plan.color,
                  marginBottom: 16,
                }}>
                  {plan.name}
                </span>

                <div>
                  {price === null ? (
                    <div>
                      <span style={{ fontSize: 36, fontWeight: 800, color: C.textDark, letterSpacing: "-1px" }}>
                        Gratis
                      </span>
                      <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 500, marginTop: 2 }}>
                        para siempre
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 36, fontWeight: 800, color: C.textDark, letterSpacing: "-1px", lineHeight: 1 }}>
                        {formatARS(price)}
                      </div>
                      <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 500, marginTop: 4 }}>
                        / mes
                        {cycle === "annual" && (
                          <span style={{ marginLeft: 6, color: C.accent, fontWeight: 700 }}>
                            · facturado anual
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div style={{ padding: "0 24px 24px", flex: 1 }}>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {FEATURES.map((feat, i) => {
                    const value = plan.id === "free" ? feat.free : plan.id === "pro" ? feat.pro : feat.business

                    if (value === false) {
                      return (
                        <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textMuted }}>
                          <XIcon />
                          <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{feat.label}</span>
                        </li>
                      )
                    }

                    return (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textDark, fontWeight: 500 }}>
                        <CheckIcon color={plan.color} />
                        <span>
                          {feat.label}
                          {typeof value === "string" && value !== "true" && (
                            <span style={{ color: plan.color, fontWeight: 700, marginLeft: 4 }}>
                              — {value}
                            </span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                {/* CTA */}
                <a
                  href={plan.ctaHref}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: 46, borderRadius: 13, marginTop: 24,
                    background: plan.ctaSecondary
                      ? C.white
                      : `linear-gradient(135deg, ${plan.color}, ${plan.id === "pro" ? C.primaryDark : C.accentDark})`,
                    border: plan.ctaSecondary ? `1.5px solid ${C.border}` : "none",
                    color: plan.ctaSecondary ? C.textMid : C.white,
                    fontWeight: 700, fontSize: 14,
                    textDecoration: "none",
                    boxShadow: plan.ctaSecondary
                      ? "0 2px 6px rgba(2,132,199,0.06)"
                      : `0 4px 14px ${plan.colorBg}`,
                  }}
                >
                  {plan.ctaLabel}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 640, margin: "0 auto", marginBottom: 80 }}>
        <h2 style={{
          fontSize: 26, fontWeight: 800, color: C.textDark,
          letterSpacing: "-0.6px", marginBottom: 28, textAlign: "center",
        }}>
          Preguntas frecuentes
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQ.map((item, i) => (
            <div
              key={i}
              style={{
                background: C.white,
                border: `1.5px solid ${openFaq === i ? C.primary : C.border}`,
                borderRadius: 14,
                overflow: "hidden",
                transition: "border-color 150ms",
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "16px 18px",
                  background: "transparent", border: "none",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: C.textDark, lineHeight: 1.4 }}>
                  {item.q}
                </span>
                <svg
                  width="18" height="18" viewBox="0 0 18 18" fill="none"
                  style={{
                    flexShrink: 0, color: C.primary,
                    transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms",
                  }}
                >
                  <path d="M4.5 6.75L9 11.25l4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {openFaq === i && (
                <div style={{
                  padding: "0 18px 16px",
                  fontSize: 14, color: C.textMuted, lineHeight: 1.65, fontWeight: 400,
                }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer contacto ── */}
      <div style={{
        textAlign: "center",
        padding: "24px 24px 16px",
        borderTop: `1px solid ${C.border}`,
      }}>
        <p style={{ fontSize: 14, color: C.textMuted, fontWeight: 500 }}>
          ¿Tenés dudas?{" "}
          <a
            href="mailto:hola@bookzi.app"
            style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}
          >
            Escribinos a hola@bookzi.app
          </a>
        </p>
      </div>
    </>
  )
}
