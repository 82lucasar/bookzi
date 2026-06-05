export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWaitlistForProfessional, notifyWaitlistEntry } from "@/lib/actions/waitlist"
import Link from "next/link"

const TZ = "America/Argentina/Buenos_Aires"

function fmtDate(d: string) {
  return new Date(d + "T12:00:00")
    .toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: TZ })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  waiting:  { label: "En espera",  color: "#92400E", bg: "#FEF3C7" },
  notified: { label: "Notificado", color: "#1E40AF", bg: "#DBEAFE" },
  booked:   { label: "Reservó",    color: "#065F46", bg: "#D1FAE5" },
  expired:  { label: "Expirado",   color: "#64748B", bg: "#F1F5F9" },
}

export default async function WaitlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const entries = await getWaitlistForProfessional()
  if (!entries) redirect("/dashboard/setup")

  const waiting  = entries.filter(e => e.status === "waiting")
  const notified = entries.filter(e => e.status === "notified")
  const rest     = entries.filter(e => e.status !== "waiting" && e.status !== "notified")

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Lista de espera</span>
        </div>
        {waiting.length > 0 && (
          <span style={{ background: "var(--primary)", color: "white", borderRadius: 100, fontSize: 12, fontWeight: 700, padding: "3px 10px" }}>
            {waiting.length} en espera
          </span>
        )}
      </header>

      <div style={{ flex: 1, padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {entries.length === 0 ? (
          <div style={{
            background: "white", borderRadius: 20, border: "1.5px solid var(--border)",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            padding: "56px 24px",
          }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#0284C7" strokeWidth="1.8"/>
                <path d="M12 7v5l3 3" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-dark)", marginBottom: 8 }}>
              Lista de espera vacía
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 260 }}>
              Cuando un día esté completo, los clientes pueden anotarse en lista de espera desde tu link de reservas.
            </p>
          </div>
        ) : (
          <>
            {/* Activos */}
            {[...waiting, ...notified].length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
                  Activos
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...waiting, ...notified].map(entry => {
                    const st = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG["waiting"]!
                    const canNotify = entry.status === "waiting"
                    return (
                      <div key={entry.id} style={{
                        background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
                        padding: "14px 16px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-dark)" }}>{entry.clientName}</div>
                            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{entry.clientPhone}</div>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                            color: st.color, background: st.bg,
                          }}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: canNotify ? 12 : 0 }}>
                          {entry.serviceName} · {fmtDate(entry.requestedDate)}
                        </div>
                        {canNotify && (
                          <form action={notifyWaitlistEntry.bind(null, entry.id)}>
                            <button type="submit" style={{
                              width: "100%", padding: "10px", borderRadius: 10,
                              background: "var(--primary)", color: "white",
                              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
                            }}>
                              Notificar por email
                            </button>
                          </form>
                        )}
                        {entry.status === "notified" && entry.expiresAt && (
                          <div style={{ fontSize: 12, color: "#1E40AF", fontWeight: 600 }}>
                            Tiene 30 min para reservar · Expira: {new Date(entry.expiresAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })} hs
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Histórico */}
            {rest.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
                  Historial
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {rest.map(entry => {
                    const st = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG["expired"]!
                    return (
                      <div key={entry.id} style={{
                        background: "white", borderRadius: 14, border: "1.5px solid var(--border)",
                        padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dark)" }}>{entry.clientName}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{entry.serviceName} · {fmtDate(entry.requestedDate)}</div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                          color: st.color, background: st.bg, whiteSpace: "nowrap",
                        }}>{st.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
