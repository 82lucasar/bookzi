"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [expired, setExpired]   = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("expired") === "1") setExpired(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setError("No pudimos enviar el email. Revisá la dirección e intentá de nuevo.")
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", fontFamily: "inherit", background: "white" }}>

      {/* ── Panel izquierdo (azul) ── */}
      <div
        className="auth-left-panel"
        style={{
          width: "42%", minWidth: 340,
          background: "linear-gradient(160deg, #0369A1 0%, #0284C7 60%, #38BDF8 100%)",
          padding: "48px 44px",
          display: "flex", flexDirection: "column",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Círculos decorativos */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 64, position: "relative", zIndex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.20)",
            border: "1.5px solid rgba(255,255,255,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "white" }}>B</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "white", letterSpacing: "-0.3px" }}>Bookzi</span>
        </div>

        {/* Texto principal */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 20 }}>
            Recuperá el acceso a tu agenda
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.7, marginBottom: 52 }}>
            Te mandamos un link seguro para restablecer tu contraseña en menos de un minuto.
          </p>

          {/* Bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              {
                text: "Link con encriptación SSL · expira en 30 minutos",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3" y="8" width="12" height="8" rx="2.5" stroke="white" strokeWidth="1.5"/>
                    <path d="M6 8V6a3 3 0 016 0v2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
              },
              {
                text: "Vos elegís la nueva contraseña, nosotros no la vemos",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="8" cy="8" r="4" stroke="white" strokeWidth="1.5"/>
                    <path d="M11 11l5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
              },
              {
                text: "¿Necesitás ayuda? Escribinos por WhatsApp",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M15 10.5c0 .83-.18 1.62-.5 2.33L16 16l-3.17-1c-.7.32-1.5.5-2.33.5A6.5 6.5 0 1115 10.5z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.20)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {item.icon}
                </div>
                <span style={{ color: "rgba(255,255,255,0.80)", fontSize: 14, lineHeight: 1.6, paddingTop: 8 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volver (bottom) */}
        <a href="/login" style={{
          color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600,
          textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
          position: "relative", zIndex: 1, marginTop: 48,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver al inicio de sesión
        </a>
      </div>

      {/* ── Panel derecho (blanco) ── */}
      <div style={{
        flex: 1, background: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 28px",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Dots de paso */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
            <div style={{ width: 32, height: 6, borderRadius: 3, background: "#0284C7" }} />
            <div style={{ width: 8, height: 6, borderRadius: 3, background: "#E0F0F8" }} />
          </div>

          {sent ? (
            /* ── Estado: email enviado ── */
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 76, height: 76, borderRadius: 22,
                background: "rgba(2,132,199,0.08)",
                border: "1.5px solid rgba(2,132,199,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 28px",
              }}>
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <path d="M5 9l12 9 12-9" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="5" y="9" width="24" height="18" rx="3" stroke="#0284C7" strokeWidth="2"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.8px", marginBottom: 12 }}>
                Revisá tu email
              </h2>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, marginBottom: 6 }}>
                Te mandamos el link a{" "}
                <strong style={{ color: "#0284C7" }}>{email}</strong>
              </p>
              <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 44 }}>
                Si no lo ves, revisá la carpeta de spam
              </p>
              <button
                onClick={() => { setSent(false); setExpired(false) }}
                style={{
                  background: "none", border: "none", color: "#0284C7",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  textDecoration: "underline", fontFamily: "inherit",
                }}
              >
                Enviar a otro email
              </button>
            </div>
          ) : (
            /* ── Estado: formulario ── */
            <>
              {/* Ícono llave */}
              <div style={{
                width: 76, height: 76, borderRadius: 22,
                background: "rgba(2,132,199,0.08)",
                border: "1.5px solid rgba(2,132,199,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 28,
              }}>
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <circle cx="13" cy="14" r="7" stroke="#0284C7" strokeWidth="2.2"/>
                  <path d="M18.5 19.5L28 29" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round"/>
                  <circle cx="13" cy="14" r="3" fill="rgba(2,132,199,0.20)"/>
                </svg>
              </div>

              <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0F172A", letterSpacing: "-1px", marginBottom: 10 }}>
                ¿Olvidaste tu contraseña?
              </h2>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                Ingresá el email con el que te registraste y te mandamos el link para restablecerla.
              </p>

              {/* Banner link expirado */}
              {expired && (
                <div style={{
                  padding: "12px 16px", borderRadius: 12, marginBottom: 20,
                  background: "rgba(220,38,38,0.05)",
                  border: "1px solid rgba(220,38,38,0.15)",
                  color: "#DC2626", fontSize: 13, lineHeight: 1.5,
                }}>
                  Tu link expiró o ya fue usado. Pedí uno nuevo ingresando tu email.
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hola@consultorio.com"
                    autoComplete="email"
                    style={{
                      width: "100%", height: 52, borderRadius: 12,
                      border: "1.5px solid #E0F0F8",
                      background: "#F8FBFE",
                      color: "#0F172A", fontSize: 15,
                      padding: "0 16px", outline: "none",
                      boxSizing: "border-box", fontFamily: "inherit",
                      transition: "border-color 200ms",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0284C7"}
                    onBlur={(e) => e.target.style.borderColor = "#E0F0F8"}
                  />
                </div>

                {error && (
                  <p style={{ color: "#DC2626", fontSize: 13, margin: 0 }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", height: 54, borderRadius: 12,
                    background: "linear-gradient(135deg, #0284C7, #0369A1)",
                    color: "white", fontWeight: 800, fontSize: 16,
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.8 : 1,
                    boxShadow: "0 4px 20px rgba(2,132,199,0.35)",
                    fontFamily: "inherit", marginTop: 4,
                    transition: "opacity 200ms",
                  }}
                >
                  {loading ? "Enviando..." : "Enviar instrucciones"}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1" }} />
                <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
              </div>

              <a href="/login" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                color: "#64748B", fontSize: 14, fontWeight: 600, textDecoration: "none",
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Volver al inicio de sesión
              </a>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .auth-left-panel { display: none !important; } }
      `}</style>
    </div>
  )
}
