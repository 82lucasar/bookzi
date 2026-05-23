export const dynamic = "force-dynamic"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getAppointment, confirmAppointment, cancelAppointment } from "@/lib/actions/appointments"

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:   { label: "Pendiente de confirmación", bg: "rgba(245,158,11,0.08)",  text: "#B45309", border: "rgba(245,158,11,0.2)"  },
  confirmed: { label: "Confirmado",                bg: "rgba(5,150,105,0.08)",   text: "#047857", border: "rgba(5,150,105,0.2)"   },
  cancelled: { label: "Cancelado",                 bg: "rgba(220,38,38,0.08)",   text: "#DC2626", border: "rgba(220,38,38,0.2)"   },
  completed: { label: "Completado",                bg: "rgba(100,116,139,0.08)", text: "#64748B", border: "rgba(100,116,139,0.15)" },
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const appt = await getAppointment(id)
  if (!appt) notFound()

  const sc = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending!

  const startDate = new Date(appt.startAt)
  const day   = startDate.getDate()
  const month = startDate.toLocaleDateString("es-AR", { month: "long" })
  const year  = startDate.getFullYear()
  const startTime = startDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  const endTime   = new Date(appt.endAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

  const initials = appt.clientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
  const waHref    = appt.clientPhone ? `https://wa.me/${appt.clientPhone.replace(/\D/g, "")}` : null
  const emailHref = appt.clientEmail ? `mailto:${appt.clientEmail}` : null

  const isPending   = appt.status === "pending"
  const isConfirmed = appt.status === "confirmed"
  const showActions = isPending || isConfirmed

  return (
    <div style={{ background: "#F0F9FF", minHeight: "100dvh" }}>

      {/* Header */}
      <div style={{
        background: "white",
        borderBottom: "1.5px solid #E0F0F8",
        padding: "0 16px",
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <a
          href="/dashboard/appointments"
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            border: "1.5px solid #E0F0F8",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0F172A",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>Detalle del turno</span>
      </div>

      <div style={{ padding: "20px 16px 140px", maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Hero */}
        <div style={{ background: "white", borderRadius: 20, overflow: "hidden", border: "1.5px solid #E0F0F8", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "stretch" }}>
            <div style={{
              background: "linear-gradient(180deg, #0284C7, #0369A1)",
              padding: "24px 18px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minWidth: 76,
            }}>
              <span style={{ fontSize: 34, fontWeight: 900, color: "white", lineHeight: 1 }}>{day}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "capitalize", marginTop: 4 }}>
                {month.slice(0, 3)}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{year}</span>
            </div>
            <div style={{ flex: 1, padding: "20px 18px", minWidth: 0 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px", marginBottom: 4 }}>
                {appt.clientName}
              </p>
              <p style={{ fontSize: 14, color: "#64748B", fontWeight: 500, marginBottom: 6 }}>
                {appt.serviceName}
              </p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#0284C7", marginBottom: 12 }}>
                {startTime} — {endTime}
              </p>
              <span style={{
                display: "inline-flex", alignItems: "center",
                padding: "6px 14px", borderRadius: 20,
                background: sc.bg, color: sc.text,
                border: `1.5px solid ${sc.border}`,
                fontSize: 13, fontWeight: 700,
              }}>
                {sc.label}
              </span>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #E0F0F8", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
            Cliente
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #0284C7, #0369A1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 800, fontSize: 16, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{appt.clientName}</p>
              {appt.clientPhone && <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{appt.clientPhone}</p>}
              {appt.clientEmail && <p style={{ fontSize: 13, color: "#64748B" }}>{appt.clientEmail}</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", borderRadius: 12,
                  background: "rgba(37,211,102,0.08)", color: "#128C7E",
                  fontWeight: 700, fontSize: 13, textDecoration: "none",
                  border: "1.5px solid rgba(37,211,102,0.2)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C3.69 1 1 3.69 1 7c0 1.04.27 2.02.74 2.87L1 13l3.23-.73A5.97 5.97 0 007 13c3.31 0 6-2.69 6-6S10.31 1 7 1z" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                WhatsApp
              </a>
            )}
            {emailHref && (
              <a
                href={emailHref}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", borderRadius: 12,
                  background: "rgba(2,132,199,0.08)", color: "#0284C7",
                  fontWeight: 700, fontSize: 13, textDecoration: "none",
                  border: "1.5px solid rgba(2,132,199,0.2)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Email
              </a>
            )}
          </div>
        </div>

        {/* Precio */}
        {appt.priceSnapshot && (
          <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #E0F0F8", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Precio
            </p>
            <p style={{ fontSize: 28, fontWeight: 900, color: "#059669", letterSpacing: "-0.5px" }}>
              ${Number(appt.priceSnapshot).toLocaleString("es-AR")}
            </p>
          </div>
        )}

      </div>

      {/* Barra de acciones fija */}
      {showActions && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "white",
          borderTop: "1.5px solid #E0F0F8",
          padding: "16px",
          display: "flex", gap: 10,
          zIndex: 50,
        }}>
          {isPending && (
            <form action={confirmAppointment.bind(null, appt.id)} style={{ flex: 1 }}>
              <button
                type="submit"
                style={{
                  width: "100%", height: 52,
                  borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #059669, #047857)",
                  color: "white", fontWeight: 700, fontSize: 15,
                  fontFamily: "inherit", cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
                }}
              >
                ✓ Confirmar turno
              </button>
            </form>
          )}
          <form
            action={cancelAppointment.bind(null, appt.id)}
            style={{ flex: isPending ? "0 0 auto" : 1 }}
          >
            <button
              type="submit"
              style={{
                height: 52,
                padding: isPending ? "0 20px" : "0",
                width: isPending ? "auto" : "100%",
                borderRadius: 14,
                border: "1.5px solid #E0F0F8",
                background: "white",
                color: "#64748B",
                fontWeight: 700, fontSize: 15,
                fontFamily: "inherit", cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

    </div>
  )
}
