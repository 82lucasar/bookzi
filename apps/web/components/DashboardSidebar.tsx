"use client"

import { usePathname } from "next/navigation"
import { BookziIcon } from "./BookziLogo"

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Inicio",
    exact: true,
    icon: (active: boolean) => (
      <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/appointments",
    label: "Turnos",
    exact: false,
    icon: (active: boolean) => (
      <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/services",
    label: "Servicios",
    exact: false,
    icon: (active: boolean) => (
      <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/dashboard/availability",
    label: "Horarios",
    exact: false,
    icon: (active: boolean) => (
      <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function DashboardSidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname()
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  const initial = businessName.charAt(0).toUpperCase()

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-[var(--color-border)] fixed top-0 left-0 z-30">

        {/* Logo + wordmark */}
        <div className="px-6 pt-7 pb-5 border-b border-[var(--color-border)]">
          <a href="/dashboard" className="flex items-center gap-3 mb-5">
            <BookziIcon size={30} />
            <span className="font-extrabold text-[var(--color-text-dark)] text-[19px]" style={{ letterSpacing: "-0.5px" }}>
              Book<span className="text-[var(--color-primary)]">zi</span>
            </span>
          </a>

          {/* Business identity */}
          <div
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border"
            style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-white text-sm"
              style={{ background: "linear-gradient(135deg, #0284C7, #0369A1)" }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--color-text-dark)] truncate leading-tight">{businessName}</p>
              <p className="text-[10px] font-semibold text-[var(--color-accent)] mt-0.5">Plan Gratuito</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-5 flex flex-col gap-1">
          <p className="text-[10px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-widest px-3 mb-3">
            Navegación
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  active
                    ? "text-white"
                    : "text-[var(--color-text-mid)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]"
                }`}
                style={active ? {
                  background: "linear-gradient(135deg, #0284C7, #0369A1)",
                  boxShadow: "0 4px 12px rgba(2,132,199,0.3)",
                } : undefined}
              >
                {item.icon(active)}
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-6 border-t border-[var(--color-border)] pt-4">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-[var(--color-text-muted)] hover:bg-red-50 hover:text-[var(--color-error)] transition-all w-full"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden bg-white border-b border-[var(--color-border)] px-5 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <a href="/dashboard" className="flex items-center gap-2.5">
          <BookziIcon size={26} />
          <span className="font-extrabold text-[var(--color-text-dark)] text-[17px]" style={{ letterSpacing: "-0.5px" }}>
            Book<span className="text-[var(--color-primary)]">zi</span>
          </span>
        </a>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-border)" }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold text-white"
            style={{ background: "linear-gradient(135deg, #0284C7, #0369A1)" }}
          >
            {initial}
          </div>
          <span className="text-xs font-bold text-[var(--color-text-mid)] truncate max-w-[120px]">{businessName}</span>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex"
        style={{ background: "white", borderTop: "1.5px solid var(--color-border)" }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
              style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
            >
              {item.icon(active)}
              <span className="text-[9px] font-bold uppercase tracking-wide">{item.label}</span>
              {active && (
                <span
                  className="absolute bottom-0 w-6 h-0.5 rounded-t-full"
                  style={{ background: "var(--color-primary)" }}
                />
              )}
            </a>
          )
        })}
      </nav>
    </>
  )
}
