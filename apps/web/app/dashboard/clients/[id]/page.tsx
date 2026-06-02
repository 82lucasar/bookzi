export const dynamic = "force-dynamic"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getClientWithHistory, updateClientNotes } from "@/lib/actions/clients"
import Link from "next/link"

const TZ = "America/Argentina/Buenos_Aires"

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "short", day: "numeric", month: "short", timeZone: TZ,
  })
}

function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })
}

function fmtPrice(amount: string | null, currency: string | null) {
  if (!amount) return null
  return `$${Number(amount).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pendiente",    color: "#92400E", bg: "#FEF3C7" },
  confirmed:   { label: "Confirmado",   color: "#065F46", bg: "#D1FAE5" },
  completed:   { label: "Completado",   color: "#1E40AF", bg: "#DBEAFE" },
  cancelled:   { label: "Cancelado",    color: "#991B1B", bg: "#FEE2E2" },
  rescheduled: { label: "Reprogramado", color: "#4C1D95", bg: "#EDE9FE" },
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { id } = await params
  const data = await getClientWithHistory(id)
  if (!data) notFound()

  const { client, history, totalSpent } = data

  const completed  = history.filter(a => a.status === "completed").length
  const upcoming   = history.filter(a => a.status === "confirmed" && new Date(a.startAt) > new Date()).length
  const cancelled  = history.filter(a => a.status === "cancelled").length

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard/clients" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Ficha de cliente</span>
        </div>
        {client.phone && (
          <a
            href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "#25D366", textDecoration: "none" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.76.46 3.41 1.26 4.85L2 22l5.28-1.24A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.7 14.31c-.2.56-1.16 1.07-1.6 1.13-.41.06-.93.09-1.5-.09a13.7 13.7 0 0 1-1.35-.5c-2.38-1.02-3.93-3.41-4.05-3.57-.11-.16-.94-1.25-.94-2.38s.59-1.69.81-1.92c.21-.23.46-.29.61-.29l.44.01c.14 0 .33-.05.52.4l.72 1.8c.07.17.02.37-.1.52l-.4.52-.14.2c.14.23.54.87 1.17 1.43.8.72 1.47.94 1.67 1.05.2.11.32.09.44-.05l.47-.55c.12-.14.31-.2.49-.13l1.81.85c.18.08.3.12.32.2.03.1-.01.53-.2 1.09z"/>
            </svg>
          </a>
        )}
      </header>

      <div style={{ flex: 1, padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {/* Avatar + nombre */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 800, color: "var(--primary)",
          }}>
            {initials(client.name)}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-dark)" }}>{client.name}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {client.phone && (
              <a href={`tel:${client.phone}`} style={{ fontSize: 14, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                {client.phone}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>
                {client.email}
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Completados",  value: completed,             color: "#059669" },
            { label: "Próximos",     value: upcoming,              color: "#0284C7" },
            { label: "Cancelados",   value: cancelled,             color: "#DC2626" },
          ].map(s => (
            <div key={s.label} style={{
              background: "white", borderRadius: 14, border: "1.5px solid var(--border)",
              padding: "14px 12px", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {totalSpent > 0 && (
          <div style={{
            background: "white", borderRadius: 14, border: "1.5px solid var(--border)",
            padding: "14px 16px", marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>Total gastado</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>
              ${totalSpent.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}

        {/* Notas */}
        <div style={{
          background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
          padding: "16px", marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
            Notas internas
          </div>
          <form action={updateClientNotes.bind(null, client.id)}>
            <textarea
              name="notes"
              defaultValue={client.notes ?? ""}
              placeholder="Preferencias, alergias, observaciones…"
              rows={3}
              style={{
                width: "100%", border: "1.5px solid var(--border)", borderRadius: 10,
                padding: "10px 12px", fontSize: 14, fontFamily: "inherit",
                color: "var(--text-dark)", background: "#FAFAFA", resize: "vertical",
                outline: "none", boxSizing: "border-box",
              }}
            />
            <button type="submit" style={{
              marginTop: 10, background: "var(--primary)", color: "white",
              border: "none", borderRadius: 10, padding: "9px 18px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              Guardar notas
            </button>
          </form>
        </div>

        {/* Historial */}
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-dark)", marginBottom: 12 }}>
          Historial de turnos
        </div>

        {history.length === 0 ? (
          <div style={{
            background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
            padding: "32px 24px", textAlign: "center",
            fontSize: 14, color: "var(--text-muted)",
          }}>
            Sin historial todavía
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map(appt => {
              const st = STATUS_LABEL[appt.status] ?? STATUS_LABEL["pending"]!
              const price = fmtPrice(appt.priceSnapshot, appt.currencySnapshot)
              return (
                <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "white", borderRadius: 14, border: "1.5px solid var(--border)",
                    padding: "13px 14px",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 }}>
                        {appt.serviceName}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {fmtDate(appt.startAt)} · {fmtTime(appt.startAt)}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                        color: st.color, background: st.bg,
                      }}>
                        {st.label}
                      </span>
                      {price && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dark)" }}>{price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
