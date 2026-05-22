"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { BookziIcon } from "@/components/BookziLogo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Email o contraseña incorrectos. Revisá tus datos e intentá de nuevo.")
      setLoading(false)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — Hero ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0369A1 0%, #0284C7 55%, #0EA5E9 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
          <div className="absolute -bottom-16 -left-16 w-[360px] h-[360px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
            <BookziIcon size={30} />
          </div>
          <span className="text-2xl font-extrabold text-white" style={{ letterSpacing: "-1px" }}>Bookzi</span>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-3">Tu agenda online</p>
            <h2 className="text-4xl font-extrabold text-white leading-tight" style={{ letterSpacing: "-1.5px" }}>
              Gestioná tus turnos desde donde estés
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: "📅", text: "Reservas online 24/7 sin llamadas" },
              { icon: "💬", text: "Confirmaciones automáticas por WhatsApp" },
              { icon: "📊", text: "Control total de tu agenda desde el celular" },
              { icon: "🆓", text: "Gratis para empezar, sin tarjeta de crédito" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3.5 py-1">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.15)" }}
                >
                  {f.icon}
                </div>
                <p className="text-white/85 text-sm font-medium leading-snug">{f.text}</p>
              </div>
            ))}
          </div>

          {/* Tarjeta demo */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.18)" }}
          >
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">Próximo turno</p>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0"
                style={{ background: "rgba(52,211,153,0.2)" }}
              >
                <span className="text-lg font-extrabold text-[#34D399] leading-none">23</span>
                <span className="text-[9px] font-bold text-[#34D399]/70 uppercase">May</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm leading-tight">María González</p>
                <p className="text-white/55 text-xs mt-0.5">Consulta nutricional · 14:30 hs</p>
              </div>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                style={{ background: "rgba(52,211,153,0.2)", color: "#34D399" }}
              >
                Confirmado
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs font-medium">
            Bookzi · Tu agenda inteligente para profesionales
          </p>
        </div>
      </div>

      {/* ── Panel derecho — Formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-white">

        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-2.5 mb-12">
          <BookziIcon size={32} />
          <span className="text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ letterSpacing: "-1px" }}>
            Book<span className="text-[var(--color-primary)]">zi</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          {/* Encabezado del form */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[var(--color-text-dark)] mb-2" style={{ letterSpacing: "-1px" }}>
              Ingresá a tu cuenta
            </h1>
            <p className="text-[var(--color-text-muted)] text-base">
              ¿No tenés cuenta?{" "}
              <a href="/register" className="text-[var(--color-primary)] font-bold hover:underline">
                Registrate gratis
              </a>
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-sm font-bold text-[var(--color-text-mid)]">
                  Contraseña
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-3 rounded-2xl px-4 py-4"
                style={{ background: "rgba(220,38,38,0.05)", border: "1.5px solid rgba(220,38,38,0.2)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm font-semibold text-[var(--color-error)] leading-snug">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-14 rounded-2xl font-bold text-white transition-all mt-1"
              style={{
                background: loading ? "#0369A1" : "linear-gradient(135deg, #0284C7, #0369A1)",
                fontSize: 15,
                boxShadow: loading ? "none" : "0 4px 20px rgba(2,132,199,0.4)",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? "Ingresando..." : "Ingresar a mi cuenta →"}
            </button>

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <p className="text-xs text-[var(--color-text-muted)] font-medium">o</p>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            <a
              href="/register"
              className="h-14 rounded-2xl font-bold text-[var(--color-primary)] transition-all text-center flex items-center justify-center text-[15px]"
              style={{ border: "1.5px solid var(--color-border)", background: "var(--color-bg)" }}
            >
              Crear cuenta gratis
            </a>
          </form>
        </div>

        <div className="mt-auto pt-12 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <BookziIcon size={14} />
          <p>Powered by <span className="font-bold text-[var(--color-primary)]">Bookzi</span></p>
        </div>
      </div>
    </div>
  )
}
