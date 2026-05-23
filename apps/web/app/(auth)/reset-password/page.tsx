"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError("No pudimos actualizar la contraseña. El link puede haber expirado.")
        setLoading(false)
        return
      }
      setDone(true)
      setTimeout(() => router.push("/dashboard"), 2000)
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

        {done ? (
          /* ── Confirmación ── */
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
              marginBottom: 12, letterSpacing: "-1px",
            }}>
              ¡Contraseña actualizada!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 15 }}>
              Te estamos llevando a tu cuenta...
            </p>
          </>
        ) : (
          /* ── Formulario ── */
          <>
            <h1 style={{
              fontSize: 32, fontWeight: 900, color: "white",
              marginBottom: 12, letterSpacing: "-1px", lineHeight: 1.1,
            }}>
              Nueva contraseña
            </h1>

            <p style={{
              color: "rgba(255,255,255,0.70)", fontSize: 15,
              lineHeight: 1.6, marginBottom: 36, maxWidth: 280,
            }}>
              Elegí una contraseña nueva para tu cuenta de Bookzi.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}
            >
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                autoComplete="new-password"
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

              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                autoComplete="new-password"
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
                {loading ? "Guardando..." : "Guardar contraseña →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
