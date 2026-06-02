"use server"

import { db } from "@bookzi/db"
import { appointments, services, staff, availability, availabilityBlocks } from "@bookzi/db/schema"
import { eq, and, gte, lt, isNull, ne, or, count, sum, sql } from "drizzle-orm"
import { getMyBusiness } from "./business"

const TZ_OFFSET = 3 * 60 * 60 * 1000 // UTC-3 Argentina (fijo, sin DST desde 2008)
const MS_PER_DAY = 24 * 60 * 60 * 1000

export type AnalyticsPeriod = "this_week" | "this_month" | "last_month" | "3_months" | "12_months"
export type AnalyticsFilter = { staffId?: string; serviceId?: string }

function mondayOfWeek(d: Date): number {
  const arDay = new Date(d.getTime() - TZ_OFFSET)
  const dow = arDay.getUTCDay()
  const daysToMonday = dow === 0 ? 6 : dow - 1
  const mondayAR = new Date(arDay)
  mondayAR.setUTCDate(arDay.getUTCDate() - daysToMonday)
  mondayAR.setUTCHours(0, 0, 0, 0)
  return mondayAR.getTime() + TZ_OFFSET
}

function getPeriodBounds(period: AnalyticsPeriod, now: Date) {
  const nowAR = new Date(now.getTime() - TZ_OFFSET)
  const y = nowAR.getUTCFullYear()
  const m = nowAR.getUTCMonth()

  switch (period) {
    case "this_week": {
      const weekStart = mondayOfWeek(now)
      return {
        start:     new Date(weekStart),
        end:       new Date(weekStart + 7 * MS_PER_DAY),
        prevStart: new Date(weekStart - 7 * MS_PER_DAY),
        prevEnd:   new Date(weekStart),
      }
    }
    case "last_month":
      return {
        start:     new Date(Date.UTC(y, m - 1, 1) + TZ_OFFSET),
        end:       new Date(Date.UTC(y, m,     1) + TZ_OFFSET),
        prevStart: new Date(Date.UTC(y, m - 2, 1) + TZ_OFFSET),
        prevEnd:   new Date(Date.UTC(y, m - 1, 1) + TZ_OFFSET),
      }
    case "3_months":
      return {
        start:     new Date(Date.UTC(y, m - 2, 1) + TZ_OFFSET),
        end:       new Date(Date.UTC(y, m + 1, 1) + TZ_OFFSET),
        prevStart: new Date(Date.UTC(y, m - 5, 1) + TZ_OFFSET),
        prevEnd:   new Date(Date.UTC(y, m - 2, 1) + TZ_OFFSET),
      }
    case "12_months":
      return {
        start:     new Date(Date.UTC(y - 1, m + 1, 1) + TZ_OFFSET),
        end:       new Date(Date.UTC(y,     m + 1, 1) + TZ_OFFSET),
        prevStart: new Date(Date.UTC(y - 2, m + 1, 1) + TZ_OFFSET),
        prevEnd:   new Date(Date.UTC(y - 1, m + 1, 1) + TZ_OFFSET),
      }
    default: // this_month
      return {
        start:     new Date(Date.UTC(y, m,     1) + TZ_OFFSET),
        end:       new Date(Date.UTC(y, m + 1, 1) + TZ_OFFSET),
        prevStart: new Date(Date.UTC(y, m - 1, 1) + TZ_OFFSET),
        prevEnd:   new Date(Date.UTC(y, m,     1) + TZ_OFFSET),
      }
  }
}

function percentDiff(current: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((current - prev) / prev) * 100)
}

