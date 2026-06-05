export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getReviewsForDashboard } from "@/lib/actions/reviews"
import Link from "next/link"

const TZ = "America/Argentina/Buenos_Aires"

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: TZ })
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sin calificación</span>
  return (
    <span style={{ letterSpacing: 1 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize: 16, opacity: n <= rating ? 1 : 0.15 }}>⭐</span>
      ))}
    </span>
  )
}

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const data = await getReviewsForDashboard()
  if (!data) redirect("/dashboard/setup")

  const submitted = data.filter(r => r.submittedAt)
  const pending   = data.filter(r => !r.submittedAt)

  const avg = submitted.length > 0
    ? (submitted.reduce((s, r) => s + (r.rating ?? 0), 0) / submitted.length).toFixed(1)
    : null

  const dist = [5,4,3,2,1].map(n => ({
    n,
    count: submitted.filter(r => r.rating === n).length,
  }))

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard" className="back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-dark)" }}>Reseñas</span>
        </div>
        {submitted.length > 0 && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
            {submitted.length} reseña{submitted.length !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      <div style={{ flex: 1, padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {data.length === 0 ? (
          <div style={{
            background: "white", borderRadius: 20, border: "1.5px solid var(--border)",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            padding: "56px 24px",
          }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>⭐</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-dark)", marginBottom: 8 }}>
              Todavía no hay reseñas
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 260 }}>
              Las solicitudes se envían automáticamente 1 hora después de que marcás un turno como completado.
            </p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            {submitted.length > 0 && (
              <div style={{
                background: "white", borderRadius: 20, border: "1.5px solid var(--border)",
                padding: "20px", marginBottom: 20,
              }}>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 40, fontWeight: 800, color: "var(--text-dark)", lineHeight: 1 }}>{avg}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>promedio</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {dist.map(({ n, count }) => (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", width: 8 }}>{n}</span>
                        <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            width: submitted.length > 0 ? `${(count / submitted.length) * 100}%` : "0%",
                            height: "100%", background: "var(--primary)", borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", width: 16, textAlign: "right" }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reseñas enviadas */}
            {submitted.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
                  Recibidas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {submitted.map(r => (
                    <div key={r.id} style={{
                      background: "white", borderRadius: 16, border: "1.5px solid var(--border)",
                      padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>{r.clientName}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.serviceName} · {fmtDate(r.startAt)}</div>
                        </div>
                        <Stars rating={r.rating} />
                      </div>
                      {r.comment && (
                        <p style={{
                          margin: "8px 0 0", fontSize: 13, color: "var(--text-mid)",
                          fontStyle: "italic", lineHeight: 1.5,
                          padding: "10px 12px", background: "#FAFAFA", borderRadius: 8,
                        }}>
                          "{r.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pendientes */}
            {pending.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
                  Solicitudes enviadas — sin respuesta
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {pending.map(r => (
                    <div key={r.id} style={{
                      background: "white", borderRadius: 12, border: "1.5px solid var(--border)",
                      padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-dark)" }}>{r.clientName}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.serviceName} · {fmtDate(r.startAt)}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, color: "#92400E", background: "#FEF3C7" }}>
                        Pendiente
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
