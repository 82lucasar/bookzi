import { notFound } from "next/navigation"
import { getBookingBusiness } from "@/lib/actions/booking"

export const dynamic = "force-dynamic"

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getBookingBusiness(slug)
  if (!data) notFound()

  const { business, services } = data

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>

      {/* Header del negocio */}
      <div className="pub-header">
        <div className="pub-avatar-wrap">{initials(business.name)}</div>
        <div className="pub-name">{business.name}</div>
        {business.category && (
          <div className="pub-role">{business.category}</div>
        )}
        <div className="pub-meta">
          <span className="pub-meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.3"/>
              <path d="M6 3v3.5l2 1" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Confirmación inmediata
          </span>
        </div>
      </div>

      <div className="page-body">

        {services.length === 0 ? (
          <div style={{
            background: "white", borderRadius: 20, padding: "48px 24px",
            textAlign: "center", border: "1.5px solid var(--border)",
          }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📋</p>
            <p style={{ fontWeight: 700, color: "var(--text-dark)", marginBottom: 8 }}>
              Sin servicios disponibles
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Este negocio aún no tiene servicios configurados.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 style={{
                fontSize: 20, fontWeight: 800, color: "var(--text-dark)",
                letterSpacing: "-0.4px", marginBottom: 6,
              }}>
                ¿Qué servicio necesitás?
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Seleccioná un servicio para ver los horarios disponibles.
              </p>
            </div>

            <div className="service-cards">
              {services.map((svc) => (
                <a key={svc.id} href={`/book/${slug}/${svc.id}`} style={{ textDecoration: "none" }}>
                  <div className="service-card">
                    <div className="service-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6"/>
                        <path d="M10 6v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="service-info">
                      <div className="service-card-name">{svc.name}</div>
                      <div className="service-card-meta">
                        {formatDuration(svc.durationMinutes)}
                        {svc.description ? ` · ${svc.description}` : ""}
                      </div>
                    </div>
                    {svc.price && (
                      <div className="service-price" style={{ color: "var(--accent)" }}>
                        ${Number(svc.price).toLocaleString("es-AR")}
                      </div>
                    )}
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      style={{ flexShrink: 0, color: "var(--text-muted)" }}
                    >
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        <div style={{
          textAlign: "center", paddingTop: 8, fontSize: 12,
          color: "var(--text-muted)", display: "flex",
          alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          Reservas gestionadas por{" "}
          <a href="/" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
            Bookzi
          </a>
        </div>

      </div>
    </div>
  )
}
