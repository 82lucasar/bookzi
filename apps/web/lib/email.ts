import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

function getFrom() {
  return process.env.RESEND_FROM ?? "Bookzi <onboarding@resend.dev>"
}

const TZ = "America/Argentina/Buenos_Aires"

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", timeZone: TZ,
  })
}

function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })
}

function fmtPrice(amount: number | string | null, currency: string | null) {
  if (!amount || !currency) return ""
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(Number(amount))
}

// ─── Shared HTML pieces ─────────────────────────────────────────────────────

function header() {
  return `<tr>
    <td style="background:#0284C7;padding:28px 40px;text-align:center;">
      <span style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Bookzi</span>
    </td>
  </tr>`
}

function footer() {
  return `<tr>
    <td style="padding:28px 40px;text-align:center;border-top:1px solid #E0F0F8;">
      <p style="margin:0;font-size:12px;color:#64748B;line-height:1.6;">
        Reservas gestionadas por <strong style="color:#0284C7;">Bookzi</strong><br/>
        Tu agenda inteligente para profesionales y negocios
      </p>
    </td>
  </tr>`
}

function detailRow(label: string, value: string, subvalue?: string) {
  return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid #E0F0F8;">
      <p style="margin:0;font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.8px;">${label}</p>
      <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#0F172A;">${value}</p>
      ${subvalue ? `<p style="margin:2px 0 0;font-size:14px;color:#334155;">${subvalue}</p>` : ""}
    </td>
  </tr>`
}

function detailBox(rows: string) {
  return `<tr>
    <td style="padding:24px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#F0F9FF;border-radius:12px;border:1px solid #E0F0F8;">
        <tr><td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
      </table>
    </td>
  </tr>`
}

function infoBox(text: string, color = "#1E40AF", bg = "#EFF6FF", border = "#0284C7") {
  return `<tr>
    <td style="padding:16px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:${bg};border-radius:10px;border-left:4px solid ${border};">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0;font-size:14px;color:${color};line-height:1.6;">${text}</p>
        </td></tr>
      </table>
    </td>
  </tr>`
}

function badge(text: string, bg: string, color: string) {
  return `<tr>
    <td style="padding:28px 40px 0;text-align:center;">
      <span style="display:inline-block;background:${bg};color:${color};font-size:13px;font-weight:600;padding:6px 16px;border-radius:100px;">${text}</span>
    </td>
  </tr>`
}

function wrap(rows: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F0F9FF;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(2,132,199,0.08);">
        ${rows}
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function titleRow(title: string, subtitle: string) {
  return `<tr>
    <td style="padding:24px 40px 0;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#0F172A;line-height:1.3;">${title}</h1>
      <p style="margin:10px 0 0;font-size:15px;color:#334155;line-height:1.6;">${subtitle}</p>
    </td>
  </tr>`
}

// ─── Appointment data helper ─────────────────────────────────────────────────

type ApptData = {
  clientName: string
  clientEmail: string | null
  businessName: string
  businessEmail: string | null
  serviceName: string
  startAt: Date | string
  endAt: Date | string
  price: number | string | null
  currency: string | null
}

// ─── 1. Nueva reserva → cliente ─────────────────────────────────────────────

export async function sendBookingReceivedToClient(appt: ApptData) {
  if (!process.env.RESEND_API_KEY || !appt.clientEmail) return
  const date = fmtDate(appt.startAt)
  const timeRange = `${fmtTime(appt.startAt)} — ${fmtTime(appt.endAt)} hs`
  const price = fmtPrice(appt.price, appt.currency)

  const html = wrap([
    header(),
    badge("⏳ Pendiente de confirmación", "#FEF3C7", "#92400E"),
    titleRow(
      "¡Recibimos tu reserva!",
      `Hola <strong>${appt.clientName}</strong>, tu solicitud en <strong>${appt.businessName}</strong> fue recibida. El profesional la confirmará en breve.`,
    ),
    detailBox([
      detailRow("Servicio", appt.serviceName),
      detailRow("Fecha y hora", date, timeRange),
      detailRow("Monto", price),
    ].join("")),
    infoBox(`Una vez que <strong>${appt.businessName}</strong> revise tu comprobante, vas a recibir la confirmación por email.`),
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: appt.clientEmail,
    subject: `Reserva recibida en ${appt.businessName} — ${date}`,
    html,
  })
}

// ─── 2. Nueva reserva → profesional ─────────────────────────────────────────

export async function sendNewBookingToProfessional(appt: ApptData) {
  if (!process.env.RESEND_API_KEY || !appt.businessEmail) return
  const date = fmtDate(appt.startAt)
  const timeRange = `${fmtTime(appt.startAt)} — ${fmtTime(appt.endAt)} hs`
  const price = fmtPrice(appt.price, appt.currency)

  const html = wrap([
    header(),
    badge("🔔 Nueva solicitud de turno", "#EFF6FF", "#1E40AF"),
    titleRow(
      "Tenés una nueva reserva",
      `<strong>${appt.clientName}</strong> solicitó un turno en tu negocio. Ingresá al dashboard para revisar el comprobante y confirmar.`,
    ),
    detailBox([
      detailRow("Cliente", appt.clientName),
      detailRow("Servicio", appt.serviceName),
      detailRow("Fecha y hora", date, timeRange),
      detailRow("Monto", price),
    ].join("")),
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: appt.businessEmail,
    subject: `Nueva reserva de ${appt.clientName} — ${date}`,
    html,
  })
}

// ─── 3. Turno confirmado → cliente ───────────────────────────────────────────

export async function sendAppointmentConfirmedToClient(appt: ApptData) {
  if (!process.env.RESEND_API_KEY || !appt.clientEmail) return
  const date = fmtDate(appt.startAt)
  const timeRange = `${fmtTime(appt.startAt)} — ${fmtTime(appt.endAt)} hs`
  const price = fmtPrice(appt.price, appt.currency)

  const html = wrap([
    header(),
    badge("✅ Turno confirmado", "#D1FAE5", "#065F46"),
    titleRow(
      "¡Tu turno está confirmado!",
      `Hola <strong>${appt.clientName}</strong>, <strong>${appt.businessName}</strong> confirmó tu turno. ¡Te esperamos!`,
    ),
    detailBox([
      detailRow("Servicio", appt.serviceName),
      detailRow("Fecha y hora", date, timeRange),
      detailRow("Monto", price),
    ].join("")),
    infoBox(
      `Si necesitás cancelar o reprogramar, comunicate directamente con <strong>${appt.businessName}</strong>.`,
      "#1E40AF", "#EFF6FF", "#0284C7",
    ),
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: appt.clientEmail,
    subject: `Turno confirmado en ${appt.businessName} — ${date}`,
    html,
  })
}

// ─── 4. Turno cancelado → cliente ────────────────────────────────────────────

export async function sendAppointmentCancelledToClient(appt: ApptData) {
  if (!process.env.RESEND_API_KEY || !appt.clientEmail) return
  const date = fmtDate(appt.startAt)
  const timeRange = `${fmtTime(appt.startAt)} — ${fmtTime(appt.endAt)} hs`

  const html = wrap([
    header(),
    badge("❌ Turno cancelado", "#FEE2E2", "#991B1B"),
    titleRow(
      "Tu turno fue cancelado",
      `Hola <strong>${appt.clientName}</strong>, <strong>${appt.businessName}</strong> tuvo que cancelar tu turno.`,
    ),
    detailBox([
      detailRow("Servicio", appt.serviceName),
      detailRow("Fecha y hora", date, timeRange),
    ].join("")),
    infoBox(
      `Podés reservar un nuevo turno en cualquier momento desde la agenda de <strong>${appt.businessName}</strong>.`,
      "#92400E", "#FEF3C7", "#D97706",
    ),
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: appt.clientEmail,
    subject: `Turno cancelado en ${appt.businessName} — ${date}`,
    html,
  })
}

// ─── 5. Turno cancelado → profesional ───────────────────────────────────────

export async function sendAppointmentCancelledToProfessional(appt: ApptData) {
  if (!process.env.RESEND_API_KEY || !appt.businessEmail) return
  const date = fmtDate(appt.startAt)
  const timeRange = `${fmtTime(appt.startAt)} — ${fmtTime(appt.endAt)} hs`

  const html = wrap([
    header(),
    badge("❌ Turno cancelado", "#FEE2E2", "#991B1B"),
    titleRow(
      "Cancelaste un turno",
      `Se canceló el turno de <strong>${appt.clientName}</strong> del ${date}.`,
    ),
    detailBox([
      detailRow("Cliente", appt.clientName),
      detailRow("Servicio", appt.serviceName),
      detailRow("Fecha y hora", date, timeRange),
    ].join("")),
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: appt.businessEmail,
    subject: `Turno cancelado: ${appt.clientName} — ${date}`,
    html,
  })
}

// ─── 6. Turno reprogramado → cliente ─────────────────────────────────────────

export async function sendAppointmentRescheduledToClient(appt: ApptData & { oldStartAt: Date | string }) {
  if (!process.env.RESEND_API_KEY || !appt.clientEmail) return
  const oldDate = fmtDate(appt.oldStartAt)
  const newDate = fmtDate(appt.startAt)
  const timeRange = `${fmtTime(appt.startAt)} — ${fmtTime(appt.endAt)} hs`

  const html = wrap([
    header(),
    badge("🔄 Turno reprogramado", "#EDE9FE", "#5B21B6"),
    titleRow(
      "Tu turno fue reprogramado",
      `Hola <strong>${appt.clientName}</strong>, <strong>${appt.businessName}</strong> reprogramó tu turno.`,
    ),
    detailBox([
      detailRow("Fecha anterior", oldDate),
      detailRow("Nueva fecha y hora", newDate, timeRange),
      detailRow("Servicio", appt.serviceName),
    ].join("")),
    infoBox(
      `Si esta fecha no te conviene, comunicate directamente con <strong>${appt.businessName}</strong>.`,
      "#1E40AF", "#EFF6FF", "#0284C7",
    ),
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: appt.clientEmail,
    subject: `Turno reprogramado en ${appt.businessName} — nuevo: ${newDate}`,
    html,
  })
}

// ─── 7. Turno reprogramado → profesional ─────────────────────────────────────

export async function sendAppointmentRescheduledToProfessional(appt: ApptData & { oldStartAt: Date | string }) {
  if (!process.env.RESEND_API_KEY || !appt.businessEmail) return
  const oldDate = fmtDate(appt.oldStartAt)
  const newDate = fmtDate(appt.startAt)
  const timeRange = `${fmtTime(appt.startAt)} — ${fmtTime(appt.endAt)} hs`

  const html = wrap([
    header(),
    badge("🔄 Turno reprogramado", "#EDE9FE", "#5B21B6"),
    titleRow(
      "Reprogramaste un turno",
      `El turno de <strong>${appt.clientName}</strong> fue reprogramado.`,
    ),
    detailBox([
      detailRow("Cliente", appt.clientName),
      detailRow("Fecha anterior", oldDate),
      detailRow("Nueva fecha y hora", newDate, timeRange),
      detailRow("Servicio", appt.serviceName),
    ].join("")),
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: appt.businessEmail,
    subject: `Reprogramaste turno de ${appt.clientName} — nuevo: ${newDate}`,
    html,
  })
}

// ─── Reminder data type ───────────────────────────────────────────────────────

type ReminderData = {
  clientName: string
  clientEmail: string | null
  businessName: string
  serviceName: string
  startAt: Date | string
  endAt: Date | string
}

// ─── 8. Recordatorio 24h → cliente ───────────────────────────────────────────

export async function sendReminder24h(appt: ReminderData) {
  if (!process.env.RESEND_API_KEY || !appt.clientEmail) return
  const date = fmtDate(appt.startAt)
  const timeRange = `${fmtTime(appt.startAt)} — ${fmtTime(appt.endAt)} hs`

  const html = wrap([
    header(),
    badge("🔔 Recordatorio — 24 hs", "#EFF6FF", "#1E40AF"),
    titleRow(
      "Tu turno es mañana",
      `Hola <strong>${appt.clientName}</strong>, te recordamos que tenés un turno mañana en <strong>${appt.businessName}</strong>.`,
    ),
    detailBox([
      detailRow("Servicio", appt.serviceName),
      detailRow("Fecha y hora", date, timeRange),
    ].join("")),
    infoBox(
      `Si necesitás cancelar o reprogramar, comunicate lo antes posible con <strong>${appt.businessName}</strong>.`,
      "#1E40AF", "#EFF6FF", "#0284C7",
    ),
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: appt.clientEmail,
    subject: `Recordatorio: tu turno mañana en ${appt.businessName}`,
    html,
  })
}

// ─── 9. Recordatorio 2h → cliente ────────────────────────────────────────────

export async function sendReminder2h(appt: ReminderData) {
  if (!process.env.RESEND_API_KEY || !appt.clientEmail) return
  const date = fmtDate(appt.startAt)
  const timeRange = `${fmtTime(appt.startAt)} — ${fmtTime(appt.endAt)} hs`

  const html = wrap([
    header(),
    badge("⏰ En 2 horas", "#FEF3C7", "#92400E"),
    titleRow(
      "¡Tu turno es muy pronto!",
      `Hola <strong>${appt.clientName}</strong>, en 2 horas tenés turno en <strong>${appt.businessName}</strong>. ¡Acordate!`,
    ),
    detailBox([
      detailRow("Servicio", appt.serviceName),
      detailRow("Fecha y hora", date, timeRange),
    ].join("")),
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: appt.clientEmail,
    subject: `Tu turno es en 2 horas — ${appt.businessName}`,
    html,
  })
}

// ─── 10. Recordatorio de trial → negocio ─────────────────────────────────────

export async function sendTrialReminder(data: {
  businessEmail: string
  businessName: string
  daysLeft: number
  billingUrl: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const isLastDay = data.daysLeft <= 1
  const subject = isLastDay
    ? `⚠️ Tu prueba gratis vence mañana — ${data.businessName}`
    : `Tu prueba gratis de Bookzi vence en ${data.daysLeft} días`

  const html = wrap([
    header(),
    badge(
      isLastDay ? "⚠️ Último día de prueba" : `🗓 ${data.daysLeft} días restantes`,
      isLastDay ? "#FEE2E2" : "#EFF6FF",
      isLastDay ? "#991B1B" : "#1E40AF",
    ),
    titleRow(
      isLastDay ? "¡Tu prueba vence mañana!" : `Tu prueba vence en ${data.daysLeft} días`,
      `Hola equipo de <strong>${data.businessName}</strong>, tu período de prueba gratis de Bookzi está por terminar.`,
    ),
    infoBox(
      `Activá tu plan Pro (ARS 12.900/mes) para seguir recibiendo turnos, recordatorios automáticos y todas las funciones sin interrupciones.`,
      "#1E40AF", "#EFF6FF", "#0284C7",
    ),
    `<tr><td style="padding:24px 40px;">
      <a href="${data.billingUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#0284C7,#0369A1);color:white;font-weight:800;font-size:15px;padding:16px 32px;border-radius:12px;text-decoration:none;">
        Activar mi plan ahora →
      </a>
    </td></tr>`,
    footer(),
  ].join(""))

  await getResend().emails.send({
    from: getFrom(),
    to: data.businessEmail,
    subject,
    html,
  })
}
