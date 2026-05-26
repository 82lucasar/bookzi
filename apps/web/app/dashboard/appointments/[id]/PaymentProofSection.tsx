"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { confirmAppointment, cancelAppointment } from "@/lib/actions/appointments"

type Props = {
  appointmentId: string
  status: string
  paymentProofUrl: string
  priceSnapshot: string | null
  clientName: string
  clientPhone: string | null
  serviceName: string
  startTime: string   // "HH:MM"
  startDateLabel: string // "10 Jun"
}

function isPdf(url: string) {
  return /\.pdf(\?|$)/i.test(url)
}

function sendWhatsApp(phone: string | null, msg: string) {
  if (!phone) return
  window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank")
}

export default function PaymentProofSection({
  appointmentId, status, paymentProofUrl, priceSnapshot,
  clientName, clientPhone, serviceName, startTime, startDateLabel,
}: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState<"validate" | "reject" | null>(null)

  const isPending = status === "pending"
  const showActions = isPending

  const amount = priceSnapshot && Number(priceSnapshot) > 0
    ? `$${Number(priceSnapshot).toLocaleString("es-AR")}`
    : null

  async function handleValidate() {
    setLoading("validate")
    await confirmAppointment(appointmentId)
    sendWhatsApp(clientPhone, `Hola ${clientName}! ✅ Tu turno para *${serviceName}* el *${startDateLabel}* a las *${startTime}* quedó *CONFIRMADO*. ¡Te esperamos!`)
    setModalOpen(false)
    router.push("/dashboard")
  }

  async function handleReject() {
    setLoading("reject")
    await cancelAppointment(appointmentId)
    sendWhatsApp(clientPhone, `Hola ${clientName}! ❌ Tu turno para *${serviceName}* del *${startDateLabel}* fue *CANCELADO*. Podés reservar un nuevo turno cuando quieras.`)
    setModalOpen(false)
    router.push("/dashboard")
  }

  const isLoading = loading !== null

  return (
    <>
      {/* ── Sección compacta ── */}
      <div style={{
        background: "white", borderRadius: 20, border: "1.5px solid #E0F0F8",
        padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
          Comprobante de pago
        </p>

        {/* Fila de archivo + monto */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          {/* Ícono del archivo */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: isPdf(paymentProofUrl) ? "rgba(220,38,38,0.08)" : "rgba(2,132,199,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isPdf(paymentProofUrl) ? (
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="4" y="2" width="14" height="18" rx="2" stroke="#DC2626" strokeWidth="1.6"/>
                <path d="M4 2h10l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="#DC2626" strokeWidth="1.5"/>
                <path d="M14 2v4h4" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
                <text x="7" y="17" fontSize="5" fontWeight="700" fill="#DC2626">PDF</text>
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="2" y="4" width="22" height="18" rx="3" stroke="#0284C7" strokeWidth="1.6"/>
                <circle cx="9" cy="10" r="2.5" stroke="#0284C7" strokeWidth="1.4"/>
                <path d="M2 18l6-5 5 4 3-3 8 6" stroke="#0284C7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, color: "#64748B", fontWeight: 500, marginBottom: 2 }}>
              {isPdf(paymentProofUrl) ? "Comprobante PDF" : "Comprobante de imagen"}
            </p>
            {amount && (
              <p style={{ fontSize: 22, fontWeight: 900, color: "#059669", letterSpacing: "-0.5px" }}>
                {amount}
              </p>
            )}
          </div>
        </div>

        {/* Link ver comprobante */}
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 700, color: "#0284C7",
            background: "none", border: "none", cursor: "pointer",
            padding: 0, fontFamily: "inherit", marginBottom: showActions ? 14 : 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M1 8C2.5 4.5 5 3 8 3s5.5 1.5 7 5c-1.5 3.5-4 5-7 5S2.5 11.5 1 8z" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
          Ver comprobante completo
        </button>

        {/* Botones Validar / Rechazar */}
        {showActions && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleValidate}
              disabled={isLoading}
              style={{
                flex: 1, height: 46, borderRadius: 12, border: "none",
                background: isLoading && loading === "validate" ? "#047857" : "linear-gradient(135deg, #059669, #047857)",
                color: "white", fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.8 : 1,
                boxShadow: "0 2px 8px rgba(5,150,105,0.25)",
              }}
            >
              {loading === "validate" ? "Validando..." : "Validar pago"}
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              style={{
                flex: 1, height: 46, borderRadius: 12,
                border: "1.5px solid rgba(220,38,38,0.3)",
                background: "white", color: "#DC2626",
                fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {loading === "reject" ? "Rechazando..." : "Rechazar"}
            </button>
          </div>
        )}
      </div>

      {/* ── Modal de comprobante ── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(15,23,42,0.55)",
            display: "flex", alignItems: "flex-end",
            animation: "fadeIn 180ms ease",
          }}
        >
          <div style={{
            width: "100%", maxWidth: 520, margin: "0 auto",
            background: "white", borderRadius: "20px 20px 0 0",
            padding: "0 0 32px",
            maxHeight: "92dvh", overflowY: "auto",
            animation: "slideUp 260ms cubic-bezier(0.4,0,0.2,1)",
          }}>
            {/* Drag handle */}
            <div style={{ height: 4, width: 40, borderRadius: 100, background: "#E0F0F8", margin: "12px auto 0" }} />

            {/* Header del modal */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px 12px",
            }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
                Comprobante de transferencia
              </span>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  border: "1.5px solid #E0F0F8", background: "#F8FAFC",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#64748B", fontFamily: "inherit",
                  fontSize: 16, fontWeight: 700,
                }}
              >
                ×
              </button>
            </div>

            {/* Tarjeta de datos */}
            <div style={{ margin: "0 16px 16px" }}>
              <div style={{
                background: "#F8FAFC", borderRadius: 16, border: "1.5px solid #E0F0F8",
                padding: "20px",
              }}>
                {/* Tipo de comprobante */}
                <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  Comprobante de pago · {isPdf(paymentProofUrl) ? "PDF" : "Imagen"}
                </p>

                {/* Monto */}
                {amount && (
                  <p style={{ fontSize: 34, fontWeight: 900, color: "#0F172A", letterSpacing: "-1px", marginBottom: 18 }}>
                    {amount}
                  </p>
                )}

                {/* Filas de datos */}
                {[
                  { label: "Origen",   value: clientName },
                  { label: "Concepto", value: `${serviceName} · ${startDateLabel} ${startTime}` },
                ].map(row => (
                  <div key={row.label} style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    gap: 12, padding: "10px 0",
                    borderTop: "1px solid #E0F0F8",
                  }}>
                    <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 600, textAlign: "right" }}>{row.value}</span>
                  </div>
                ))}

                {/* Preview del archivo */}
                <div style={{ borderTop: "1px solid #E0F0F8", paddingTop: 14, marginTop: 4 }}>
                  {isPdf(paymentProofUrl) ? (
                    <a
                      href={paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                        borderRadius: 12, background: "rgba(220,38,38,0.06)",
                        border: "1.5px solid rgba(220,38,38,0.15)", textDecoration: "none",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>Abrir PDF completo →</span>
                    </a>
                  ) : (
                    <a href={paymentProofUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                      <img
                        src={paymentProofUrl}
                        alt="Comprobante"
                        style={{ width: "100%", borderRadius: 12, objectFit: "contain", maxHeight: 280, display: "block" }}
                      />
                      <p style={{ fontSize: 12, color: "#0284C7", fontWeight: 600, marginTop: 8, textAlign: "center" }}>
                        Tap para abrir en pantalla completa →
                      </p>
                    </a>
                  )}
                </div>

                {/* Banner de estado */}
                <div style={{
                  marginTop: 14, padding: "10px 14px", borderRadius: 12,
                  background: "rgba(5,150,105,0.08)", border: "1.5px solid rgba(5,150,105,0.18)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="8" stroke="#059669" strokeWidth="1.5"/>
                    <path d="M5 9l3 3 5-5" stroke="#059669" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#047857" }}>
                    {status === "confirmed" ? "Pago validado" : "Comprobante subido por el cliente"}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones dentro del modal */}
            {showActions && (
              <div style={{ display: "flex", gap: 8, padding: "0 16px" }}>
                <button
                  onClick={handleValidate}
                  disabled={isLoading}
                  style={{
                    flex: 1, height: 50, borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg, #059669, #047857)",
                    color: "white", fontWeight: 700, fontSize: 15, fontFamily: "inherit",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.8 : 1,
                    boxShadow: "0 2px 10px rgba(5,150,105,0.3)",
                  }}
                >
                  {loading === "validate" ? "Validando..." : "Validar pago"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isLoading}
                  style={{
                    flex: 1, height: 50, borderRadius: 14,
                    border: "1.5px solid rgba(220,38,38,0.35)",
                    background: "white", color: "#DC2626",
                    fontWeight: 700, fontSize: 15, fontFamily: "inherit",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {loading === "reject" ? "Rechazando..." : "Rechazar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  )
}
