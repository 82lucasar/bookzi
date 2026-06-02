"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { db, clients, appointments, services } from "@bookzi/db"
import { eq, and, isNull, desc, count, ne } from "drizzle-orm"
import { getMyBusiness } from "./business"

export async function getClients() {
  const business = await getMyBusiness()
  if (!business) return null

  return db
    .select({
      id:         clients.id,
      name:       clients.name,
      phone:      clients.phone,
      email:      clients.email,
      notes:      clients.notes,
      createdAt:  clients.createdAt,
      total:      count(appointments.id),
    })
    .from(clients)
    .leftJoin(
      appointments,
      and(
        eq(appointments.clientId, clients.id),
        isNull(appointments.deletedAt),
        ne(appointments.status, "cancelled"),
      ),
    )
    .where(and(eq(clients.businessId, business.id), isNull(clients.deletedAt)))
    .groupBy(clients.id)
    .orderBy(desc(clients.createdAt))
}

export async function getClientWithHistory(clientId: string) {
  const business = await getMyBusiness()
  if (!business) return null

  const [client] = await db
    .select()
    .from(clients)
    .where(and(
      eq(clients.id, clientId),
      eq(clients.businessId, business.id),
      isNull(clients.deletedAt),
    ))
    .limit(1)

  if (!client) return null

  const history = await db
    .select({
      id:               appointments.id,
      startAt:          appointments.startAt,
      status:           appointments.status,
      priceSnapshot:    appointments.priceSnapshot,
      currencySnapshot: appointments.currencySnapshot,
      serviceName:      services.name,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(and(
      eq(appointments.clientId, clientId),
      eq(appointments.businessId, business.id),
      isNull(appointments.deletedAt),
    ))
    .orderBy(desc(appointments.startAt))

  const totalSpent = history
    .filter(a => a.status === "completed" && a.priceSnapshot)
    .reduce((acc, a) => acc + Number(a.priceSnapshot ?? 0), 0)

  return { client, history, totalSpent }
}

const NotesSchema = z.object({ notes: z.string().max(2000) })

export async function updateClientNotes(clientId: string, formData: FormData) {
  const business = await getMyBusiness()
  if (!business) throw new Error("Sin negocio")

  const { notes } = NotesSchema.parse({ notes: formData.get("notes") ?? "" })

  await db
    .update(clients)
    .set({ notes: notes.trim() || null, updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.businessId, business.id)))

  revalidatePath(`/dashboard/clients/${clientId}`)
}
