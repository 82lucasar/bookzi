"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { db } from "@bookzi/db"
import { appointments, services, clients, staff } from "@bookzi/db/schema"
import { eq, and, gte, lt, desc, ne, isNull } from "drizzle-orm"
import { getMyBusiness } from "./business"
import {
  sendAppointmentConfirmedToClient,
  sendAppointmentCancelledToClient,
  sendAppointmentCancelledToProfessional,
  sendAppointmentRescheduledToClient,
  sendAppointmentRescheduledToProfessional,
} from "@/lib/email"

const CreateApptSchema = z.object({
  clientName: z.string().min(1, "El nombre es obligatorio").max(255),
  clientPhone: z.string().min(6, "El teléfono es obligatorio").max(30),
  clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  serviceId: z.string().uuid("ID de servicio inválido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:MM)"),
})

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
      paymentProofUrl: appointments.paymentProofUrl,
      serviceId: appointments.serviceId,
      serviceName: services.name,
      durationMinutes: services.durationMinutes,
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

  return appt ? { ...appt, businessId: business.id } : null
}

export async function getAppointmentsForCalendar() {
  const business = await getMyBusiness()
  if (!business) return []

  const from = new Date()
  from.setDate(from.getDate() - 7)

  return db
    .select({
      id: appointments.id,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      status: appointments.status,
      clientName: clients.name,
      serviceName: services.name,
      staffId: appointments.staffId,
      staffName: staff.name,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .innerJoin(staff, eq(appointments.staffId, staff.id))
    .where(and(
      eq(appointments.businessId, business.id),
      ne(appointments.status, "cancelled"),
      isNull(appointments.deletedAt),
      gte(appointments.startAt, from),
    ))
    .orderBy(appointments.startAt)
    .limit(500)
}

export async function rescheduleAppointment(
  id: string,
  newDate: string,
  newTime: string,
  durationMinutes: number,
) {
  const business = await getMyBusiness()
  if (!business) throw new Error("No se encontró el negocio")

  const apptData = await getApptEmailData(id, business.id)

  const startAt = new Date(`${newDate}T${newTime}:00-03:00`)
  const endAt   = new Date(startAt.getTime() + durationMinutes * 60000)

  await db
    .update(appointments)
    .set({ startAt, endAt, status: "confirmed", updatedAt: new Date() })
    .where(and(
      eq(appointments.id, id),
      eq(appointments.businessId, business.id),
    ))

  revalidatePath("/dashboard/appointments")
  revalidatePath("/dashboard/agenda")
  revalidatePath("/dashboard")

  if (apptData) {
    const emailBase = {
      ...apptData,
      businessName: business.name,
      businessEmail: business.email ?? null,
      oldStartAt: apptData.startAt,
      startAt,
      endAt,
    }
    await Promise.allSettled([
      sendAppointmentRescheduledToClient(emailBase),
      sendAppointmentRescheduledToProfessional(emailBase),
    ])
  }
}

export async function getAppointments(filter: "upcoming" | "today" | "past" = "upcoming") {
  const business = await getMyBusiness()
  if (!business) return []

  const AR_MS = 3 * 60 * 60 * 1000
  const now = new Date()
  const nowAR = new Date(now.getTime() - AR_MS)
  const todayStart = new Date(Date.UTC(nowAR.getUTCFullYear(), nowAR.getUTCMonth(), nowAR.getUTCDate()) + AR_MS)
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

async function getApptEmailData(appointmentId: string, businessId: string) {
  const [row] = await db
    .select({
      clientName: clients.name,
      clientEmail: clients.email,
      serviceName: services.name,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      price: appointments.priceSnapshot,
      currency: appointments.currencySnapshot,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .where(and(eq(appointments.id, appointmentId), eq(appointments.businessId, businessId)))
    .limit(1)
  return row ?? null
}

export async function confirmAppointment(appointmentId: string) {
  const business = await getMyBusiness()
  if (!business) return

  const apptData = await getApptEmailData(appointmentId, business.id)

  await db
    .update(appointments)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(and(
      eq(appointments.id, appointmentId),
      eq(appointments.businessId, business.id),
      eq(appointments.status, "pending"),
    ))

  revalidatePath("/dashboard/appointments")
  revalidatePath("/dashboard/agenda")
  revalidatePath("/dashboard")

  if (apptData) {
    await sendAppointmentConfirmedToClient({
      ...apptData,
      businessName: business.name,
      businessEmail: business.email ?? null,
    })
  }
}

export async function cancelAppointment(appointmentId: string) {
  const business = await getMyBusiness()
  if (!business) return

  const apptData = await getApptEmailData(appointmentId, business.id)

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
  revalidatePath("/dashboard/agenda")
  revalidatePath("/dashboard")

  if (apptData) {
    const emailBase = {
      ...apptData,
      businessName: business.name,
      businessEmail: business.email ?? null,
    }
    await Promise.allSettled([
      sendAppointmentCancelledToClient(emailBase),
      sendAppointmentCancelledToProfessional(emailBase),
    ])
  }
}

export async function createDashboardAppointment(data: {
  clientName: string
  clientPhone: string
  clientEmail: string
  serviceId: string
  date: string
  time: string
}): Promise<string> {
  const parsed = CreateApptSchema.parse(data)

  const business = await getMyBusiness()
  if (!business) throw new Error("No se encontró el negocio")

  const [service] = await db.select().from(services)
    .where(and(
      eq(services.id, parsed.serviceId),
      eq(services.businessId, business.id),
    )).limit(1)
  if (!service) throw new Error("Servicio no encontrado o no pertenece a este negocio")

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

  const startAt = new Date(`${parsed.date}T${parsed.time}:00-03:00`)
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60000)

  let [client] = await db.select().from(clients)
    .where(and(
      eq(clients.businessId, business.id),
      eq(clients.phone, parsed.clientPhone),
    )).limit(1)

  if (!client) {
    const [inserted] = await db.insert(clients).values({
      businessId: business.id,
      name: parsed.clientName,
      phone: parsed.clientPhone,
      email: parsed.clientEmail || null,
    }).returning()
    client = inserted!
  }

  const [inserted] = await db.insert(appointments).values({
    businessId: business.id,
    serviceId: parsed.serviceId,
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
