import { Worker, type Job } from "bullmq"
import IORedis from "ioredis"
import { db, notifications, appointments, clients, services, businesses } from "@bookzi/db"
import { eq, and } from "drizzle-orm"
import {
  waSendBookingConfirmed, waSendBookingCancelled,
  waSendReminder24h, waSendReminder2h, waSendBookingReceived,
} from "../services/whatsapp.js"
import {
  emailBookingConfirmed, emailBookingCancelled,
  emailReminder24h, emailReminder2h,
} from "../services/email.js"
import { QUEUE_NAME, type NotificationJobData, type NotificationEvent } from "../queues/notifications.js"

function getRedisConnection() {
  const url = process.env.UPSTASH_REDIS_URL!
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: url.startsWith("rediss://") ? {} : undefined,
  })
}

async function logNotification(
  data: NotificationJobData,
  channel: "whatsapp" | "email",
  status: "sent" | "failed" | "skipped",
  externalId?: string,
  errorMessage?: string,
) {
  await db.insert(notifications).values({
    appointmentId: data.appointmentId,
    channel,
    event:         data.event as (typeof notifications.$inferInsert)["event"],
    recipientType: data.recipientType,
    recipientId:   data.recipientId,
    status,
    externalId:    externalId ?? null,
    errorMessage:  errorMessage ?? null,
    attemptCount:  1,
    sentAt:        status === "sent" ? new Date() : null,
  }).onConflictDoNothing()
}

async function processNotification(job: Job<NotificationJobData>) {
  const data = job.data

  const waPayload = {
    recipientPhone: data.recipientPhone,
    clientName:     data.recipientName,
    businessName:   data.businessName,
    serviceName:    data.serviceName,
    startAt:        data.startAt,
    endAt:          data.endAt,
  }

  const emailPayload = {
    recipientEmail: data.recipientEmail ?? "",
    clientName:     data.recipientName,
    businessName:   data.businessName,
    serviceName:    data.serviceName,
    startAt:        data.startAt,
    endAt:          data.endAt,
  }

  let waId: string | undefined

  // 1. Intentar WhatsApp
  if (process.env.WHATSAPP_ACCESS_TOKEN && data.recipientPhone) {
    try {
      waId = await dispatch(data.event, waPayload)
      await logNotification(data, "whatsapp", "sent", waId)
      return
    } catch (err) {
      await logNotification(data, "whatsapp", "failed", undefined, String(err))
      console.warn(`[worker] WA falló para ${data.event} (${data.appointmentId}):`, err)
    }
  }

  // 2. Fallback a email
  if (data.recipientEmail && process.env.RESEND_API_KEY) {
    try {
      await dispatchEmail(data.event, emailPayload)
      await logNotification(data, "email", "sent")
    } catch (err) {
      await logNotification(data, "email", "failed", undefined, String(err))
      throw err // propagar para reintento de BullMQ
    }
  } else {
    await logNotification(data, "email", "skipped")
  }
}

async function dispatch(event: NotificationEvent, p: Parameters<typeof waSendBookingReceived>[0]) {
  switch (event) {
    case "appointment_created":    return waSendBookingReceived(p)
    case "appointment_confirmed":  return waSendBookingConfirmed(p)
    case "appointment_cancelled":  return waSendBookingCancelled(p)
    case "appointment_rescheduled": return waSendBookingConfirmed(p)
    case "reminder_24h":           return waSendReminder24h(p)
    case "reminder_2h":            return waSendReminder2h(p)
    default: throw new Error(`Evento no manejado: ${event}`)
  }
}

async function dispatchEmail(event: NotificationEvent, p: Parameters<typeof emailBookingConfirmed>[0]) {
  switch (event) {
    case "appointment_created":
    case "appointment_confirmed":
    case "appointment_rescheduled": return emailBookingConfirmed(p)
    case "appointment_cancelled":   return emailBookingCancelled(p)
    case "reminder_24h":            return emailReminder24h(p)
    case "reminder_2h":             return emailReminder2h(p)
    default: return // eventos sin fallback email
  }
}

export function createNotificationWorker() {
  const worker = new Worker<NotificationJobData>(
    QUEUE_NAME,
    processNotification,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: getRedisConnection() as any,
      concurrency: 5,
    },
  )

  worker.on("completed", (job) => {
    console.log(`[worker] ✓ ${job.data.event} para turno ${job.data.appointmentId}`)
  })

  worker.on("failed", (job, err) => {
    console.error(`[worker] ✗ ${job?.data.event} para turno ${job?.data.appointmentId}:`, err)
  })

  return worker
}

// ── Cron de recordatorios ────────────────────────────────────────────────────

export async function enqueueReminders(): Promise<{ sent: number; errors: number }> {
  const { enqueueNotification } = await import("../queues/notifications.js")
  const { ne, gte, lt, isNull } = await import("drizzle-orm")

  const now = new Date()
  const win24hStart = new Date(now.getTime() + 22 * 3600000)
  const win24hEnd   = new Date(now.getTime() + 26 * 3600000)
  const win2hStart  = new Date(now.getTime() + 1  * 3600000)
  const win2hEnd    = new Date(now.getTime() + 3  * 3600000)

  let sent = 0, errors = 0

  async function alreadyQueued(appointmentId: string, event: NotificationEvent) {
    const [row] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(
        eq(notifications.appointmentId, appointmentId),
        eq(notifications.event, event as (typeof notifications.$inferSelect)["event"]),
        ne(notifications.status, "failed"),
      ))
      .limit(1)
    return !!row
  }

  async function fetchAppointments(start: Date, end: Date) {
    return db
      .select({
        id:          appointments.id,
        startAt:     appointments.startAt,
        endAt:       appointments.endAt,
        clientId:    appointments.clientId,
        clientName:  clients.name,
        clientPhone: clients.phone,
        clientEmail: clients.email,
        businessName: businesses.name,
        businessEmail: businesses.email,
        serviceName: services.name,
        priceSnapshot:    appointments.priceSnapshot,
        currencySnapshot: appointments.currencySnapshot,
      })
      .from(appointments)
      .innerJoin(clients,    eq(appointments.clientId,   clients.id))
      .innerJoin(services,   eq(appointments.serviceId,  services.id))
      .innerJoin(businesses, eq(appointments.businessId, businesses.id))
      .where(and(
        eq(appointments.status, "confirmed"),
        gte(appointments.startAt, start),
        lt(appointments.startAt,  end),
        isNull(appointments.deletedAt),
      ))
  }

  for (const [window, event] of [
    [[win24hStart, win24hEnd], "reminder_24h" as const],
    [[win2hStart,  win2hEnd],  "reminder_2h"  as const],
  ] as const) {
    const appts = await fetchAppointments(window[0] as Date, window[1] as Date)
    for (const appt of appts) {
      if (await alreadyQueued(appt.id, event)) continue
      try {
        await enqueueNotification({
          appointmentId:  appt.id,
          event,
          recipientType:  "client",
          recipientId:    appt.clientId,
          recipientPhone: appt.clientPhone,
          recipientEmail: appt.clientEmail,
          recipientName:  appt.clientName,
          businessName:   appt.businessName,
          businessEmail:  appt.businessEmail,
          serviceName:    appt.serviceName,
          startAt:        appt.startAt.toISOString(),
          endAt:          appt.endAt.toISOString(),
          price:          appt.priceSnapshot,
          currency:       appt.currencySnapshot,
        })
        sent++
      } catch {
        errors++
      }
    }
  }

  return { sent, errors }
}
