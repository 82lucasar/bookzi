"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { db, waitlist, clients, services, businesses, appointments } from "@bookzi/db"
import { eq, and, isNull, desc, ne, gte, lt } from "drizzle-orm"
import { getMyBusiness } from "./business"
import { Resend } from "resend"

function getResend() { return new Resend(process.env.RESEND_API_KEY!) }
function getFrom()   { return process.env.RESEND_FROM ?? "Bookzi <turnos@bookzi.app>" }

const JoinSchema = z.object({
  businessId:    z.string().uuid(),
  serviceId:     z.string().uuid(),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clientName:    z.string().min(1).max(255),
  clientPhone:   z.string().min(6).max(30),
  clientEmail:   z.string().email().optional().or(z.literal("")).nullable(),
})

export async function joinWaitlist(formData: FormData) {
  const data = JoinSchema.parse({
    businessId:    formData.get("businessId"),
    serviceId:     formData.get("serviceId"),
    requestedDate: formData.get("requestedDate"),
    clientName:    formData.get("clientName"),
    clientPhone:   formData.get("clientPhone"),
    clientEmail:   formData.get("clientEmail") || null,
  })

  // Buscar o crear cliente
  let [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.businessId, data.businessId), eq(clients.phone, data.clientPhone)))
    .limit(1)

  if (!client) {
    const [created] = await db.insert(clients).values({
      businessId: data.businessId,
      name: data.clientName,
      phone: data.clientPhone,
      email: data.clientEmail || null,
    }).returning()
    client = created!
  }

  // Evitar duplicados en la misma fecha/servicio
  const [existing] = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(and(
      eq(waitlist.businessId,    data.businessId),
      eq(waitlist.serviceId,     data.serviceId),
      eq(waitlist.clientId,      client.id),
      eq(waitlist.requestedDate, data.requestedDate),
      ne(waitlist.status, "expired"),
    ))
    .limit(1)

  if (existing) return { ok: true, alreadyIn: true }

  await db.insert(waitlist).values({
    businessId:    data.businessId,
    serviceId:     data.serviceId,
    clientId:      client.id,
    requestedDate: data.requestedDate,
    status: "waiting",
  })

  return { ok: true, alreadyIn: false }
}

export async function getWaitlistForProfessional() {
  const business = await getMyBusiness()
  if (!business) return null

  const today = new Date().toISOString().slice(0, 10)

  return db
    .select({
      id:            waitlist.id,
      requestedDate: waitlist.requestedDate,
      status:        waitlist.status,
      notifiedAt:    waitlist.notifiedAt,
      expiresAt:     waitlist.expiresAt,
      createdAt:     waitlist.createdAt,
      clientName:    clients.name,
      clientPhone:   clients.phone,
      clientEmail:   clients.email,
      serviceName:   services.name,
      serviceId:     services.id,
    })
    .from(waitlist)
    .innerJoin(clients,  eq(waitlist.clientId,  clients.id))
    .innerJoin(services, eq(waitlist.serviceId, services.id))
    .where(and(
      eq(waitlist.businessId, business.id),
      gte(waitlist.requestedDate, today),
    ))
    .orderBy(desc(waitlist.requestedDate))
}

