"use client"

import { usePathname } from "next/navigation"

const NAV = [
  {
    href: "/dashboard",
    label: "Inicio",
    exact: true,
    icon: (active: boolean) => (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6.5" height="6.5" rx="2" fill="currentColor"/>
        <rect x="10.5" y="1" width="6.5" height="6.5" rx="2" fill="currentColor" opacity={active ? 1 : .45}/>
        <rect x="1" y="10.5" width="6.5" height="6.5" rx="2" fill="currentColor" opacity={active ? 1 : .45}/>
        <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="2" fill="currentColor" opacity={active ? 1 : .45}/>
      </svg>
    ),
  },
  {
    href: "/dashboard/agenda",
    label: "Agenda",
    exact: false,
    icon: () => (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="1" y="3" width="16" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 1v3M13 1v3M1 8h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/appointments",
    label: "Turnos",
    exact: false,
    icon: () => (
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M2 5h14M2 9h9M2 13h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    label: "Perfil",
    exact: false,
    icon: () => (
      <svg viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1.5 16c0-3 3.4-5.5 7.5-5.5s7.5 2.5 7.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function DashboardSidebar({
  businessName,
  businessCategory,
}: {
  businessName: string
  businessCategory?: string | null
}) {
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">B</div>
          <span className="sidebar-logo-text">Bookzi</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <a
                key={item.href}
                href={item.href}
                className={`sidebar-link${active ? " active" : ""}`}
              >
                {item.icon(active)}
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="dash-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
            {initials}
          </div>
          <div>
            <div className="sidebar-profile-name">{businessName}</div>
            <div className="sidebar-profile-role">{businessCategory ?? "Profesional"}</div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="bottom-nav">
        {NAV.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <a
              key={item.href}
              href={item.href}
              className={`nav-item${active ? " active" : ""}`}
            >
              {item.icon(active)}
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>
    </>
  )
}
