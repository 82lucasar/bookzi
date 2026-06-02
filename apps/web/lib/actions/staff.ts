"use server"

import { revalidatePath } from "next/cache"
import { db } from "@bookzi/db"
import { staff } from "@bookzi/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { getMyBusiness } from "./business"

export type StaffMember = {
  id:       string
  name:     string
  isActive: boolean
}

export async function getStaff(): Promise<StaffMember[]> {
  const business = await getMyBusiness()
  if (!business) return []

  const rows = await db
    .select({ id: staff.id, name: staff.name, isActive: staff.isActive })
    .from(staff)
    .where(and(
      eq(staff.businessId, business.id),
      isNull(staff.deletedAt),
    ))
    .orderBy(staff.createdAt)

  return rows
}

export async function createStaff(name: string): Promise<{ id: string } | { error: string }> {
  const business = await getMyBusiness()
  if (!business) return { error: "No se encontró el negocio" }

  const trimmed = name.trim()
  if (!trimmed) return { error: "El nombre es requerido" }

  const [row] = await db
    .insert(staff)
    .values({ businessId: business.id, name: trimmed, isActive: true })
    .returning({ id: staff.id })

  revalidatePath("/dashboard/staff")
  revalidatePath("/dashboard/profile")
  if (!row) return { error: "Error al crear el colaborador" }
  return { id: row.id }
}

export async function updateStaff(id: string, name: string): Promise<void | { error: string }> {
  const business = await getMyBusiness()
  if (!business) return { error: "No se encontró el negocio" }

  const trimmed = name.trim()
  if (!trimmed) return { error: "El nombre es requerido" }

  await db
    .update(staff)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(and(eq(staff.id, id), eq(staff.businessId, business.id)))

  revalidatePath("/dashboard/staff")
  revalidatePath("/dashboard/profile")
  revalidatePath(`/dashboard/staff/${id}`)
}

export async function toggleStaffActive(id: string, isActive: boolean): Promise<void> {
  const business = await getMyBusiness()
  if (!business) return

  await db
    .update(staff)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(staff.id, id), eq(staff.businessId, business.id)))

  revalidatePath("/dashboard/staff")
}

export async function deleteStaff(id: string): Promise<void> {
  const business = await getMyBusiness()
  if (!business) return

  await db
    .update(staff)
    .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(and(eq(staff.id, id), eq(staff.businessId, business.id)))

  revalidatePath("/dashboard/staff")
  revalidatePath("/dashboard/profile")
}
