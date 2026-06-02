"use server"

import { revalidatePath } from "next/cache"
import { db } from "@bookzi/db"
import { availability, availabilityServices } from "@bookzi/db/schema"
import { eq, and, isNull, inArray } from "drizzle-orm"
import { getMyBusiness } from "./business"

export type DayConfig = {
  day: string
  isActive: boolean
  startTime: string
  endTime: string
  enabledServiceIds: string[]
}

const DAYS_ORDER = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]

export async function getAvailability(staffId?: string): Promise<DayConfig[]> {
  const business = await getMyBusiness()
  if (!business) return getDefaultSchedule()

  const rows = await db
    .select()
    .from(availability)
    .where(and(
      eq(availability.businessId, business.id),
      staffId ? eq(availability.staffId, staffId) : isNull(availability.staffId),
    ))

  if (rows.length === 0) return getDefaultSchedule()

  const availIds = rows.map(r => r.id)
  const svcRows = availIds.length > 0
    ? await db
        .select()
        .from(availabilityServices)
        .where(inArray(availabilityServices.availabilityId, availIds))
    : []

  return DAYS_ORDER.map((day) => {
    const row = rows.find((r) => r.dayOfWeek === day)
    const svcIds = row
      ? svcRows.filter(s => s.availabilityId === row.id && s.isEnabled).map(s => s.serviceId)
      : []
    return {
      day,
      isActive: row?.isActive ?? false,
      startTime: (row?.startTime ?? "09:00").slice(0, 5),
      endTime: (row?.endTime ?? "18:00").slice(0, 5),
      enabledServiceIds: svcIds,
    }
  })
}

export async function saveAvailability(days: DayConfig[], staffId?: string) {
  const business = await getMyBusiness()
  if (!business) return

  await db
    .delete(availability)
    .where(and(
      eq(availability.businessId, business.id),
      staffId ? eq(availability.staffId, staffId) : isNull(availability.staffId),
    ))

  const inserted = await db.insert(availability).values(
    DAYS_ORDER.map((day) => {
      const d = days.find(x => x.day === day)
      return {
        businessId: business.id,
        staffId: staffId ?? null,
        dayOfWeek: day as typeof availability.$inferInsert["dayOfWeek"],
        startTime: d?.startTime ?? "09:00",
        endTime: d?.endTime ?? "18:00",
        isActive: d?.isActive ?? false,
      }
    })
  ).returning()

  const svcInserts: { availabilityId: string; serviceId: string; isEnabled: boolean }[] = []
  for (const insertedRow of inserted) {
    const dayConfig = days.find(d => d.day === insertedRow.dayOfWeek)
    if (dayConfig?.enabledServiceIds?.length) {
      for (const sid of dayConfig.enabledServiceIds) {
        svcInserts.push({ availabilityId: insertedRow.id, serviceId: sid, isEnabled: true })
      }
    }
  }
  if (svcInserts.length > 0) {
    await db.insert(availabilityServices).values(svcInserts)
  }

  revalidatePath("/dashboard/availability")
  if (staffId) revalidatePath(`/dashboard/staff/${staffId}/availability`)
}

function getDefaultSchedule(): DayConfig[] {
  return DAYS_ORDER.map((day) => ({
    day,
    isActive: !["saturday", "sunday"].includes(day),
    startTime: "09:00",
    endTime: "18:00",
    enabledServiceIds: [],
  }))
}
