import { getAppointmentPublic } from "@/lib/actions/booking"

export const dynamic = "force-dynamic"

const TZ = "America/Argentina/Buenos_Aires"

function formatDateTime(date: Date) {
  const dateStr = date.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", timeZone: TZ,
  })
  const timeStr = date.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })
  return { dateStr, timeStr }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ── Página de reserva recibida (status: pending) ──────────────────────────────
function PendingPage({
  appt,
}: {
  appt: {
    id: string
    status: string
    startAt: Date
    endAt: Date
    serviceName: string
    clientName: string
    businessName: string
    priceSnapshot: string | null
    paymentProofUrl: string | null
  }
}) {
  const { dateStr, timeStr } = formatDateTime(new Date(appt.startAt))
  const endTime = new Date(appt.endAt).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="confirm-page">

        {/* Banner ámbar */}
        <div style={{
          background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
          padding: "40px 28px 32px", textAlign: "center",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -50, right: -50,
            width: 180, height: 180, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }} />
          {/* Ícono reloj */}
          <div className="check-wrap" style={{ background: "rgba(255,255,255,0.2)" }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="9"/>
              <path strokeLinecap="round" d="M12 7v5l3 3"/>
            </svg>
          </div>
          <h1 className="confirm-title">¡Reserva recibida!</h1>
          <p className="confirm-sub">
            Tu comprobante está siendo verificado. {appt.businessName} confirmará tu turno en breve.
          </p>
        </div>

        {/* Detail card */}
        <div className="detail-card">
          <div className="detail-row">
            <div className="detail-icon blue">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M2 18c0-3.5 3.6-6 8-6s8 2.5 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="detail-label">Profesional / Negocio</div>
              <div className="detail-val">{appt.businessName}</div>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-icon green">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="1.5" y="3" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M6 1.5v3M14 1.5v3M1.5 9h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="detail-label">Fecha y hora</div>
              <div className="detail-val">{capitalize(dateStr)} · {timeStr} — {endTime}</div>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#B45309" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M10 6v4.5l3 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="detail-label">Servicio</div>
              <div className="detail-val">{appt.serviceName}</div>
            </div>
          </div>
          {appt.priceSnapshot && (
            <div className="detail-row">
              <div className="detail-icon" style={{ background: "rgba(5,150,105,0.1)", color: "var(--accent)" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2v1.5M10 16.5V18M4.2 4.2l1.1 1.1M14.7 14.7l1.1 1.1M2 10h1.5M16.5 10H18M4.2 15.8l1.1-1.1M14.7 5.3l1.1-1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div>
                <div className="detail-label">Monto</div>
                <div className="detail-val" style={{ color: "var(--accent)" }}>
                  ${Number(appt.priceSnapshot).toLocaleString("es-AR")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Aviso */}
        <div className="notif-notice" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="notif-icon" style={{ color: "#B45309" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 6v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="notif-text">
            <strong>Pendiente de verificación.</strong>{" "}
            Una vez que el profesional revise tu comprobante, recibirás la confirmación por WhatsApp o email.
          </div>
        </div>

        {/* Powered */}
        <div style={{ textAlign: "center", padding: "24px 0 40px", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          Reservas gestionadas por{" "}
          <a href="/" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Bookzi</a>
        </div>

      </div>
    </div>
  )
}

// ── Página de turno confirmado (status: confirmed) ────────────────────────────
function ConfirmedView({
  appt,
}: {
  appt: {
    id: string
    status: string
    startAt: Date
    endAt: Date
    serviceName: string
    clientName: string
    businessName: string
    priceSnapshot: string | null
    paymentProofUrl: string | null
  }
}) {
  const startDate = new Date(appt.startAt)
  const { dateStr, timeStr } = formatDateTime(startDate)
  const endTime = new Date(appt.endAt).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })

  const calendarUrl = [
    "https://calendar.google.com/calendar/render?action=TEMPLATE",
    `&text=${encodeURIComponent(`Turno en ${appt.businessName}`)}`,
    `&dates=${startDate.toISOString().replace(/[-:]/g,"").replace(".000","")}/${new Date(appt.endAt).toISOString().replace(/[-:]/g,"").replace(".000","")}`,
    `&details=${encodeURIComponent(`${appt.serviceName} — ${appt.businessName}`)}`,
  ].join("")

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="confirm-page">

        {/* Banner verde */}
        <div className="confirm-banner">
          <div className="check-wrap">
            <svg viewBox="0 0 32 32" fill="none" style={{ width: 32, height: 32 }}>
              <path
                d="M6 16l7 7 13-14"
                stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 36, strokeDashoffset: 36, animation: "drawC 0.5s ease-out 0.3s forwards" }}
              />
            </svg>
          </div>
          <h1 className="confirm-title">¡Turno confirmado!</h1>
          <p className="confirm-sub">
            {appt.businessName} confirmó tu reserva. ¡Nos vemos pronto!
          </p>
        </div>

        {/* Detail card */}
        <div className="detail-card">
          <div className="detail-row">
            <div className="detail-icon blue">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M2 18c0-3.5 3.6-6 8-6s8 2.5 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="detail-label">Profesional / Negocio</div>
              <div className="detail-val">{appt.businessName}</div>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-icon green">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="1.5" y="3" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M6 1.5v3M14 1.5v3M1.5 9h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="detail-label">Fecha y hora</div>
              <div className="detail-val">{capitalize(dateStr)} · {timeStr} — {endTime}</div>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#B45309" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M10 6v4.5l3 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="detail-label">Servicio</div>
              <div className="detail-val">{appt.serviceName}</div>
            </div>
          </div>
          {appt.priceSnapshot && (
            <div className="detail-row">
              <div className="detail-icon" style={{ background: "rgba(5,150,105,0.1)", color: "var(--accent)" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M7 7h4.5a2.5 2.5 0 010 5H7m0 0h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="detail-label">Precio</div>
                <div className="detail-val" style={{ color: "var(--accent)" }}>
                  ${Number(appt.priceSnapshot).toLocaleString("es-AR")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp notice */}
        <div className="notif-notice">
          <div className="notif-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1C5.13 1 2 4.13 2 8c0 .73.19 1.41.52 2.01L2 16l5.99-.52A6.96 6.96 0 009 16c3.87 0 7-3.13 7-7s-3.13-8-7-8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <div className="notif-text">
            <strong>¡Turno confirmado!</strong>{" "}
            Si necesitás cancelar o reprogramar, contactá directamente al profesional.
          </div>
        </div>

        {/* Agregar al calendario */}
        <a href={calendarUrl} target="_blank" rel="noreferrer" className="cal-add">
          <div className="cal-add-left">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.08)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="2.5" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 1v3M13 1v3M1 8h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <div className="cal-add-text">Agregar al calendario</div>
              <div className="cal-add-sub">Google Calendar</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#64748B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>

        {/* Powered */}
        <div style={{ textAlign: "center", padding: "24px 0 40px", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          Reservas gestionadas por{" "}
          <a href="/" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Bookzi</a>
        </div>

      </div>

      <style>{`@keyframes drawC { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  )
}

// ── Fallback genérico ─────────────────────────────────────────────────────────
function FallbackPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(2,132,199,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#0284C7" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", margin: "0 0 10px", letterSpacing: "-0.4px" }}>
        ¡Reserva enviada!
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 300, margin: "0 auto 28px" }}>
        Tu solicitud de turno fue recibida. El profesional te confirmará en breve.
      </p>
      <a
        href="/"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "var(--primary)", color: "white",
          padding: "12px 24px", borderRadius: 12,
          fontSize: 14, fontWeight: 700, textDecoration: "none",
        }}
      >
        Volver al inicio
      </a>
    </div>
  )
}

// ── Export principal ──────────────────────────────────────────────────────────
export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  if (!id) return <FallbackPage />

  const appt = await getAppointmentPublic(id)
  if (!appt) return <FallbackPage />

  if (appt.status === "confirmed" || appt.status === "completed") {
    return <ConfirmedView appt={appt} />
  }

  // pending, rescheduled, o cualquier otro
  return <PendingPage appt={appt} />
}
