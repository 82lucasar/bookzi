"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { db } from "@bookzi/db"
import { services } from "@bookzi/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { getMyBusiness } from "./business"

const CreateServiceSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(120).default(0),
  price: z.string().max(20).optional(),
})

const OnboardingServiceSchema = z.object({
  name: z.string().min(1).max(255),
  durationMinutes: z.number().int().min(5).max(480),
  price: z.string().max(20).optional().nullable(),
  maxPerDay: z.number().int().positive().nullable().optional(),
})
const OnboardingServicesSchema = z.array(OnboardingServiceSchema).min(0)

export async function getServices() {
  const business = await getMyBusiness()
  if (!business) return []

  return db
    .select()
    .from(services)
    .where(and(
      eq(services.businessId, business.id),
      eq(services.isActive, true),
      isNull(services.deletedAt),
    ))
    .orderBy(services.createdAt)
}

export async function createService(formData: FormData) {
  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const parsed = CreateServiceSchema.parse({
    name: formData.get("name"),
    durationMinutes: formData.get("durationMinutes"),
    bufferMinutes: formData.get("bufferMinutes"),
    price: formData.get("price"),
  })

  const description = formData.get("description") as string

  await db.insert(services).values({
    businessId: business.id,
    name: parsed.name,
    description: description || null,
    durationMinutes: parsed.durationMinutes,
    bufferMinutes: parsed.bufferMinutes,
    price: parsed.price ? parsed.price : null,
    currency: "ARS",
  })

  revalidatePath("/dashboard/services")
  redirect("/dashboard/services")
}

export async function saveOnboardingServices(
  servicesData: Array<{ name: string; durationMinutes: number; price: string; maxPerDay?: number | null }>
) {
  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const parsed = OnboardingServicesSchema.parse(servicesData)

  const inserts = parsed
    .filter(s => s.name.trim().length > 0)
    .map(s => ({
      businessId: business.id,
      name: s.name.trim(),
      durationMinutes: s.durationMinutes,
      price: s.price?.trim() || null,
      currency: "ARS" as const,
      maxPerDay: s.maxPerDay ?? null,
    }))

  if (inserts.length > 0) {
    await db.insert(services).values(inserts)
  }

  redirect("/onboarding/availability")
}

export async function deleteService(serviceId: string) {
  const business = await getMyBusiness()
  if (!business) return

  await db
    .update(services)
    .set({ deletedAt: new Date(), isActive: false })
    .where(and(
      eq(services.id, serviceId),
      eq(services.businessId, business.id),
    ))

  revalidatePath("/dashboard/services")
}