function timeStrToMinutes(t: string): number {
  const parts = t.split(":").map(Number)
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

function blockedMinutesInDay(
  blocks: { startsAt: Date; endsAt: Date }[],
  dayStartMs: number,
  dayEndMs: number,
): number {
  let total = 0
  for (const b of blocks) {
    const bStart = Math.max(b.startsAt.getTime(), dayStartMs)
    const bEnd   = Math.min(b.endsAt.getTime(),   dayEndMs)
    if (bEnd > bStart) total += (bEnd - bStart) / 60000
  }
  return total
}

// ─────────────────────────────────────────────────────────────────────────────

export async function getAnalytics(
  period: AnalyticsPeriod = "this_month",
  filter?: AnalyticsFilter,
) {
  const business = await getMyBusiness()
  if (!business) return null

  const now = new Date()
  const { start, end, prevStart, prevEnd } = getPeriodBounds(period, now)

  // Condiciones extras por filtro activo
  const apptFilter = [
    ...(filter?.staffId   ? [eq(appointments.staffId,   filter.staffId)]   : []),
    ...(filter?.serviceId ? [eq(appointments.serviceId, filter.serviceId)] : []),
  ]

  const [
    [currentCounts],
    [revenueData],
    [prevData],
    topServicesRows,
    clientsThisPeriod,
    previousClientIds,
    apptTimings,
    availRules,
    avBlocks,
  ] = await Promise.all([

    db.select({
      total:     count(appointments.id),
      completed: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'completed' THEN 1 END)`,
      cancelled: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'cancelled' THEN 1 END)`,
    })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, business.id),
      gte(appointments.startAt, start),
      lt(appointments.startAt, end),
      isNull(appointments.deletedAt),
      ...apptFilter,
    )),

    db.select({ revenue: sum(appointments.priceSnapshot) })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, business.id),
      gte(appointments.startAt, start),
      lt(appointments.startAt, end),
      isNull(appointments.deletedAt),
      ne(appointments.status, "cancelled"),
      ...apptFilter,
    )),

    db.select({ revenue: sum(appointments.priceSnapshot) })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, business.id),
      gte(appointments.startAt, prevStart),
      lt(appointments.startAt, prevEnd),
      isNull(appointments.deletedAt),
      ne(appointments.status, "cancelled"),
      ...apptFilter,
    )),

    // Top servicios — no filtrar por serviceId aquí (solo tiene sentido en vista global o por staff)
    db.select({ name: services.name, total: count(appointments.id) })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(and(
      eq(appointments.businessId, business.id),
      gte(appointments.startAt, start),
      lt(appointments.startAt, end),
      isNull(appointments.deletedAt),
      ne(appointments.status, "cancelled"),
      ...(filter?.staffId ? [eq(appointments.staffId, filter.staffId)] : []),
    ))
    .groupBy(services.name)
    .orderBy(count(appointments.id))
    .limit(5),

    db.selectDistinct({ clientId: appointments.clientId })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, business.id),
      gte(appointments.startAt, start),
      lt(appointments.startAt, end),
      isNull(appointments.deletedAt),
      ne(appointments.status, "cancelled"),
      ...apptFilter,
    )),

    db.selectDistinct({ clientId: appointments.clientId })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, business.id),
      lt(appointments.startAt, start),
      isNull(appointments.deletedAt),
      ne(appointments.status, "cancelled"),
      ...apptFilter,
    )),

    db.select({ startAt: appointments.startAt, endAt: appointments.endAt })
    .from(appointments)
    .where(and(
      eq(appointments.businessId, business.id),
      gte(appointments.startAt, start),
      lt(appointments.startAt, end),
      isNull(appointments.deletedAt),
      ne(appointments.status, "cancelled"),
      ...apptFilter,
    )),

    // Para ocupación: si hay filtro por staff, usar reglas de ese staff + las globales
    db.select({
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime:   availability.endTime,
    })
    .from(availability)
    .where(and(
      eq(availability.businessId, business.id),
      eq(availability.isActive, true),
      filter?.staffId
        ? or(eq(availability.staffId, filter.staffId), isNull(availability.staffId))
        : undefined,
    )),

    db.select({ startsAt: availabilityBlocks.startsAt, endsAt: availabilityBlocks.endsAt })
    .from(availabilityBlocks)
    .where(and(
      eq(availabilityBlocks.businessId, business.id),
      lt(availabilityBlocks.startsAt, end),
      gte(availabilityBlocks.endsAt, start),
      ...(filter?.staffId ? [
        or(eq(availabilityBlocks.staffId, filter.staffId), isNull(availabilityBlocks.staffId)),
      ] : []),
    )),
  ])

  // ── Clientes ──────────────────────────────────────────────────────────────
  const totalClients = clientsThisPeriod.length
  const returningSet = new Set(previousClientIds.map(r => r.clientId))
  const returningCount = clientsThisPeriod.filter(c => returningSet.has(c.clientId)).length

  // ── Desglose semanal + minutos reservados ─────────────────────────────────
  const byDow = new Array(7).fill(0)
  let bookedMinutes = 0
  for (const { startAt, endAt } of apptTimings) {
    const arTime = new Date(new Date(startAt).getTime() - TZ_OFFSET)
    byDow[(arTime.getUTCDay() + 6) % 7]++
    bookedMinutes += (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000
  }
  const weeklyBreakdown = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((label, i) => ({
    label, count: byDow[i] as number,
  }))

  // ── Ocupación real ────────────────────────────────────────────────────────
  // No tiene sentido por servicio (los servicios no tienen horario propio)
  let occupancyRate: number | null = null
  if (!filter?.serviceId) {
    const DOW_JS: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    }
    const availMinsByDow: Record<number, number> = {}
    for (const rule of availRules) {
      const dow = DOW_JS[rule.dayOfWeek as string]
      if (dow === undefined) continue
      const mins = timeStrToMinutes(rule.endTime as string) - timeStrToMinutes(rule.startTime as string)
      if (mins > 0) availMinsByDow[dow] = (availMinsByDow[dow] ?? 0) + mins
    }
    const blocks = avBlocks.map(b => ({ startsAt: new Date(b.startsAt), endsAt: new Date(b.endsAt) }))
    let totalAvailableMinutes = 0
    const cursor = new Date(start)
    while (cursor.getTime() < end.getTime()) {
      const dow = cursor.getUTCDay()
      const dayMins = availMinsByDow[dow] ?? 0
      if (dayMins > 0) {
        const blocked = blockedMinutesInDay(blocks, cursor.getTime(), cursor.getTime() + MS_PER_DAY)
        totalAvailableMinutes += Math.max(0, dayMins - blocked)
      }
      cursor.setTime(cursor.getTime() + MS_PER_DAY)
    }
    if (totalAvailableMinutes > 0) {
      occupancyRate = Math.min(100, Math.round((bookedMinutes / totalAvailableMinutes) * 100))
    }
  }

  const totalAppts  = Number(currentCounts?.total ?? 0)
  const completed   = Number(currentCounts?.completed ?? 0)
  const cancelled   = Number(currentCounts?.cancelled ?? 0)
  const revenue     = Number(revenueData?.revenue ?? 0)
  const prevRevenue = Number(prevData?.revenue ?? 0)

  return {
    thisMonth:   { total: totalAppts, completed, cancelled, revenue },
    prevMonth:   { revenue: prevRevenue },
    revTrend:    percentDiff(revenue, prevRevenue),
    topServices: topServicesRows.map(s => ({ name: s.name, total: Number(s.total) })),
    clients:     { new: totalClients - returningCount, returning: returningCount, total: totalClients },
    occupancyRate,
    cancelRate:  totalAppts > 0 ? Math.round((cancelled / totalAppts) * 100) : 0,
    avgTicket:   completed > 0 ? Math.round(revenue / completed) : 0,
    weeklyBreakdown,
    bookedMinutes:    Math.round(bookedMinutes),
    availableMinutes: 0, // se calcula internamente, no se expone en drilldown
  }
}

