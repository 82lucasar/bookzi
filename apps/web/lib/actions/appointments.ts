"use server"

import { revalidatePath } from "next/cache"
import { db } from "@bookzi/db"
import { appointments, services, clients } from "@bookzi/db/schema"
import { eq, and, gte, lt, desc, ne, isNull } from "drizzle-orm"
import { getMyBusiness } from "./business"

export async function getAppointments(filter: "upcoming" | "today" | "past" = "upcoming") {
  const business = await getMyBusiness()
  if (!business) return []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86400000)

  const conditions = [
    eq(appointments.businessId, business.id),
    ne(appointments.status, "cancelled"),
    isNull(appointments.deletedAt),
  ]

  if (filter === "today") {
    conditions.push(gte(appointments.startAt, todayStart))
    conditions.push(lt(appointments.startAt, todayEnd))
  } else if (filter === "upcoming") {
    conditions.push(gte(appointments.startAt, todayStart))
  } else {
    conditions.push(lt(appointments.startAt, todayStart))
  }

  return db
    .select({
      id: appointments.id,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      status: appointments.status,
      notes: appointments.notes,
      priceSnapshot: appointments.priceSnapshot,
      serviceName: services.name,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientEmail: clients.email,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(filter === "past" ? desc(appointments.startAt) : appointments.startAt)
    .limit(50)
}

export async function confirmAppointment(appointmentId: string) {
  const business = await getMyBusiness()
  if (!business) return

  await db
    .update(appointments)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(and(
      eq(appointments.id, appointmentId),
      eq(appointments.businessId, business.id),
      eq(appointments.status, "pending"),
    ))

  revalidatePath("/dashboard/appointments")
  revalidatePath("/dashboard")
}

export async function cancelAppointment(appointmentId: string) {
  const business = await getMyBusiness()
  if (!business) return

  await db
    .update(appointments)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: "professional",
      updatedAt: new Date(),
    })
    .where(and(
      eq(appointments.id, appointmentId),
      eq(appointments.businessId, business.id),
    ))

  revalidatePath("/dashboard/appointments")
  revalidatePath("/dashboard")
}
