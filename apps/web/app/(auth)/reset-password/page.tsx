"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type PageState = "checking" | "ready" | "done" | "expired"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>("checking")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | null = null
    let subscription: { unsubscribe: () => void } | null = null

    async function init() {
      // Caso 1: PKCE flow — el link trae ?code= en la URL
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          window.history.replaceState({}, "", "/reset-password")
          setPageState("ready")
          return
        }
      }

      // Caso 2: Sesión ya establecida (el callback server-side ya la creó)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setPageState("ready")
        return
      }

      // Caso 3: Hash/implicit flow — Supabase emite PASSWORD_RECOVERY automáticamente
      timer = setTimeout(() => setPageState("expired"), 5000)

      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          if (timer) clearTimeout(timer)
          setPageState("ready")
        }
      })
      subscription = data.subscription
    }

    init()

    return () => {
      if (timer) clearTimeout(timer)
      if (subscription) subscription.unsubscribe()
    }
  }, [])

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
      setPageState("done")
      setTimeout(() => router.push("/dashboard"), 2500)
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
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
      <div style={{ position: "absolute", top: -120, left: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.10)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, right: -60, width: 380, height: 380, borderRadius: "50%", background: "rgba(255,255,255,0.10)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "35%", right: -80, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />

      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 360,
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
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

        <p style={{ color: "white", fontWeight: 800, fontSize: 16, marginBottom: 52, letterSpacing: "0.2px" }}>
          Bookzi
        </p>

        {/* Estado: verificando */}
        {pageState === "checking" && (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.30)",
              borderTopColor: "white",
              animation: "spin 0.8s linear infinite",
              marginBottom: 28,
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15 }}>
              Verificando el link...
            </p>
          </>
        )}

        {/* Estado: link expirado */}
        {pageState === "expired" && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 9v6M14 19v.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="14" cy="14" r="11" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 12, letterSpacing: "-0.5px" }}>
              Link expirado
            </h1>
            <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 15, lineHeight: 1.6, marginBottom: 36, maxWidth: 280 }}>
              El link de recuperación expiró o ya fue usado. Pedí uno nuevo.
            </p>
            <a
              href="/forgot-password"
              style={{
                width: "100%", height: 56, borderRadius: 14,
                background: "white", color: "#0284C7",
                fontWeight: 800, fontSize: 16,
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              }}
            >
              Pedir nuevo link →
            </a>
            <a href="/login" style={{ color: "rgba(255,255,255,0.50)", fontSize: 13, marginTop: 24, textDecoration: "none" }}>
              ← Volver al inicio de sesión
            </a>
          </>
        )}

        {/* Estado: éxito */}
        {pageState === "done" && (
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
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "white", marginBottom: 12, letterSpacing: "-1px" }}>
              ¡Contraseña actualizada!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 15 }}>
              Te estamos llevando a tu cuenta...
            </p>
          </>
        )}

        {/* Estado: formulario */}
        {pageState === "ready" && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(255,255,255,0.20)",
              border: "1.5px solid rgba(255,255,255,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="5" y="11" width="16" height="12" rx="3" stroke="white" strokeWidth="2"/>
                <path d="M9 11V8a4 4 0 018 0v3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="13" cy="17" r="1.5" fill="white"/>
              </svg>
            </div>

            <h1 style={{ fontSize: 30, fontWeight: 900, color: "white", marginBottom: 10, letterSpacing: "-1px", lineHeight: 1.1 }}>
              Nueva contraseña
            </h1>

            <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 15, lineHeight: 1.6, marginBottom: 32, maxWidth: 280 }}>
              Elegí una contraseña nueva para tu cuenta de Bookzi.
            </p>

            <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative" }}>
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
                    boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repetí la contraseña"
                  autoComplete="new-password"
                  style={{
                    width: "100%", height: 54, borderRadius: 14,
                    border: `1.5px solid ${confirm && confirm !== password ? "rgba(255,150,150,0.6)" : "rgba(255,255,255,0.28)"}`,
                    background: "rgba(255,255,255,0.16)",
                    color: "white", fontSize: 15,
                    padding: "0 16px", outline: "none",
                    boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Indicador de coincidencia */}
              {confirm.length > 0 && (
                <p style={{
                  fontSize: 12, textAlign: "left", marginTop: -4,
                  color: confirm === password ? "rgba(100,255,180,0.9)" : "rgba(255,180,180,0.9)",
                }}>
                  {confirm === password ? "✓ Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                </p>
              )}

              {error && (
                <p style={{ color: "rgba(255,200,200,1)", fontSize: 13, textAlign: "center", marginTop: 2 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || password !== confirm || password.length < 8}
                style={{
                  width: "100%", height: 56, borderRadius: 14,
                  background: "white", color: "#0284C7",
                  fontWeight: 800, fontSize: 16,
                  border: "none",
                  cursor: (loading || password !== confirm || password.length < 8) ? "not-allowed" : "pointer",
                  opacity: (loading || password !== confirm || password.length < 8) ? 0.6 : 1,
                  marginTop: 8,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  fontFamily: "inherit",
                  transition: "opacity 200ms",
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
