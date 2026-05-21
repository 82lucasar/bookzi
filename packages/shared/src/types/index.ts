// ── Appointment ──────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show"

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationChannel = "whatsapp" | "email" | "sms" | "push"

export type NotificationStatus = "pending" | "sent" | "failed" | "skipped"

export type NotificationEvent =
  | "appointment_created"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_rescheduled"
  | "appointment_reminder_24h"
  | "appointment_reminder_1h"
  | "waitlist_notified"

// ── Schedule ──────────────────────────────────────────────────────────────────

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

// ── Shared DTOs ───────────────────────────────────────────────────────────────

export interface BusinessConfig {
  id: string
  name: string
  slug: string
  timezone: string
  currency: string
  locale: string
}

export interface ServiceSummary {
  id: string
  name: string
  durationMinutes: number
  price: string | null
  currency: string | null
}

export interface AppointmentSummary {
  id: string
  businessId: string
  serviceId: string
  staffId: string
  clientId: string
  startAt: Date
  endAt: Date
  status: AppointmentStatus
  priceSnapshot: string | null
  currencySnapshot: string | null
}
