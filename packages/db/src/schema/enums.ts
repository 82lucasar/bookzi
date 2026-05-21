import { pgEnum } from "drizzle-orm/pg-core"

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rescheduled",
])

export const notificationChannelEnum = pgEnum("notification_channel", [
  "whatsapp",
  "email",
  "push",
])

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "skipped",
])

export const notificationEventEnum = pgEnum("notification_event", [
  "appointment_created",
  "appointment_confirmed",
  "appointment_cancelled",
  "appointment_rescheduled",
  "reminder_24h",
  "reminder_2h",
  "review_request",
  "waitlist_notified",
])

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
])
