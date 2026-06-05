"use server"

import { z } from "zod"
import { db, reviews, appointments, clients, services, businesses } from "@bookzi/db"
import { eq, and, isNull, desc } from "drizzle-orm"
import { getMyBusiness } from "./business"
import { Resend } from "resend"
import { randomBytes } from "crypto"

function getResend() { return new Resend(process.env.RESEND_API_KEY!) }
function getFrom()   { return process.env.RESEND_FROM ?? "Bookzi <turnos@bookzi.app>" }

const TZ = "America/Argentina/Buenos_Aires"

function fmtDateTime(iso: string | Date) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  })
}

// Envía la solicitud de reseña para un turno completado
export async function requestReviewForAppointment(appointmentId: string, businessId: string) {
  // Idempotente: no re-enviar si ya existe
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.appointmentId, appointmentId))
    .limit(1)
  if (existing) return

  const [appt] = await db
    .select({
      id:          appointments.id,
      startAt:     appointments.startAt,
      clientId:    appointments.clientId,
      clientName:  clients.name,
      clientEmail: clients.email,
      serviceName: services.name,
      bizName:     businesses.name,
      bizSlug:     businesses.slug,
    })
    .from(appointments)
    .innerJoin(clients,    eq(appointments.clientId,  clients.id))
    .innerJoin(services,   eq(appointments.serviceId, services.id))
    .innerJoin(businesses, eq(appointments.businessId, businesses.id))
    .where(and(
      eq(appointments.id, appointmentId),
      eq(appointments.businessId, businessId),
      isNull(appointments.deletedAt),
    ))
    .limit(1)

  if (!appt?.clientEmail) return  // sin email → no podemos enviar la solicitud

  const token = randomBytes(24).toString("hex")

  await db.insert(reviews).values({
    appointmentId,
    businessId,
    clientId: appt.clientId,
    token,
  })

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://bookzi-three.vercel.app"}/review/${token}`

  await getResend().emails.send({
    from: getFrom(),
    to: appt.clientEmail,
    subject: `¿Cómo fue tu turno en ${appt.bizName}?`,
    html: buildReviewEmail(appt.clientName, appt.bizName, appt.serviceName, appt.startAt, reviewUrl),
  })
}

export async function submitReview(token: string, formData: FormData) {
  const { rating, comment } = z.object({
    rating:  z.coerce.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }).parse({
    rating:  formData.get("rating"),
    comment: formData.get("comment"),
  })

  const [review] = await db
    .select({ id: reviews.id, submittedAt: reviews.submittedAt })
    .from(reviews)
    .where(eq(reviews.token, token))
    .limit(1)

  if (!review) throw new Error("Reseña no encontrada")
  if (review.submittedAt) return  // ya fue enviada

  await db
    .update(reviews)
    .set({ rating, comment: comment?.trim() || null, submittedAt: new Date() })
    .where(eq(reviews.token, token))
}

export async function getReviewByToken(token: string) {
  const [row] = await db
    .select({
      id:          reviews.id,
      rating:      reviews.rating,
      comment:     reviews.comment,
      submittedAt: reviews.submittedAt,
      bizName:     businesses.name,
      serviceName: services.name,
      startAt:     appointments.startAt,
      clientName:  clients.name,
    })
    .from(reviews)
    .innerJoin(appointments, eq(reviews.appointmentId, appointments.id))
    .innerJoin(businesses,   eq(reviews.businessId,   businesses.id))
    .innerJoin(services,     eq(appointments.serviceId, services.id))
    .innerJoin(clients,      eq(reviews.clientId,     clients.id))
    .where(eq(reviews.token, token))
    .limit(1)
  return row ?? null
}

export async function getReviewsForDashboard() {
  const business = await getMyBusiness()
  if (!business) return null

  return db
    .select({
      id:          reviews.id,
      rating:      reviews.rating,
      comment:     reviews.comment,
      submittedAt: reviews.submittedAt,
      requestedAt: reviews.requestedAt,
      clientName:  clients.name,
      serviceName: services.name,
      startAt:     appointments.startAt,
    })
    .from(reviews)
    .innerJoin(appointments, eq(reviews.appointmentId, appointments.id))
    .innerJoin(clients,      eq(reviews.clientId,     clients.id))
    .innerJoin(services,     eq(appointments.serviceId, services.id))
    .where(and(eq(reviews.businessId, business.id), isNull(appointments.deletedAt)))
    .orderBy(desc(reviews.requestedAt))
}

function buildReviewEmail(
  clientName: string,
  bizName: string,
  serviceName: string,
  startAt: Date | string,
  reviewUrl: string,
) {
  const stars = [1, 2, 3, 4, 5].map(n =>
    `<a href="${reviewUrl}?rating=${n}" style="font-size:32px;text-decoration:none;margin:0 4px;">⭐</a>`,
  ).join("")

  return `<!DOCTYPE html><html><body style="margin:0;background:#F0F9FF;font-family:'Plus Jakarta Sans',sans-serif;">
<table width="520" align="center" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;margin:32px auto;">
  <tr><td style="background:#0284C7;padding:24px 32px;text-align:center;">
    <span style="font-size:22px;font-weight:800;color:#fff;">Bookzi</span>
  </td></tr>
  <tr><td style="padding:28px 32px 0;">
    <h2 style="margin:0 0 10px;font-size:20px;font-weight:800;color:#0F172A;">¿Cómo fue tu turno?</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.6;">
      Hola <strong>${clientName}</strong>, gracias por tu visita a <strong>${bizName}</strong>
      el ${fmtDateTime(startAt)} para <strong>${serviceName}</strong>.
      Tu opinión ayuda a otros clientes.
    </p>
  </td></tr>
  <tr><td style="padding:0 32px 24px;text-align:center;">
    <p style="font-size:15px;font-weight:700;color:#0F172A;margin:0 0 14px;">¿Cuántas estrellas le das?</p>
    <div style="display:flex;justify-content:center;gap:4px;margin-bottom:20px;">${stars}</div>
    <a href="${reviewUrl}" style="display:inline-block;background:#0284C7;color:#fff;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">
      Dejar mi reseña →
    </a>
  </td></tr>
  <tr><td style="padding:20px 32px;border-top:1px solid #E0F0F8;text-align:center;">
    <p style="margin:0;font-size:11px;color:#94A3B8;">
      Si preferís no dejar una reseña, simplemente ignorá este mensaje.
    </p>
  </td></tr>
</table></body></html>`
}
