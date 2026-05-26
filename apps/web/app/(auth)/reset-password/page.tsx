"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type PageState = "checking" | "ready" | "done" | "expired"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>("checking")
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | null = null
    let subscription: { unsubscribe: () => void } | null = null

    async function init() {
      // Caso 1: PKCE — link con ?code= en la URL
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

      // Caso 2: Sesión ya establecida (callback server-side)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setPageState("ready")
        return
      }

      // Caso 3: Hash/implicit flow — Supabase emite PASSWORD_RECOVERY
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
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return }

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

  const passwordsMatch = confirm.length > 0 && password === confirm
  const passwordsNoMatch = confirm.length > 0 && password !== confirm

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

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 20 }}>
            Creá tu nueva contraseña
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.7, marginBottom: 52 }}>
            Elegí una contraseña segura para proteger tu cuenta. No la compartimos con nadie.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              {
                text: "Mínimo 6 caracteres — combiná letras y números",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3" y="8" width="12" height="8" rx="2.5" stroke="white" strokeWidth="1.5"/>
                    <path d="M6 8V6a3 3 0 016 0v2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="9" cy="12" r="1.2" fill="white"/>
                  </svg>
                ),
              },
              {
                text: "Tu contraseña está encriptada y segura",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2L3 5v5c0 3.5 2.5 6.5 6 7.5C13.5 16.5 16 13.5 16 10V5L9 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M6 9l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
              {
                text: "Podés cambiarla cuando quieras desde tu perfil",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2v4M9 12v4M2 9h4M12 9h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="9" cy="9" r="3" stroke="white" strokeWidth="1.5"/>
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
          {(pageState === "ready" || pageState === "checking") && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
              <div style={{ width: 8, height: 6, borderRadius: 3, background: "#E0F0F8" }} />
              <div style={{ width: 32, height: 6, borderRadius: 3, background: "#0284C7" }} />
            </div>
          )}

          {/* ── Verificando ── */}
          {pageState === "checking" && (
            <div style={{ textAlign: "center", paddingTop: 40 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                border: "3px solid #E0F0F8",
                borderTopColor: "#0284C7",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 28px",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <p style={{ color: "#64748B", fontSize: 15 }}>Verificando el link...</p>
            </div>
          )}

          {/* ── Link expirado ── */}
          {pageState === "expired" && (
            <div style={{ textAlign: "center", paddingTop: 20 }}>
              <div style={{
                width: 76, height: 76, borderRadius: 22,
                background: "rgba(220,38,38,0.06)",
                border: "1.5px solid rgba(220,38,38,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 28px",
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="11" stroke="#DC2626" strokeWidth="2"/>
                  <path d="M16 10v7M16 21v1" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.8px", marginBottom: 12 }}>
                Link expirado
              </h2>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, marginBottom: 36, maxWidth: 300, margin: "0 auto 36px" }}>
                El link de recuperación expiró o ya fue usado. Pedí uno nuevo.
              </p>
              <a
                href="/forgot-password"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", height: 54, borderRadius: 12,
                  background: "linear-gradient(135deg, #0284C7, #0369A1)",
                  color: "white", fontWeight: 800, fontSize: 16,
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(2,132,199,0.35)",
                }}
              >
                Pedir nuevo link →
              </a>
              <a href="/login" style={{
                display: "block", textAlign: "center",
                color: "#94A3B8", fontSize: 13, fontWeight: 600,
                textDecoration: "none", marginTop: 24,
              }}>
                ← Volver al inicio de sesión
              </a>
            </div>
          )}

          {/* ── Éxito ── */}
          {pageState === "done" && (
            <div style={{ textAlign: "center", paddingTop: 20 }}>
              <div style={{
                width: 76, height: 76, borderRadius: 22,
                background: "rgba(5,150,105,0.08)",
                border: "1.5px solid rgba(5,150,105,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 28px",
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M6 16l7 7L26 9" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.8px", marginBottom: 12 }}>
                ¡Contraseña actualizada!
              </h2>
              <p style={{ color: "#64748B", fontSize: 15 }}>
                Te estamos llevando a tu cuenta...
              </p>
            </div>
          )}

          {/* ── Formulario ── */}
          {pageState === "ready" && (
            <>
              <div style={{
                width: 76, height: 76, borderRadius: 22,
                background: "rgba(2,132,199,0.08)",
                border: "1.5px solid rgba(2,132,199,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 28,
              }}>
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <rect x="7" y="15" width="20" height="14" rx="4" stroke="#0284C7" strokeWidth="2.2"/>
                  <path d="M11 15v-4a6 6 0 0112 0v4" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round"/>
                  <circle cx="17" cy="22" r="2" fill="#0284C7"/>
                </svg>
              </div>

              <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0F172A", letterSpacing: "-1px", marginBottom: 10 }}>
                Nueva contraseña
              </h2>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                Elegí una contraseña nueva para tu cuenta de Bookzi.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    style={{
                      width: "100%", height: 52, borderRadius: 12,
                      border: "1.5px solid #E0F0F8", background: "#F8FBFE",
                      color: "#0F172A", fontSize: 15,
                      padding: "0 16px", outline: "none",
                      boxSizing: "border-box", fontFamily: "inherit",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0284C7"}
                    onBlur={(e) => e.target.style.borderColor = "#E0F0F8"}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                    Repetí la contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repetí tu contraseña"
                    autoComplete="new-password"
                    style={{
                      width: "100%", height: 52, borderRadius: 12,
                      border: `1.5px solid ${passwordsNoMatch ? "rgba(220,38,38,0.4)" : passwordsMatch ? "rgba(5,150,105,0.4)" : "#E0F0F8"}`,
                      background: "#F8FBFE",
                      color: "#0F172A", fontSize: 15,
                      padding: "0 16px", outline: "none",
                      boxSizing: "border-box", fontFamily: "inherit",
                      transition: "border-color 200ms",
                    }}
                  />
                  {confirm.length > 0 && (
                    <p style={{
                      fontSize: 12, marginTop: 6,
                      color: passwordsMatch ? "#059669" : "#DC2626",
                    }}>
                      {passwordsMatch ? "✓ Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                    </p>
                  )}
                </div>

                {error && (
                  <p style={{ color: "#DC2626", fontSize: 13, margin: 0 }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !passwordsMatch || password.length < 6}
                  style={{
                    width: "100%", height: 54, borderRadius: 12,
                    background: "linear-gradient(135deg, #0284C7, #0369A1)",
                    color: "white", fontWeight: 800, fontSize: 16,
                    border: "none",
                    cursor: (loading || !passwordsMatch || password.length < 6) ? "not-allowed" : "pointer",
                    opacity: (loading || !passwordsMatch || password.length < 6) ? 0.5 : 1,
                    boxShadow: "0 4px 20px rgba(2,132,199,0.35)",
                    fontFamily: "inherit", marginTop: 4,
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

      <style>{`
        @media (max-width: 768px) { .auth-left-panel { display: none !important; } }
      `}</style>
    </div>
  )
}
