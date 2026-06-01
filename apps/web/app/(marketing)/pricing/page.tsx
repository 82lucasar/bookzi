import type { Metadata } from "next"
import Link from "next/link"
import PricingClient from "./PricingClient"

export const metadata: Metadata = {
  title: "Precios — Bookzi",
  description: "Planes para profesionales y negocios de todos los tamaños. Empezá gratis y crecé cuando lo necesites.",
}

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

export default function PricingPage() {
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
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
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
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/login"
              style={{
                fontSize: 14, fontWeight: 600, color: C.textMid,
                textDecoration: "none", padding: "8px 16px", borderRadius: 8,
              }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              style={{
                fontSize: 14, fontWeight: 700, color: C.white,
                textDecoration: "none", padding: "9px 20px", borderRadius: 10,
                background: C.primary,
                boxShadow: "0 2px 8px rgba(2,132,199,0.30)",
              }}
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: 1120, margin: "0 auto",
        padding: "72px 24px 48px",
        textAlign: "center",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(5,150,105,0.08)",
          border: "1px solid rgba(5,150,105,0.20)",
          borderRadius: 100, padding: "6px 16px",
          marginBottom: 28,
        }}>
          <span style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>
            ✓ Sin tarjeta de crédito para empezar
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(30px, 5vw, 48px)",
          fontWeight: 800,
          letterSpacing: "-1.2px",
          lineHeight: 1.1,
          color: C.textDark,
          maxWidth: 680,
          margin: "0 auto 20px",
        }}>
          Elegí el plan que mejor se{" "}
          <span style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            adapta a tu negocio
          </span>
        </h1>

        <p style={{
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.6,
          color: C.textMuted,
          maxWidth: 480,
          margin: "0 auto 48px",
        }}>
          Empezá gratis, crecé cuando lo necesites.
        </p>

        {/* ── Parte interactiva (client) ── */}
        <PricingClient />
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: C.textDark,
        padding: "28px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          <a
            href="mailto:hola@bookzi.app"
            style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", fontWeight: 500, textDecoration: "none" }}
          >
            hola@bookzi.app
          </a>
        </div>
      </footer>

    </div>
  )
}
