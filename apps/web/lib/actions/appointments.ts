"use server"

import { revalidatePath } from "next/cache"
import { db } from "@bookzi/db"
import { appointments, services, clients, staff } from "@bookzi/db/schema"
import { eq, and, gte, lt, desc, ne, isNull } from "drizzle-orm"
import { getMyBusiness } from "./business"

export async function getAppointment(id: string) {
  const business = await getMyBusiness()
  if (!business) return null

  const [appt] = await db
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
    .where(and(
      eq(appointments.id, id),
      eq(appointments.businessId, business.id),
      isNull(appointments.deletedAt),
    ))
    .limit(1)

  return appt ?? null
}

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

export async function createDashboardAppointment(data: {
  clientName: string
  clientPhone: string
  clientEmail: string
  serviceId: string
  date: string
  time: string
}): Promise<string> {
  const business = await getMyBusiness()
  if (!business) throw new Error("No se encontró el negocio")

  const [service] = await db.select().from(services)
    .where(eq(services.id, data.serviceId)).limit(1)
  if (!service) throw new Error("Servicio no encontrado")

  const staffRows = await db.select().from(staff)
    .where(and(eq(staff.businessId, business.id), isNull(staff.deletedAt)))
    .orderBy(staff.createdAt).limit(1)
  let defaultStaff = staffRows[0]
  if (!defaultStaff) {
    const [created] = await db.insert(staff).values({
      businessId: business.id,
      name: business.name,
    }).returning()
    defaultStaff = created!
  }

  const startAt = new Date(`${data.date}T${data.time}:00`)
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60000)

  let [client] = await db.select().from(clients)
    .where(and(
      eq(clients.businessId, business.id),
      eq(clients.phone, data.clientPhone),
    )).limit(1)

  if (!client) {
    const [inserted] = await db.insert(clients).values({
      businessId: business.id,
      name: data.clientName,
      phone: data.clientPhone,
      email: data.clientEmail || null,
    }).returning()
    client = inserted!
  }

  const [inserted] = await db.insert(appointments).values({
    businessId: business.id,
    serviceId: data.serviceId,
    staffId: defaultStaff.id,
    clientId: client.id,
    startAt,
    endAt,
    status: "pending",
    priceSnapshot: service.price,
    currencySnapshot: service.currency,
  }).returning()

  revalidatePath("/dashboard")
  return inserted!.id
}
