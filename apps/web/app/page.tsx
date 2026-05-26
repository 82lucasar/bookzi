import { BookziIcon } from "@/components/BookziLogo"
import AuthHashRedirect from "@/components/AuthHashRedirect"

const CATEGORIES = [
  { icon: "✂️",  label: "Peluquería" },
  { icon: "💆",  label: "Estética" },
  { icon: "🦷",  label: "Odontología" },
  { icon: "🧠",  label: "Psicología" },
  { icon: "🏋️",  label: "Gimnasio" },
  { icon: "🎾",  label: "Pádel / Tenis" },
  { icon: "⚽",  label: "Fútbol" },
  { icon: "🥗",  label: "Nutrición" },
  { icon: "💼",  label: "Consultoría" },
]

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Creá tu cuenta",
    desc: "Registrate gratis en 2 minutos. Sin tarjeta de crédito ni contratos.",
    color: "#0284C7",
    bg: "rgba(2,132,199,0.08)",
  },
  {
    step: "02",
    title: "Configurá tus servicios",
    desc: "Agregá tus servicios, precios, duración y horarios de atención.",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    step: "03",
    title: "Compartí tu link y listo",
    desc: "Tus clientes reservan solos. Vos recibís notificaciones en tiempo real.",
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
  },
]

const FEATURES = [
  {
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#0284C7" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Reservas online 24/7",
    desc: "Tus clientes eligen servicio, fecha y horario desde el celular — sin llamadas ni mensajes de WhatsApp.",
    color: "rgba(2,132,199,0.08)",
    border: "rgba(2,132,199,0.15)",
  },
  {
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Recordatorios automáticos",
    desc: "Confirmaciones y recordatorios por WhatsApp para que nadie falte sin avisarte.",
    color: "rgba(5,150,105,0.08)",
    border: "rgba(5,150,105,0.15)",
  },
  {
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Control total",
    desc: "Gestioná tu agenda, servicios y clientes desde una sola pantalla, en tu celular o PC.",
    color: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.15)",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <AuthHashRedirect />

      {/* ── Navbar ── */}
      <nav
        className="bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20"
        style={{ borderBottom: "1.5px solid var(--color-border)" }}
      >
        <a href="/" className="flex items-center gap-2.5">
          <BookziIcon size={30} />
          <span className="font-extrabold text-[var(--color-text-dark)] text-xl" style={{ letterSpacing: "-0.5px" }}>
            Book<span className="text-[var(--color-primary)]">zi</span>
          </span>
        </a>
        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="text-sm font-semibold text-[var(--color-text-mid)] hover:text-[var(--color-primary)] transition-colors px-4 py-2.5 rounded-xl hover:bg-[var(--color-bg)]"
          >
            Ingresar
          </a>
          <a
            href="/register"
            className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #0284C7, #0369A1)", boxShadow: "0 2px 10px rgba(2,132,199,0.35)" }}
          >
            Empezar gratis
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0369A1 0%, #0284C7 50%, #0EA5E9 100%)", minHeight: "88vh" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, white 0%, transparent 60%)" }} />
        </div>

        <div
          className="relative z-10 mb-8 w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "white", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}
        >
          <BookziIcon size={52} />
        </div>

        <div
          className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold"
          style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.9)" }}
        >
          <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
          Gratis para empezar · Sin tarjeta de crédito
        </div>

        <h1
          className="relative z-10 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 max-w-3xl"
          style={{ letterSpacing: "-2.5px", lineHeight: 1.05 }}
        >
          Tu agenda inteligente para profesionales
        </h1>

        <p className="relative z-10 text-xl text-white/80 mb-10 max-w-lg leading-relaxed">
          Recibí reservas online 24/7, confirmá turnos en un toque y eliminá ausencias con recordatorios automáticos.
        </p>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
          <a
            href="/register"
            className="px-8 py-4 rounded-2xl font-bold text-[var(--color-primary)] text-base transition-all hover:shadow-xl hover:scale-[1.02]"
            style={{ background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
          >
            Empezar gratis — sin tarjeta
          </a>
          <a
            href="/login"
            className="px-8 py-4 rounded-2xl font-bold text-white text-base border hover:bg-white/10 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
          >
            Ya tengo cuenta →
          </a>
        </div>

        <div className="relative z-10 mt-16 flex items-center gap-3 text-white/50">
          <div className="h-px w-16 bg-white/20" />
          <p className="text-xs font-semibold uppercase tracking-widest">Para todo tipo de negocio</p>
          <div className="h-px w-16 bg-white/20" />
        </div>
      </section>

      {/* ── Categorías ── */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-[var(--color-text-dark)] mb-3" style={{ letterSpacing: "-0.8px" }}>
              Diseñado para tu rubro
            </h2>
            <p className="text-[var(--color-text-muted)] max-w-sm mx-auto">
              Bookzi funciona para cualquier profesional o negocio que trabaje con turnos.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.label}
                href="/register"
                className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border text-center transition-all hover:border-[var(--color-primary)] hover:shadow-md hover:shadow-sky-100 group"
                style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-[11px] font-bold text-[var(--color-text-muted)] leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                  {cat.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="px-6 py-20 bg-[var(--color-bg)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span
              className="inline-flex items-center text-xs font-extrabold uppercase tracking-widest px-4 py-2 rounded-full mb-5"
              style={{ background: "rgba(2,132,199,0.08)", color: "var(--color-primary)" }}
            >
              Cómo funciona
            </span>
            <h2 className="text-3xl font-extrabold text-[var(--color-text-dark)]" style={{ letterSpacing: "-1px" }}>
              En 3 pasos, tu agenda online
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-full w-full h-px -ml-6 z-0"
                    style={{ background: "linear-gradient(90deg, var(--color-border), transparent)" }} />
                )}
                <div
                  className="relative z-10 bg-white rounded-3xl p-7 border h-full"
                  style={{ borderColor: step.bg.replace("0.08", "0.2") }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: step.bg }}
                  >
                    <span className="text-2xl font-extrabold" style={{ color: step.color }}>
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-[var(--color-text-dark)] text-lg mb-2" style={{ letterSpacing: "-0.4px" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span
              className="inline-flex items-center text-xs font-extrabold uppercase tracking-widest px-4 py-2 rounded-full mb-5"
              style={{ background: "rgba(5,150,105,0.08)", color: "var(--color-accent)" }}
            >
              ¿Por qué Bookzi?
            </span>
            <h2 className="text-3xl font-extrabold text-[var(--color-text-dark)] mb-4" style={{ letterSpacing: "-1px" }}>
              Todo lo que necesitás para gestionar tu agenda
            </h2>
            <p className="text-[var(--color-text-muted)] max-w-lg mx-auto leading-relaxed">
              Sin complejidad ni contratos. Empezás en 5 minutos y tus clientes reservan solos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl p-7 border hover:shadow-lg transition-shadow"
                style={{ borderColor: f.border, background: f.color }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-white"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                >
                  {f.icon}
                </div>
                <h3 className="font-extrabold text-[var(--color-text-dark)] text-lg mb-3" style={{ letterSpacing: "-0.4px" }}>
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section
        className="px-6 py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0369A1 0%, #0284C7 55%, #0EA5E9 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        </div>
        <div className="max-w-xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-6">
            <BookziIcon size={38} />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4" style={{ letterSpacing: "-1px" }}>
            Empezá hoy, gratis
          </h2>
          <p className="text-white/75 mb-10 leading-relaxed text-lg">
            Sin tarjeta de crédito. Sin contratos. En 5 minutos tenés tu agenda online funcionando.
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-[var(--color-primary)] text-base transition-all hover:shadow-xl hover:scale-[1.02]"
            style={{ background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
          >
            Crear mi cuenta gratis →
          </a>
          <p className="text-white/50 text-sm mt-6 font-medium">Gratis para siempre · Sin límites de reservas</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10 border-t border-[var(--color-border)]" style={{ background: "var(--color-text-dark)" }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BookziIcon size={24} />
            <span className="font-extrabold text-white text-lg" style={{ letterSpacing: "-0.5px" }}>
              Book<span className="text-[var(--color-primary-light)]">zi</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="/login" className="hover:text-white/70 transition-colors">Ingresar</a>
            <a href="/register" className="hover:text-white/70 transition-colors">Registro</a>
          </div>
          <p className="text-sm text-white/30 font-medium">© 2025 Bookzi</p>
        </div>
      </footer>
    </div>
  )
}
