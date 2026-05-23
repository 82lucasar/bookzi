"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router   = useRouter()
  const [step, setStep]         = useState<"welcome" | "form">("welcome")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("La conexión tardó demasiado. Revisá tu conexión e intentá de nuevo.")), 15000)
        ),
      ])
      if (error) {
        setError("Email o contraseña incorrectos. Revisá tus datos.")
        setLoading(false)
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ocurrió un error. Intentá de nuevo.")
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

      {/* Contenido central */}
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

        {step === "welcome" ? (

          /* ── Pantalla de bienvenida ── */
          <>
            <h1 style={{
              fontSize: 42, fontWeight: 900, color: "white",
              marginBottom: 16, letterSpacing: "-1.5px", lineHeight: 1.08,
            }}>
              Hola, bienvenido/a
            </h1>

            <p style={{
              color: "rgba(255,255,255,0.75)", fontSize: 16,
              lineHeight: 1.6, marginBottom: 52, maxWidth: 280,
            }}>
              Configuremos tu agenda en 3 pasos rápidos y empezás a recibir turnos hoy mismo.
            </p>

            <button
              onClick={() => setStep("form")}
              style={{
                width: "100%", height: 58, borderRadius: 16,
                background: "white", color: "#0284C7",
                fontWeight: 800, fontSize: 17,
                border: "none", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              Empezar
            </button>

            <p style={{
              color: "rgba(255,255,255,0.45)", fontSize: 13,
              marginTop: 20,
            }}>
              Tomá 3 minutos ahora, ganás horas cada semana
            </p>
          </>

        ) : (

          /* ── Formulario de login ── */
          <>
            <h1 style={{
              fontSize: 32, fontWeight: 900, color: "white",
              marginBottom: 10, letterSpacing: "-1px", lineHeight: 1.1,
            }}>
              Ingresá a tu cuenta
            </h1>

            <p style={{
              color: "rgba(255,255,255,0.65)", fontSize: 15,
              marginBottom: 36,
            }}>
              ¿No tenés cuenta?{" "}
              <a href="/register" style={{ color: "white", fontWeight: 700, textDecoration: "underline" }}>
                Registrate gratis
              </a>
            </p>

            <form
              onSubmit={handleLogin}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
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

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoComplete="current-password"
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
                {loading ? "Ingresando..." : "Ingresar →"}
              </button>
            </form>

            <button
              onClick={() => setStep("welcome")}
              style={{
                background: "none", border: "none",
                color: "rgba(255,255,255,0.5)", fontSize: 13,
                marginTop: 24, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Volver
            </button>
          </>

        )}
      </div>
    </div>
  )
}
