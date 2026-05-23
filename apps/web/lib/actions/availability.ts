"use server"

import { revalidatePath } from "next/cache"
import { db } from "@bookzi/db"
import { availability } from "@bookzi/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { getMyBusiness } from "./business"

export type DayConfig = {
  day: string
  isActive: boolean
  startTime: string
  endTime: string
}

const DAYS_ORDER = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]

export async function getAvailability(): Promise<DayConfig[]> {
  const business = await getMyBusiness()
  if (!business) return getDefaultSchedule()

  const rows = await db
    .select()
    .from(availability)
    .where(and(
      eq(availability.businessId, business.id),
      isNull(availability.staffId),
    ))

  if (rows.length === 0) return getDefaultSchedule()

  return DAYS_ORDER.map((day) => {
    const row = rows.find((r) => r.dayOfWeek === day)
    return {
      day,
      isActive: row?.isActive ?? false,
      startTime: (row?.startTime ?? "09:00").slice(0, 5),
      endTime: (row?.endTime ?? "18:00").slice(0, 5),
    }
  })
}

export async function saveAvailability(formData: FormData) {
  const business = await getMyBusiness()
  if (!business) return

  // Borra la configuración actual del negocio (sin staff)
  await db
    .delete(availability)
    .where(and(
      eq(availability.businessId, business.id),
      isNull(availability.staffId),
    ))

  const inserts = DAYS_ORDER.map((day) => ({
    businessId: business.id,
    staffId: null,
    dayOfWeek: day as typeof availability.$inferInsert["dayOfWeek"],
    startTime: formData.get(`${day}_start`) as string || "09:00",
    endTime: formData.get(`${day}_end`) as string || "18:00",
    isActive: formData.get(`${day}_active`) === "on",
  }))

  await db.insert(availability).values(inserts)
  revalidatePath("/dashboard/availability")
}

function getDefaultSchedule(): DayConfig[] {
  return DAYS_ORDER.map((day) => ({
    day,
    isActive: !["saturday", "sunday"].includes(day),
    startTime: "09:00",
    endTime: "18:00",
  }))
}