export async function notifyWaitlistEntry(entryId: string) {
  const business = await getMyBusiness()
  if (!business) throw new Error("Sin negocio")

  const [entry] = await db
    .select({
      id:            waitlist.id,
      requestedDate: waitlist.requestedDate,
      clientName:    clients.name,
      clientEmail:   clients.email,
      serviceName:   services.name,
      serviceId:     services.id,
    })
    .from(waitlist)
    .innerJoin(clients,  eq(waitlist.clientId,  clients.id))
    .innerJoin(services, eq(waitlist.serviceId, services.id))
    .where(and(eq(waitlist.id, entryId), eq(waitlist.businessId, business.id)))
    .limit(1)

  if (!entry) throw new Error("Entrada no encontrada")

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  await db
    .update(waitlist)
    .set({ status: "notified", notifiedAt: new Date(), expiresAt })
    .where(eq(waitlist.id, entryId))

  if (entry.clientEmail && process.env.RESEND_API_KEY) {
    const date = new Date(entry.requestedDate + "T12:00:00")
      .toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    await getResend().emails.send({
      from: getFrom(),
      to: entry.clientEmail,
      subject: `¡Se liberó un turno en ${business.name}!`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <div style="background:#0284C7;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
          <span style="font-size:22px;font-weight:800;color:#fff">Bookzi</span>
        </div>
        <div style="background:#fff;border:1px solid #E0F0F8;border-top:none;border-radius:0 0 12px 12px;padding:24px">
          <p style="font-size:16px;font-weight:700;color:#0F172A;margin:0 0 8px">¡Hola ${entry.clientName}!</p>
          <p style="font-size:15px;color:#334155;margin:0 0 20px;line-height:1.6">
            Se liberó un horario para <strong>${entry.serviceName}</strong> en <strong>${business.name}</strong> el <strong>${date}</strong>.
          </p>
          <p style="font-size:14px;color:#64748B;margin:0 0 20px">
            Tenés <strong>30 minutos</strong> para reclamar el turno antes de que pase al siguiente en la lista.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://bookzi-three.vercel.app"}/book/${business.slug}" style="display:block;background:#0284C7;color:#fff;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:16px">
            Reservar turno →
          </a>
          <p style="font-size:12px;color:#94A3B8;text-align:center;margin:0">
            Si no podés ir, simplemente ignorá este mensaje.
          </p>
        </div>
      </div>`,
    })
  }

  revalidatePath("/dashboard/waitlist")
}

// Llamado automáticamente cuando se cancela un turno
export async function triggerWaitlistOnCancellation(
  businessId: string,
  serviceId:  string,
  dateStr:    string,
) {
  const [entry] = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(and(
      eq(waitlist.businessId,    businessId),
      eq(waitlist.serviceId,     serviceId),
      eq(waitlist.requestedDate, dateStr),
      eq(waitlist.status, "waiting"),
    ))
    .orderBy(waitlist.createdAt)
    .limit(1)

  if (!entry) return

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  await db.update(waitlist)
    .set({ status: "notified", notifiedAt: new Date(), expiresAt })
    .where(eq(waitlist.id, entry.id))

  // Obtener datos del cliente para el email
  const [full] = await db
    .select({
      clientEmail:  clients.email,
      clientName:   clients.name,
      serviceName:  services.name,
      businessName: businesses.name,
      businessSlug: businesses.slug,
    })
    .from(waitlist)
    .innerJoin(clients,    eq(waitlist.clientId,  clients.id))
    .innerJoin(services,   eq(waitlist.serviceId, services.id))
    .innerJoin(businesses, eq(waitlist.businessId, businesses.id))
    .where(eq(waitlist.id, entry.id))
    .limit(1)

  if (!full?.clientEmail || !process.env.RESEND_API_KEY) return

  const date = new Date(dateStr + "T12:00:00")
    .toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

  await getResend().emails.send({
    from: getFrom(),
    to: full.clientEmail,
    subject: `¡Se liberó un turno en ${full.businessName}!`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <div style="background:#0284C7;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
        <span style="font-size:22px;font-weight:800;color:#fff">Bookzi</span>
      </div>
      <div style="background:#fff;border:1px solid #E0F0F8;border-top:none;border-radius:0 0 12px 12px;padding:24px">
        <p style="font-size:16px;font-weight:700;color:#0F172A;margin:0 0 8px">¡Hola ${full.clientName}!</p>
        <p style="font-size:15px;color:#334155;margin:0 0 20px;line-height:1.6">
          Se liberó un horario para <strong>${full.serviceName}</strong> en <strong>${full.businessName}</strong> el <strong>${date}</strong>.
          Tenés <strong>30 minutos</strong> para reservarlo.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://bookzi-three.vercel.app"}/book/${full.businessSlug}" style="display:block;background:#0284C7;color:#fff;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none">
          Reservar turno →
        </a>
      </div>
    </div>`,
  })
}
