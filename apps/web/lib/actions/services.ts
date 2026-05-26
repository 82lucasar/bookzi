"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { db } from "@bookzi/db"
import { services } from "@bookzi/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { getMyBusiness } from "./business"

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

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const durationMinutes = parseInt(formData.get("durationMinutes") as string)
  const bufferMinutes = parseInt(formData.get("bufferMinutes") as string) || 0
  const price = formData.get("price") as string

  await db.insert(services).values({
    businessId: business.id,
    name,
    description: description || null,
    durationMinutes,
    bufferMinutes,
    price: price ? price : null,
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

  const inserts = servicesData
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
