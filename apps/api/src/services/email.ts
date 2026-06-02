import { Resend } from "resend"

function getResend() { return new Resend(process.env.RESEND_API_KEY!) }
function getFrom()   { return process.env.EMAIL_FROM ?? "Bookzi <turnos@bookzi.app>" }

const TZ = "America/Argentina/Buenos_Aires"

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", timeZone: TZ,
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })
}

export interface EmailPayload {
  recipientEmail: string
  clientName:     string
  businessName:   string
  serviceName:    string
  startAt:        string
  endAt:          string
}

export async function emailBookingConfirmed(p: EmailPayload) {
  if (!p.recipientEmail) return
  await getResend().emails.send({
    from: getFrom(),
    to: p.recipientEmail,
    subject: `Turno confirmado en ${p.businessName}`,
    html: buildHtml(
      "Tu turno está confirmado",
      `Hola <strong>${p.clientName}</strong>, tu turno en <strong>${p.businessName}</strong> está confirmado.`,
      p.businessName, p.serviceName, p.startAt, p.endAt,
      "Confirmado", "#059669", "#F0FDF4",
    ),
  })
}

export async function emailBookingCancelled(p: EmailPayload) {
  if (!p.recipientEmail) return
  await getResend().emails.send({
    from: getFrom(),
    to: p.recipientEmail,
    subject: `Turno cancelado en ${p.businessName}`,
    html: buildHtml(
      "Tu turno fue cancelado",
      `Hola <strong>${p.clientName}</strong>, tu turno en <strong>${p.businessName}</strong> fue cancelado.`,
      p.businessName, p.serviceName, p.startAt, p.endAt,
      "Cancelado", "#DC2626", "#FEF2F2",
    ),
  })
}

export async function emailReminder24h(p: EmailPayload) {
  if (!p.recipientEmail) return
  await getResend().emails.send({
    from: getFrom(),
    to: p.recipientEmail,
    subject: `Recordatorio: tu turno mañana en ${p.businessName}`,
    html: buildHtml(
      "Tu turno es mañana",
      `Hola <strong>${p.clientName}</strong>, te recordamos que mañana tenés turno en <strong>${p.businessName}</strong>.`,
      p.businessName, p.serviceName, p.startAt, p.endAt,
      "Confirmado", "#059669", "#F0FDF4",
    ),
  })
}

export async function emailReminder2h(p: EmailPayload) {
  if (!p.recipientEmail) return
  await getResend().emails.send({
    from: getFrom(),
    to: p.recipientEmail,
    subject: `Tu turno es en 2 horas — ${p.businessName}`,
    html: buildHtml(
      "Tu turno es en 2 horas",
      `Hola <strong>${p.clientName}</strong>, ¡tu turno en <strong>${p.businessName}</strong> es en 2 horas!`,
      p.businessName, p.serviceName, p.startAt, p.endAt,
      "Confirmado", "#059669", "#F0FDF4",
    ),
  })
}

function buildHtml(
  heading: string, intro: string,
  businessName: string, serviceName: string,
  startAt: string, endAt: string,
  badge: string, badgeColor: string, badgeBg: string,
) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#F0F9FF;font-family:'Plus Jakarta Sans',sans-serif;">
<table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;margin:32px auto;">
  <tr><td style="background:#0284C7;padding:28px 40px;text-align:center;">
    <span style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Bookzi</span>
  </td></tr>
  <tr><td style="padding:32px 40px 0;">
    <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:${badgeColor};background:${badgeBg};">${badge}</span>
    <h2 style="margin:16px 0 8px;font-size:22px;font-weight:800;color:#0F172A;">${heading}</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">${intro}</p>
  </td></tr>
  <tr><td style="padding:0 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;border-radius:12px;border:1px solid #E0F0F8;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;">Negocio</p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0F172A;">${businessName}</p>
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;">Servicio</p>
        <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0F172A;">${serviceName}</p>
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;">Fecha y hora</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#0F172A;">${fmtDate(startAt)}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#334155;">${fmtTime(startAt)} — ${fmtTime(endAt)} hs</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:28px 40px;text-align:center;border-top:1px solid #E0F0F8;margin-top:24px;">
    <p style="margin:0;font-size:12px;color:#64748B;">Tu agenda inteligente · <strong style="color:#0284C7;">Bookzi</strong></p>
  </td></tr>
</table></body></html>`
}
