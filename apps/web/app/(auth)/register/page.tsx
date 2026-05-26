"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const CATEGORIES = [
  "Peluquería y barbería",
  "Estética y belleza",
  "Odontología",
  "Psicología y salud mental",
  "Nutrición",
  "Medicina general",
  "Gimnasio y fitness",
  "Pádel / Tenis",
  "Fútbol 5 / Canchas",
  "Consultoría",
  "Otro",
]

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="3" width="16" height="13" rx="2.5" stroke="white" strokeWidth="1.5"/>
        <path d="M5 1v3M13 1v3M1 8h16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Reservas 24/7",
    desc: "Tus clientes reservan solos, vos confirmás en un toque.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M15.5 11c0 .75-.17 1.46-.46 2.1L16 16l-2.9-.91A6.5 6.5 0 1115.5 11z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Confirmaciones por WhatsApp",
    desc: "Recordatorios automáticos. Menos ausencias, más ingresos.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 13l3.5-4 3 3L12 7l4 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Panel de control en tiempo real",
    desc: "Agenda, clientes y estadísticas desde tu celular.",
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName,  setLastName]  = useState("")
  const [email,     setEmail]     = useState("")
  const [phone,     setPhone]     = useState("")
  const [category,  setCategory]  = useState("")
  const [password,  setPassword]  = useState("")
  const [terms,     setTerms]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  // Detectar hash de error de Supabase (ej: link expirado que llegó al root)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.replace("#", ""))
    const errorCode = params.get("error_code")
    const err = params.get("error")
    if (err === "access_denied" || errorCode === "otp_expired") {
      router.replace("/forgot-password?expired=1")
    }
  }, [router])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!terms) { setError("Tenés que aceptar los términos para continuar."); return }
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error } = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone,
              category,
              business_name: `${firstName} ${lastName}`,
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("La conexión tardó demasiado. Revisá tu conexión e intentá de nuevo.")), 15000)
        ),
      ])
      if (error) {
        const msg =
          error.message.toLowerCase().includes("rate limit") || error.message.includes("429")
            ? "Demasiados intentos. Esperá unos minutos antes de intentar de nuevo."
            : error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")
            ? "Ese email ya está registrado. ¿Querés ingresar?"
            : error.message
        setError(msg)
        setLoading(false)
        return
      }
      if (data?.session) {
        router.push("/onboarding/welcome")
        router.refresh()
        return
      }
      setConfirmed(true)
      setLoading(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado. Intentá de nuevo.")
      setLoading(false)
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding/welcome` },
    })
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", fontFamily: "inherit" }}>

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
        <div style={{ position: "absolute", top: "40%", right: -100, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56, position: "relative", zIndex: 1 }}>
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

        {/* Título + features */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 16 }}>
            Tu agenda inteligente para profesionales
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.7, marginBottom: 48 }}>
            Gestioná turnos, confirmá clientes y crecé tu negocio — todo desde un solo lugar.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {f.icon}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div style={{
          marginTop: 48, position: "relative", zIndex: 1,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.20)",
          borderRadius: 16, padding: "18px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            {["ML", "CR", "AG", "FP"].map((ini, i) => (
              <div key={i} style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(255,255,255,0.28)",
                border: "2px solid rgba(255,255,255,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 800, color: "white",
                marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i, position: "relative",
              }}>{ini}</div>
            ))}
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.28)",
              border: "2px solid rgba(255,255,255,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 800, color: "white",
              marginLeft: -8, position: "relative", zIndex: 0,
            }}>+12k</div>
          </div>
          <p style={{ color: "white", fontWeight: 800, fontSize: 15, marginBottom: 2 }}>+12.000 profesionales</p>
          <p style={{ color: "rgba(255,255,255,0.60)", fontSize: 13 }}>ya usan Bookzi en Argentina y Uruguay</p>
        </div>

        {/* Link ya tengo cuenta */}
        <a href="/login" style={{
          color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600,
          textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
          position: "relative", zIndex: 1, marginTop: 28,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ya tengo cuenta — Ingresar
        </a>
      </div>

      {/* ── Panel derecho (blanco) ── */}
      <div style={{
        flex: 1, background: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 28px", overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Logo mobile */}
          <div className="auth-mobile-logo" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "#0284C7",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: "white" }}>B</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.4px" }}>Bookzi</span>
          </div>

          {confirmed ? (
            /* ── Confirmación de cuenta ── */
            <div style={{ textAlign: "center", padding: "16px 0" }}>
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
                ¡Cuenta creada!
              </h2>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, marginBottom: 6 }}>
                Te enviamos un email de confirmación a
              </p>
              <p style={{ color: "#0284C7", fontWeight: 700, fontSize: 15, marginBottom: 32 }}>{email}</p>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, marginBottom: 36 }}>
                Hacé click en el link del email para activar tu cuenta y empezar a usar Bookzi.
              </p>
              <a href="/login" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 54, borderRadius: 13,
                background: "linear-gradient(135deg, #0284C7, #0369A1)",
                color: "white", fontWeight: 800, fontSize: 16,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(2,132,199,0.35)",
              }}>
                Ir al inicio de sesión →
              </a>
              <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 16 }}>
                ¿No llegó? Revisá la carpeta de spam.
              </p>
            </div>
          ) : (
            /* ── Formulario de registro ── */
            <>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.7px", marginBottom: 6 }}>
                Creá tu cuenta gratis
              </h1>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.5, marginBottom: 28 }}>
                Empezá a recibir turnos hoy mismo. Sin tarjeta de crédito.
              </p>

              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Nombre + Apellido */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lbl}>Nombre</label>
                    <div style={fieldWrap}>
                      <svg style={fieldIco} viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="10" cy="6" r="4"/><path d="M2 18c0-4 3.6-6 8-6s8 2 8 6"/>
                      </svg>
                      <input style={fieldInp} type="text" required placeholder="Martina" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name"/>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Apellido</label>
                    <div style={fieldWrap}>
                      <input style={{ ...fieldInp, paddingLeft: 14 }} type="text" required placeholder="López" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name"/>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={lbl}>Email profesional</label>
                  <div style={fieldWrap}>
                    <svg style={fieldIco} viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="2" y="4" width="16" height="13" rx="2"/><polyline points="2,4 10,11 18,4"/>
                    </svg>
                    <input style={fieldInp} type="email" required placeholder="martina@consultorio.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/>
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label style={lbl}>WhatsApp</label>
                  <div style={{ ...fieldWrap, gap: 0 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "0 12px",
                      borderRight: "1.5px solid #E2E8F0", height: "100%", flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 16 }}>🇦🇷</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>+54</span>
                    </div>
                    <input style={{ ...fieldInp, paddingLeft: 12, border: "none" }} type="tel" placeholder="11 1234-5678" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel"/>
                  </div>
                </div>

                {/* Rubro */}
                <div>
                  <label style={lbl}>¿A qué te dedicás?</label>
                  <div style={{ ...fieldWrap, padding: 0, position: "relative" }}>
                    <select
                      required value={category} onChange={e => setCategory(e.target.value)}
                      style={{
                        width: "100%", height: 50, padding: "0 36px 0 14px",
                        border: "none", background: "transparent",
                        fontSize: 15, color: category ? "#0F172A" : "#94A3B8",
                        outline: "none", cursor: "pointer", fontFamily: "inherit",
                        appearance: "none",
                      }}
                    >
                      <option value="" disabled>Elegí tu rubro</option>
                      {CATEGORIES.map(c => <option key={c} value={c} style={{ color: "#0F172A" }}>{c}</option>)}
                    </select>
                    <svg style={{ position: "absolute", right: 12, pointerEvents: "none" }} width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M3 5l4.5 5L12 5" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label style={lbl}>Contraseña</label>
                  <div style={fieldWrap}>
                    <svg style={fieldIco} viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="9" width="14" height="10" rx="2"/><path d="M6 9V7a4 4 0 018 0v2"/>
                    </svg>
                    <input style={fieldInp} type="password" required minLength={6} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"/>
                  </div>
                </div>

                {/* Términos */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginTop: 2 }}>
                  <input
                    type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
                    style={{ marginTop: 3, width: 15, height: 15, accentColor: "#0284C7", flexShrink: 0, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, color: "#64748B", lineHeight: 1.55 }}>
                    Acepto los{" "}
                    <a href="/terms" style={{ color: "#0284C7", fontWeight: 600, textDecoration: "none" }}>Términos de servicio</a>
                    {" "}y la{" "}
                    <a href="/privacy" style={{ color: "#0284C7", fontWeight: 600, textDecoration: "none" }}>Política de privacidad</a>.
                  </span>
                </label>

                {error && (
                  <p style={{ color: "#DC2626", fontSize: 13, textAlign: "center", margin: 0 }}>{error}</p>
                )}

                {/* Botón principal */}
                <button
                  type="submit" disabled={loading}
                  style={{
                    height: 54, borderRadius: 13, marginTop: 4,
                    background: "linear-gradient(135deg, #0284C7, #0369A1)",
                    color: "white", fontWeight: 800, fontSize: 16,
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.8 : 1, fontFamily: "inherit",
                    boxShadow: "0 4px 16px rgba(2,132,199,0.35)",
                    transition: "opacity 200ms",
                  }}
                >
                  {loading ? "Creando cuenta..." : "Crear mi cuenta gratis →"}
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                  <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, whiteSpace: "nowrap" }}>o registrate con</span>
                  <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                </div>

                {/* Google */}
                <button
                  type="button" onClick={handleGoogle}
                  style={{
                    height: 52, borderRadius: 13,
                    background: "white", color: "#0F172A",
                    fontWeight: 600, fontSize: 15,
                    border: "1.5px solid #E2E8F0",
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    transition: "border-color 200ms",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continuar con Google
                </button>

              </form>

              <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#64748B" }}>
                ¿Ya tenés cuenta?{" "}
                <a href="/login" style={{ color: "#0284C7", fontWeight: 700, textDecoration: "none" }}>
                  Ingresá acá
                </a>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        .auth-left-panel  { display: flex !important; }
        .auth-mobile-logo { display: none !important; }
        @media (max-width: 768px) {
          .auth-left-panel  { display: none !important; }
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700,
  color: "#334155", marginBottom: 7, letterSpacing: "0.02em",
}

const fieldWrap: React.CSSProperties = {
  display: "flex", alignItems: "center",
  border: "1.5px solid #E2E8F0", borderRadius: 12,
  background: "white", height: 50, overflow: "hidden",
  transition: "border-color 200ms",
}

const fieldIco: React.CSSProperties = {
  width: 16, height: 16, marginLeft: 14, flexShrink: 0,
}

const fieldInp: React.CSSProperties = {
  flex: 1, height: "100%", border: "none", outline: "none",
  fontSize: 15, color: "#0F172A", padding: "0 14px 0 10px",
  background: "transparent", fontFamily: "inherit",
}
