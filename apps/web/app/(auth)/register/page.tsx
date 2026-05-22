"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { BookziIcon } from "@/components/BookziLogo"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { business_name: businessName } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push("/onboarding/welcome")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — Hero ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #047857 0%, #059669 50%, #34D399 100%)" }}
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

        {/* Central */}
        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-3">Empezá gratis hoy</p>
            <h2 className="text-4xl font-extrabold text-white leading-tight" style={{ letterSpacing: "-1.5px" }}>
              Tu negocio merece una agenda que trabaje por vos
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "5 min", label: "para configurar tu agenda" },
              { value: "$0", label: "para empezar, sin límites" },
              { value: "24/7", label: "reservas online automáticas" },
              { value: "∞", label: "clientes en tu negocio" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.18)" }}
              >
                <p className="text-3xl font-extrabold text-white leading-none mb-1">{s.value}</p>
                <p className="text-white/55 text-xs font-medium leading-snug">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Categorías rápidas */}
          <div className="flex flex-wrap gap-2">
            {["Peluquería", "Psicología", "Pádel", "Gimnasio", "Nutrición", "Tenis"].map((c) => (
              <span
                key={c}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs font-medium">
            Al registrarte aceptás nuestros Términos de Servicio y Política de Privacidad.
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
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[var(--color-text-dark)] mb-2" style={{ letterSpacing: "-1px" }}>
              Creá tu cuenta gratis
            </h1>
            <p className="text-[var(--color-text-muted)] text-base">
              ¿Ya tenés cuenta?{" "}
              <a href="/login" className="text-[var(--color-primary)] font-bold hover:underline">
                Ingresá acá
              </a>
            </p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                Nombre de tu negocio
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Peluquería Sol"
                autoComplete="organization"
              />
            </div>

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
              <label className="block text-sm font-bold text-[var(--color-text-mid)] mb-2.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-2 font-medium">Al menos 8 caracteres</p>
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
                background: loading ? "#047857" : "linear-gradient(135deg, #059669, #047857)",
                fontSize: 15,
                boxShadow: loading ? "none" : "0 4px 20px rgba(5,150,105,0.4)",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? "Creando tu cuenta..." : "Crear cuenta gratis →"}
            </button>

            <p className="text-xs text-[var(--color-text-muted)] text-center leading-relaxed">
              Sin tarjeta de crédito · Sin contratos · Gratis para empezar
            </p>
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
