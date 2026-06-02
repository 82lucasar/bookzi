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

type TemplateParam = { type: "text"; text: string }
function t(text: string): TemplateParam { return { type: "text", text } }

interface SendTemplateOptions {
  to:           string
  templateName: string
  languageCode?: string
  params?:      TemplateParam[]
}

export async function sendWhatsAppTemplate(opts: SendTemplateOptions): Promise<string> {
  const { to, templateName, languageCode = "es_AR", params = [] } = opts

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !accessToken) throw new Error("WhatsApp no configurado")

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(params.length > 0 && {
        components: [{ type: "body", parameters: params }],
      }),
    },
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error ${res.status}: ${err}`)
  }

  const data = await res.json() as { messages?: Array<{ id: string }> }
  return data.messages?.[0]?.id ?? ""
}

// ── Pre-built helpers por evento ─────────────────────────────────────────────

export interface WaPayload {
  recipientPhone: string | null
  clientName:     string
  businessName:   string
  serviceName:    string
  startAt:        string
  endAt:          string
}

export async function waSendBookingReceived(p: WaPayload) {
  if (!p.recipientPhone) throw new Error("Sin número de teléfono")
  return sendWhatsAppTemplate({
    to: p.recipientPhone,
    templateName: "bookzi_appointment_received",
    params: [
      t(p.clientName), t(p.businessName), t(p.serviceName),
      t(fmtDate(p.startAt)), t(fmtTime(p.startAt)),
    ],
  })
}

export async function waSendBookingConfirmed(p: WaPayload) {
  if (!p.recipientPhone) throw new Error("Sin número de teléfono")
  return sendWhatsAppTemplate({
    to: p.recipientPhone,
    templateName: "bookzi_appointment_confirmed",
    params: [
      t(p.clientName), t(p.businessName), t(p.serviceName),
      t(fmtDate(p.startAt)), t(fmtTime(p.startAt)),
    ],
  })
}

export async function waSendBookingCancelled(p: WaPayload) {
  if (!p.recipientPhone) throw new Error("Sin número de teléfono")
  return sendWhatsAppTemplate({
    to: p.recipientPhone,
    templateName: "bookzi_appointment_cancelled",
    params: [t(p.clientName), t(p.businessName), t(fmtDate(p.startAt))],
  })
}

export async function waSendReminder24h(p: WaPayload) {
  if (!p.recipientPhone) throw new Error("Sin número de teléfono")
  return sendWhatsAppTemplate({
    to: p.recipientPhone,
    templateName: "bookzi_reminder_24h",
    params: [
      t(p.clientName), t(p.businessName), t(p.serviceName),
      t(fmtDate(p.startAt)), t(fmtTime(p.startAt)),
    ],
  })
}

export async function waSendReminder2h(p: WaPayload) {
  if (!p.recipientPhone) throw new Error("Sin número de teléfono")
  return sendWhatsAppTemplate({
    to: p.recipientPhone,
    templateName: "bookzi_reminder_2h",
    params: [
      t(p.clientName), t(p.businessName), t(p.serviceName),
      t(fmtTime(p.startAt)),
    ],
  })
}
