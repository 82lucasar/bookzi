export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getClients } from "@/lib/actions/clients"
import Link from "next/link"

const TZ = "America/Argentina/Buenos_Aires"

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")
}

function relativeDate(d: Date | string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return "hoy"
  if (diff === 1) return "ayer"
  if (diff < 30) return `hace ${diff} días`
  if (diff < 365) return `hace ${Math.floor(diff / 30)} mes${Math.floor(diff / 30) > 1 ? "es" : ""}`
  return new Date(d).toLocaleDateString("es-AR", { month: "short", year: "numeric", timeZone: TZ })
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const clientList = await getClients()
  if (!clientList) redirect("/dashboard/setup")

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Clientes</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
          {clientList.length} {clientList.length === 1 ? "cliente" : "clientes"}
        </span>
      </header>

      <div style={{ flex: 1, padding: "20px 16px 100px", display: "flex", flexDirection: "column", gap: 10, maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {clientList.length === 0 ? (
          <div style={{
            background: "white", borderRadius: 20, border: "1.5px solid var(--border)",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            padding: "56px 24px",
          }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#0284C7" strokeWidth="1.8"/>
                <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-dark)", marginBottom: 8 }}>
              Todavía no tenés clientes
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 260 }}>
              Los clientes aparecen acá automáticamente cuando alguien reserva un turno.
            </p>
          </div>
        ) : (
          clientList.map(client => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{
                background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
                padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, color: "var(--primary)",
                }}>
                  {initials(client.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-dark)", marginBottom: 3 }}>
                    {client.name}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {client.phone && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{client.phone}</span>
                    )}
                    {client.phone && (
                      <span style={{ fontSize: 12, color: "var(--border)" }}>·</span>
                    )}
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {client.total} turno{client.total !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--border)" }}>·</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {relativeDate(client.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M6 4l4 4-4 4" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