// ── Resumen por espacio / servicio (para las tarjetas del dashboard principal) ──

export async function getAnalyticsSummary(period: AnalyticsPeriod = "this_month") {
  const business = await getMyBusiness()
  if (!business) return null

  const now = new Date()
  const { start, end } = getPeriodBounds(period, now)

  const [staffRows, serviceRows] = await Promise.all([

    // Staff activo con sus métricas del período
    db.select({
      id:      staff.id,
      name:    staff.name,
      total:   count(appointments.id),
      revenue: sum(appointments.priceSnapshot),
    })
    .from(staff)
    .leftJoin(appointments, and(
      eq(appointments.staffId, staff.id),
      gte(appointments.startAt, start),
      lt(appointments.startAt, end),
      isNull(appointments.deletedAt),
      ne(appointments.status, "cancelled"),
    ))
    .where(and(
      eq(staff.businessId, business.id),
      eq(staff.isActive, true),
      isNull(staff.deletedAt),
    ))
    .groupBy(staff.id, staff.name)
    .orderBy(staff.name),

    // Servicios activos con sus métricas del período
    db.select({
      id:      services.id,
      name:    services.name,
      total:   count(appointments.id),
      revenue: sum(appointments.priceSnapshot),
    })
    .from(services)
    .leftJoin(appointments, and(
      eq(appointments.serviceId, services.id),
      gte(appointments.startAt, start),
      lt(appointments.startAt, end),
      isNull(appointments.deletedAt),
      ne(appointments.status, "cancelled"),
    ))
    .where(and(
      eq(services.businessId, business.id),
      eq(services.isActive, true),
      isNull(services.deletedAt),
    ))
    .groupBy(services.id, services.name)
    .orderBy(services.name),
  ])

  return {
    staff: staffRows.map(r => ({
      id:      r.id,
      name:    r.name,
      total:   Number(r.total),
      revenue: Number(r.revenue ?? 0),
    })),
    services: serviceRows.map(r => ({
      id:      r.id,
      name:    r.name,
      total:   Number(r.total),
      revenue: Number(r.revenue ?? 0),
    })),
  }
}

// ── Nombre de un espacio o servicio para el header del drill-down ─────────────

export async function getFilterLabel(type: "staff" | "service", id: string) {
  const business = await getMyBusiness()
  if (!business) return null

  if (type === "staff") {
    const [row] = await db
      .select({ name: staff.name })
      .from(staff)
      .where(and(eq(staff.id, id), eq(staff.businessId, business.id)))
      .limit(1)
    return row?.name ?? null
  }

  const [row] = await db
    .select({ name: services.name })
    .from(services)
    .where(and(eq(services.id, id), eq(services.businessId, business.id)))
    .limit(1)
  return row?.name ?? null
}
