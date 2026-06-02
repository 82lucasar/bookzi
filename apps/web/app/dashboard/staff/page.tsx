export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStaff } from "@/lib/actions/staff"
import Link from "next/link"

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const staffList = await getStaff()

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard/profile" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Colaboradores</span>
        </div>
        <Link href="/dashboard/staff/new" style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 14, fontWeight: 700, color: "var(--primary)", textDecoration: "none",
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Agregar
        </Link>
      </header>

      <div style={{ flex: 1, padding: "20px 16px 100px", display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {staffList.length === 0 ? (
          <div style={{
            background: "white", borderRadius: 20, border: "1.5px solid var(--border)",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            padding: "48px 24px",
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>👥</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-dark)", marginBottom: 8 }}>
              No hay colaboradores todavía
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 260, marginBottom: 20 }}>
              Agregá espacios o colaboradores para gestionar agendas individuales.
            </p>
            <Link href="/dashboard/staff/new">
              <button className="btn btn-primary">+ Agregar colaborador</button>
            </Link>
          </div>
        ) : (
          <>
            {staffList.map(s => (
              <div key={s.id} style={{
                background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
                overflow: "hidden",
              }}>
                {/* Row principal */}
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: s.isActive
                      ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)"
                      : "var(--bg-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: s.isActive ? "white" : "var(--text-muted)",
                  }}>
                    {s.name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, color: s.isActive ? "var(--accent)" : "var(--text-muted)", fontWeight: 600 }}>
                      {s.isActive ? "Activo" : "Inactivo"}
                    </div>
                  </div>
                  <Link href={`/dashboard/staff/${s.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      padding: "6px 12px", borderRadius: 8,
                      background: "var(--bg-muted)", fontSize: 13, fontWeight: 600, color: "var(--primary)",
                    }}>
                      Editar
                    </div>
                  </Link>
                </div>

                {/* Acciones rápidas */}
                <div style={{ borderTop: "1px solid var(--border)", display: "flex" }}>
                  <Link href={`/dashboard/staff/${s.id}/availability`} style={{
                    flex: 1, textDecoration: "none",
                    padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                    borderRight: "1px solid var(--border)",
                  }}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <rect x="1" y="2.5" width="13" height="10.5" rx="2" stroke="var(--primary)" strokeWidth="1.3"/>
                      <path d="M4 1v2M11 1v2M1 6.5h13" stroke="var(--primary)" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>Disponibilidad</span>
                  </Link>
                  <Link href={`/dashboard/analytics/staff/${s.id}`} style={{
                    flex: 1, textDecoration: "none",
                    padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <rect x="1" y="8" width="3" height="6" rx="1" fill="var(--text-muted)"/>
                      <rect x="6" y="5" width="3" height="9" rx="1" fill="var(--primary)"/>
                      <rect x="11" y="2" width="3" height="12" rx="1" fill="var(--text-muted)"/>
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Métricas</span>
                  </Link>
                </div>
              </div>
            ))}

            <Link href="/dashboard/staff/new" style={{ textDecoration: "none" }}>
              <div style={{
                background: "white", borderRadius: 16, border: "1.5px dashed var(--border)",
                padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: "pointer",
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>Agregar colaborador</span>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
