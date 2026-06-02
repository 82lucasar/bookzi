import { Queue } from "bullmq"
import IORedis from "ioredis"

export type NotificationEvent =
  | "appointment_created"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_rescheduled"
  | "reminder_24h"
  | "reminder_2h"
  | "review_request"

export interface NotificationJobData {
  appointmentId:  string
  event:          NotificationEvent
  recipientType:  "client" | "professional"
  recipientId:    string
  recipientPhone: string | null
  recipientEmail: string | null
  recipientName:  string
  businessName:   string
  businessEmail:  string | null
  serviceName:    string
  startAt:        string
  endAt:          string
  price:          string | null
  currency:       string | null
}

export const QUEUE_NAME = "bookzi:notifications"

function getRedisConnection() {
  const url = process.env.UPSTASH_REDIS_URL
  if (!url) throw new Error("UPSTASH_REDIS_URL no está configurado")
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: url.startsWith("rediss://") ? {} : undefined,
  })
}

let _queue: Queue | undefined

export function getNotificationQueue() {
  if (!_queue) {
    _queue = new Queue(QUEUE_NAME, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: getRedisConnection() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail:    { count: 1000 },
      },
    })
  }
  return _queue
}

/**
 * Encola una notificación de forma segura.
 * Falla silenciosamente si Redis no está configurado (dev sin Redis).
 */
export async function enqueueNotification(
  data: NotificationJobData,
  opts: { delayMs?: number } = {},
): Promise<void> {
  if (!process.env.UPSTASH_REDIS_URL) return

  try {
    const queue = getNotificationQueue()
    const jobId = `${data.appointmentId}:${data.event}:${data.recipientType}`
    await queue.add(data.event, data, {
      delay: opts.delayMs ?? 0,
      jobId,
    })
  } catch (err) {
    console.error("[enqueueNotification] Error al encolar:", err)
  }
}
