"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("")
  const [error, setError]     = useState<string | null>(null)
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0369A1 0%, #0284C7 50%, #38BDF8 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 28px",
      position: "relative",
      overflow: "hidden",
      boxSizing: "border-box",
    }}>

      {/* Círculos decorativos */}
      <div style={{
        position: "absolute", top: -120, left: -80,
        width: 320, height: 320, borderRadius: "50%",
        background: "rgba(255,255,255,0.10)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -100, right: -60,
        width: 380, height: 380, borderRadius: "50%",
        background: "rgba(255,255,255,0.10)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "35%", right: -80,
        width: 200, height: 200, borderRadius: "50%",
        background: "rgba(255,255,255,0.07)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: 360,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}>

        {/* Logo */}
        <div style={{
          width: 76, height: 76, borderRadius: 20,
          background: "rgba(255,255,255,0.20)",
          border: "1.5px solid rgba(255,255,255,0.30)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 34, fontWeight: 900, color: "white" }}>B</span>
        </div>

        <p style={{
          color: "white", fontWeight: 800, fontSize: 16,
          marginBottom: 52, letterSpacing: "0.2px",
        }}>
          Bookzi
        </p>

        {sent ? (
          /* ── Confirmación de envío ── */
          <>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(255,255,255,0.20)",
              border: "1.5px solid rgba(255,255,255,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M5 14l6 6L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h1 style={{
              fontSize: 30, fontWeight: 900, color: "white",
              marginBottom: 14, letterSpacing: "-1px", lineHeight: 1.1,
            }}>
              Revisá tu email
            </h1>

            <p style={{
              color: "rgba(255,255,255,0.75)", fontSize: 15,
              lineHeight: 1.6, marginBottom: 40, maxWidth: 280,
            }}>
              Te mandamos un link a <strong style={{ color: "white" }}>{email}</strong> para que puedas crear una nueva contraseña.
            </p>

            <p style={{
              color: "rgba(255,255,255,0.45)", fontSize: 13,
              marginBottom: 32,
            }}>
              Si no lo ves, revisá la carpeta de spam
            </p>

            <a href="/login" style={{
              color: "rgba(255,255,255,0.70)", fontSize: 14, fontWeight: 600,
              textDecoration: "underline",
            }}>
              ← Volver al inicio de sesión
            </a>
          </>
        ) : (
          /* ── Formulario ── */
          <>
            <h1 style={{
              fontSize: 32, fontWeight: 900, color: "white",
              marginBottom: 12, letterSpacing: "-1px", lineHeight: 1.1,
            }}>
              Olvidé mi contraseña
            </h1>

            <p style={{
              color: "rgba(255,255,255,0.70)", fontSize: 15,
              lineHeight: 1.6, marginBottom: 36, maxWidth: 280,
            }}>
              Ingresá tu email y te mandamos un link para crear una nueva contraseña.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu email"
                autoComplete="email"
                style={{
                  width: "100%", height: 54, borderRadius: 14,
                  border: "1.5px solid rgba(255,255,255,0.28)",
                  background: "rgba(255,255,255,0.16)",
                  color: "white", fontSize: 15,
                  padding: "0 16px", outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />

              {error && (
                <p style={{
                  color: "rgba(255,200,200,1)", fontSize: 13,
                  textAlign: "center", marginTop: 2,
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", height: 56, borderRadius: 14,
                  background: "white", color: "#0284C7",
                  fontWeight: 800, fontSize: 16,
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.8 : 1,
                  marginTop: 8,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Enviando..." : "Enviar link →"}
              </button>
            </form>

            <a href="/login" style={{
              color: "rgba(255,255,255,0.50)", fontSize: 13,
              marginTop: 28, textDecoration: "none", cursor: "pointer",
            }}>
              ← Volver al inicio de sesión
            </a>
          </>
        )}
      </div>
    </div>
  )
}
