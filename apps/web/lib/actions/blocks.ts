"use server"

import { revalidatePath } from "next/cache"
import { db } from "@bookzi/db"
import { availabilityBlocks } from "@bookzi/db/schema"
import { eq, and, gte, isNull, or } from "drizzle-orm"
import { getMyBusiness } from "./business"

export type BlockItem = {
  id: string
  staffId: string | null
  startsAt: Date
  endsAt: Date
  reason: string | null
}

export async function getBlocks(staffId?: string): Promise<BlockItem[]> {
  const business = await getMyBusiness()
  if (!business) return []

  const now = new Date()
  const rows = await db
    .select({
      id:       availabilityBlocks.id,
      staffId:  availabilityBlocks.staffId,
      startsAt: availabilityBlocks.startsAt,
      endsAt:   availabilityBlocks.endsAt,
      reason:   availabilityBlocks.reason,
    })
    .from(availabilityBlocks)
    .where(and(
      eq(availabilityBlocks.businessId, business.id),
      gte(availabilityBlocks.endsAt, now),
      staffId
        ? or(isNull(availabilityBlocks.staffId), eq(availabilityBlocks.staffId, staffId))
        : isNull(availabilityBlocks.staffId),
    ))

  return rows.sort((a, b) =>
    new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  )
}

export async function createBlock(input: {
  date: string
  endDate: string
  startTime: string
  endTime: string
  reason: string
  staffId?: string | null
}) {
  const business = await getMyBusiness()
  if (!business) return { error: "Negocio no encontrado" }

  // Construir timestamps usando offset AR (-03:00)
  const startsAt = new Date(`${input.date}T${input.startTime}:00-03:00`)
  const endsAt   = new Date(`${input.endDate}T${input.endTime}:00-03:00`)

  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
    return { error: "Fecha u hora inválida" }
  }
  if (endsAt <= startsAt) {
    return { error: "La fecha de fin debe ser posterior al inicio" }
  }

  await db.insert(availabilityBlocks).values({
    businessId: business.id,
    staffId:    input.staffId ?? null,
    startsAt,
    endsAt,
    reason:     input.reason.trim() || null,
  })

  revalidatePath("/dashboard/availability")
  return { success: true }
}

export async function deleteBlock(id: string) {
  const business = await getMyBusiness()
  if (!business) return

  await db
    .delete(availabilityBlocks)
    .where(and(
      eq(availabilityBlocks.id, id),
      eq(availabilityBlocks.businessId, business.id),
    ))

  revalidatePath("/dashboard/availability")
}
