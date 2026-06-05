import { NextRequest, NextResponse } from "next/server"
import { db } from "@bookzi/db"
import { appointments, services, clients, businesses, notifications } from "@bookzi/db/schema"
import { eq, and, gte, lt, isNull, ne } from "drizzle-orm"
import { sendReminder24h, sendReminder2h } from "@/lib/email"
import { requestReviewForAppointment } from "@/lib/actions/reviews"

// Verifica que la llamada viene de Vercel Cron (o es un test manual)
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // sin secret configurado, permitir (solo dev)
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Ventana para reminder_24h: turnos que arrancan entre 22h y 26h desde ahora
  const win24hStart = new Date(now.getTime() + 22 * 60 * 60 * 1000)
  const win24hEnd   = new Date(now.getTime() + 26 * 60 * 60 * 1000)

  // Ventana para reminder_2h: turnos que arrancan entre 1h y 3h desde ahora
  const win2hStart  = new Date(now.getTime() + 1 * 60 * 60 * 1000)
  const win2hEnd    = new Date(now.getTime() + 3 * 60 * 60 * 1000)

  let sent24h = 0, sent2h = 0, errors = 0

  // ── Función auxiliar: verificar si ya enviamos esta notif ──────────────────
  async function alreadySent(appointmentId: string, event: "reminder_24h" | "reminder_2h"): Promise<boolean> {
    const [existing] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(
        eq(notifications.appointmentId, appointmentId),
        eq(notifications.event, event),
        ne(notifications.status, "failed"),
      ))
      .limit(1)
    return !!existing
  }

  // ── Función auxiliar: loguear la notificación enviada ─────────────────────
  async function logNotification(
    appointmentId: string,
    clientId: string,
    event: "reminder_24h" | "reminder_2h",
    status: "sent" | "failed",
    externalId?: string,
    errorMessage?: string,
  ) {
    await db.insert(notifications).values({
      appointmentId,
      channel: "email",
      event,
      recipientType: "client",
      recipientId: clientId,
      status,
      externalId: externalId ?? null,
      errorMessage: errorMessage ?? null,
      sentAt: status === "sent" ? now : null,
      attemptCount: 1,
    })
  }

  // ── Obtener turnos para cada ventana ──────────────────────────────────────
  const baseConditions = [
    ne(appointments.status, "cancelled"),
    isNull(appointments.deletedAt),
  ]

  async function getAppointmentsInWindow(start: Date, end: Date) {
    return db
      .select({
        id: appointments.id,
        startAt: appointments.startAt,
        endAt: appointments.endAt,
        clientId: appointments.clientId,
        clientName: clients.name,
        clientEmail: clients.email,
        serviceName: services.name,
        businessName: businesses.name,
        businessId: appointments.businessId,
      })
      .from(appointments)
      .innerJoin(clients,    eq(appointments.clientId,   clients.id))
      .innerJoin(services,   eq(appointments.serviceId,  services.id))
      .innerJoin(businesses, eq(appointments.businessId, businesses.id))
      .where(and(
        ...baseConditions,
        gte(appointments.startAt, start),
        lt(appointments.startAt, end),
      ))
  }

  // ── Procesar reminder_24h ─────────────────────────────────────────────────
  const appts24h = await getAppointmentsInWindow(win24hStart, win24hEnd)
  for (const appt of appts24h) {
    if (await alreadySent(appt.id, "reminder_24h")) continue
    try {
      await sendReminder24h({
        clientName: appt.clientName,
        clientEmail: appt.clientEmail,
        businessName: appt.businessName,
        serviceName: appt.serviceName,
        startAt: appt.startAt,
        endAt: appt.endAt,
      })
      await logNotification(appt.id, appt.clientId, "reminder_24h", "sent")
      sent24h++
    } catch (err) {
      await logNotification(appt.id, appt.clientId, "reminder_24h", "failed", undefined, String(err))
      errors++
    }
  }

  // ── Procesar reminder_2h ──────────────────────────────────────────────────
  const appts2h = await getAppointmentsInWindow(win2hStart, win2hEnd)
  for (const appt of appts2h) {
    if (await alreadySent(appt.id, "reminder_2h")) continue
    try {
      await sendReminder2h({
        clientName: appt.clientName,
        clientEmail: appt.clientEmail,
        businessName: appt.businessName,
        serviceName: appt.serviceName,
        startAt: appt.startAt,
        endAt: appt.endAt,
      })
      await logNotification(appt.id, appt.clientId, "reminder_2h", "sent")
      sent2h++
    } catch (err) {
      await logNotification(appt.id, appt.clientId, "reminder_2h", "failed", undefined, String(err))
      errors++
    }
  }

  // ── Solicitudes de reseña: turnos completados hace 1-2h ──────────────────
  let sentReviews = 0
  const reviewWindowStart = new Date(now.getTime() - 2 * 3600000)
  const reviewWindowEnd   = new Date(now.getTime() - 1 * 3600000)

  const completedAppts = await db
    .select({ id: appointments.id, businessId: appointments.businessId })
    .from(appointments)
    .where(and(
      eq(appointments.status, "completed"),
      gte(appointments.endAt, reviewWindowStart),
      lt(appointments.endAt,  reviewWindowEnd),
      isNull(appointments.deletedAt),
    ))

  for (const appt of completedAppts) {
    try {
      await requestReviewForAppointment(appt.id, appt.businessId)
      sentReviews++
    } catch { /* continuar */ }
  }

  return NextResponse.json({
    ok: true,
    sent24h,
    sent2h,
    sentReviews,
    errors,
    processedAt: now.toISOString(),
  })
}
