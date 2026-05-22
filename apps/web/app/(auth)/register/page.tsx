"use client"

import { useState } from "react"
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: "Reservas 24/7",
    desc: "Tus clientes reservan solos, vos confirmás en un toque.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.09 2.22 2 2 0 012.07 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.27 7.91a16 16 0 006.82 6.82l1.03-1.03a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
    title: "Confirmaciones por WhatsApp",
    desc: "Recordatorios automáticos. Menos no-shows, más plata.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Estadísticas en tiempo real",
    desc: "Sabé cuántos turnos tuviste y cuánta guita generaste.",
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!terms) { setError("Tenés que aceptar los términos para continuar."); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
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
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push("/onboarding/welcome")
    router.refresh()
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding/welcome` },
    })
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* ── Panel izquierdo (solo desktop) ── */}
      <div
        className="hidden lg:flex"
        style={{
          width: "30%", flexDirection: "column",
          background: "linear-gradient(160deg, #0369A1 0%, #0284C7 60%, #0EA5E9 100%)",
          padding: "40px 32px", position: "relative", overflow: "hidden",
        }}
      >
        {/* Círculos decorativos */}
        <div style={{ position: "absolute", top: -70, right: -70, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 80, left: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48, position: "relative", zIndex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "white" }}>B</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "white", letterSpacing: "-0.4px" }}>Bookzi</span>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 14 }}>
            Tu agenda, siempre organizada.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 14, lineHeight: 1.65, marginBottom: 44 }}>
            Gestioná turnos, confirmá clientes y crecé tu negocio — todo desde un solo lugar.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</p>
                  <p style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, lineHeight: 1.55 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div style={{
          marginTop: 48, position: "relative", zIndex: 1,
          background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 16, padding: "18px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            {["ML","CR","AG","FP"].map((ini, i) => (
              <div key={i} style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(255,255,255,0.28)", border: "2px solid rgba(255,255,255,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 800, color: "white",
                marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i, position: "relative",
              }}>{ini}</div>
            ))}
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.28)", border: "2px solid rgba(255,255,255,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 800, color: "white",
              marginLeft: -8, position: "relative", zIndex: 0,
            }}>12k</div>
          </div>
          <p style={{ color: "white", fontWeight: 800, fontSize: 16, marginBottom: 3 }}>+12.000 profesionales</p>
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 13 }}>ya usan Bookzi en Argentina y Uruguay</p>
        </div>
      </div>

      {/* ── Panel derecho ── */}
      <div style={{
        flex: 1, background: "#F8FAFC",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px", overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Logo mobile */}
          <div className="flex lg:hidden" style={{ alignItems: "center", gap: 8, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "white" }}>B</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.4px" }}>Bookzi</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", marginBottom: 8, letterSpacing: "-0.7px" }}>
            Creá tu cuenta gratis
          </h1>
          <p style={{ color: "#64748B", fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
            Empezá a recibir turnos hoy mismo. Sin tarjeta de crédito.
          </p>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Nombre + Apellido */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Nombre</label>
                <div style={wrap}>
                  <svg style={ico} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  <input style={inp} type="text" required placeholder="Martina" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
              </div>
              <div>
                <label style={lbl}>Apellido</label>
                <div style={wrap}>
                  <input style={{ ...inp, paddingLeft: 14 }} type="text" required placeholder="López" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={lbl}>Email profesional</label>
              <div style={wrap}>
                <svg style={ico} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
                <input style={inp} type="email" required placeholder="martina@consultorio.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label style={lbl}>WhatsApp</label>
              <div style={{ ...wrap, gap: 0 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "0 12px", flexShrink: 0,
                  borderRight: "1.5px solid #E2E8F0", height: "100%",
                }}>
                  <span style={{ fontSize: 17 }}>🇦🇷</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>+54</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <input style={{ ...inp, paddingLeft: 12, border: "none" }} type="tel" placeholder="11 1234 5678" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label style={lbl}>¿A qué te dedicás?</label>
              <div style={{ ...wrap, padding: 0, position: "relative" }}>
                <select
                  required value={category} onChange={e => setCategory(e.target.value)}
                  style={{
                    width: "100%", height: 50,
                    padding: "0 40px 0 14px",
                    border: "none", background: "transparent",
                    fontSize: 15, color: category ? "#0F172A" : "#94A3B8",
                    outline: "none", cursor: "pointer", fontFamily: "inherit",
                    appearance: "none",
                  }}
                >
                  <option value="" disabled>Elegí tu rubro</option>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ color: "#0F172A" }}>{c}</option>)}
                </select>
                <svg style={{ position: "absolute", right: 14, pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label style={lbl}>Contraseña</label>
              <div style={wrap}>
                <svg style={ico} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input style={inp} type="password" required minLength={8} placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
            </div>

            {/* Términos */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginTop: 2 }}>
              <input
                type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: "#0284C7", flexShrink: 0, cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: "#64748B", lineHeight: 1.55 }}>
                Acepto los{" "}
                <a href="/terms" style={{ color: "#0284C7", fontWeight: 600, textDecoration: "none" }}>Términos de servicio</a>
                {" "}y la{" "}
                <a href="/privacy" style={{ color: "#0284C7", fontWeight: 600, textDecoration: "none" }}>Política de privacidad</a>
                {" "}de Bookzi.
              </span>
            </label>

            {error && (
              <p style={{ color: "#DC2626", fontSize: 13, textAlign: "center", marginTop: 2 }}>{error}</p>
            )}

            {/* Botón principal */}
            <button
              type="submit" disabled={loading}
              style={{
                height: 52, borderRadius: 12, marginTop: 4,
                background: loading ? "#0369A1" : "#0284C7",
                color: "white", fontWeight: 800, fontSize: 16,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.85 : 1, fontFamily: "inherit",
                boxShadow: "0 2px 12px rgba(2,132,199,0.30)",
              }}
            >
              {loading ? "Creando cuenta..." : "Crear mi cuenta gratis"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "2px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
              <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500, whiteSpace: "nowrap" }}>o registrate con</span>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            </div>

            {/* Google */}
            <button
              type="button" onClick={handleGoogle}
              style={{
                height: 52, borderRadius: 12,
                background: "white", color: "#0F172A",
                fontWeight: 600, fontSize: 15,
                border: "1.5px solid #E2E8F0",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
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

        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 700,
  color: "#334155", marginBottom: 7,
}

const wrap: React.CSSProperties = {
  display: "flex", alignItems: "center",
  border: "1.5px solid #E2E8F0", borderRadius: 12,
  background: "white", height: 50, overflow: "hidden",
}

const ico: React.CSSProperties = {
  width: 16, height: 16, marginLeft: 14, flexShrink: 0,
}

const inp: React.CSSProperties = {
  flex: 1, height: "100%", border: "none", outline: "none",
  fontSize: 15, color: "#0F172A", padding: "0 14px 0 10px",
  background: "transparent", fontFamily: "inherit",
}
