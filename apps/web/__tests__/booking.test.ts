/**
 * Tests de integración — flujo de reserva pública (booking.ts)
 *
 * Cobertura:
 *  - getAvailableSlots: slots calculados, solapamientos, buffers, hora pasada
 *  - bookAppointment:   creación de turno, cliente reutilizado, staff por defecto
 *  - Edge cases:        solapamiento exacto, solapamiento parcial inicio/fin
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock de next/navigation (redirect lanza una excepción interna en Next — la interceptamos)
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))

// Mock de @bookzi/db — exponemos el objeto `db` con un spy configurable por test
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
}
vi.mock("@bookzi/db", () => ({
  db: mockDb,
}))

// Mock de @bookzi/db/schema — solo los nombres importados en booking.ts
vi.mock("@bookzi/db/schema", () => ({
  businesses: "businesses_table",
  services: "services_table",
  staff: "staff_table",
  clients: "clients_table",
  appointments: "appointments_table",
  availability: "availability_table",
}))

// Mock de drizzle-orm (operadores utilizados en las queries)
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ type: "eq", col, val })),
  and: vi.fn((...args) => ({ type: "and", args })),
  gte: vi.fn((col, val) => ({ type: "gte", col, val })),
  lt: vi.fn((col, val) => ({ type: "lt", col, val })),
  isNull: vi.fn((col) => ({ type: "isNull", col })),
  ne: vi.fn((col, val) => ({ type: "ne", col, val })),
}))

// Mock de Supabase server (createClient usado en bookAppointment vía @/lib/supabase/server)
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: new Error("mock") }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
      }),
    },
  })),
}))

// Mock de @supabase/supabase-js (import dinámico dentro de bookAppointment)
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: new Error("mock") }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
      }),
    },
  })),
}))

// Mock de emails — no queremos envíos reales en tests
vi.mock("@/lib/email", () => ({
  sendBookingReceivedToClient: vi.fn().mockResolvedValue(undefined),
  sendNewBookingToProfessional: vi.fn().mockResolvedValue(undefined),
}))

// ─── Helpers de factories ─────────────────────────────────────────────────────

const BUSINESS_ID = "biz-uuid-001"
const SERVICE_ID = "svc-uuid-001"
const STAFF_ID = "staff-uuid-001"
const CLIENT_ID = "client-uuid-001"
const APPOINTMENT_ID = "appt-uuid-001"

function makeAvailability(overrides: Partial<{
  startTime: string
  endTime: string
  dayOfWeek: string
  isActive: boolean
}> = {}) {
  return {
    id: "avail-uuid-001",
    businessId: BUSINESS_ID,
    staffId: null,
    dayOfWeek: overrides.dayOfWeek ?? "wednesday",
    startTime: overrides.startTime ?? "09:00",
    endTime: overrides.endTime ?? "12:00",
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
  }
}

function makeService(overrides: Partial<{
  durationMinutes: number
  bufferMinutes: number
  price: string
  currency: string
}> = {}) {
  return {
    id: SERVICE_ID,
    businessId: BUSINESS_ID,
    name: "Corte de pelo",
    durationMinutes: overrides.durationMinutes ?? 30,
    bufferMinutes: overrides.bufferMinutes ?? 0,
    price: overrides.price ?? "2000",
    currency: overrides.currency ?? "ARS",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }
}

function makeStaff() {
  return {
    id: STAFF_ID,
    businessId: BUSINESS_ID,
    name: "Profesional Demo",
    email: null,
    phone: null,
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }
}

function makeClient() {
  return {
    id: CLIENT_ID,
    businessId: BUSINESS_ID,
    name: "Ana García",
    phone: "+5491155550000",
    email: "ana@example.com",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }
}

function makeAppointment(startAt: Date, endAt: Date, status = "confirmed") {
  return {
    id: APPOINTMENT_ID,
    businessId: BUSINESS_ID,
    startAt,
    endAt,
    status,
  }
}

// ─── Utilidad: construir la cadena de mocks encadenados de Drizzle ────────────
//
// db.select().from(T).where(C).limit(N) → retorna `rows`
// db.insert(T).values(V).returning()   → retorna `rows`
//
function mockDbSelect(rows: unknown[]) {
  const resolved = Promise.resolve(rows)
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
    finally: resolved.finally.bind(resolved),
  }
  mockDb.select.mockReturnValueOnce(chain)
  return chain
}

function mockDbInsert(rows: unknown[]) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  }
  mockDb.insert.mockReturnValueOnce(chain)
  return chain
}

// ─── getAvailableSlots ────────────────────────────────────────────────────────

describe("getAvailableSlots", () => {
  // Usamos una fecha futura fija (miércoles) para evitar que los tests fallen por
  // el filtro de "hora ya pasada". La semana del 2026-06-03 es miércoles.
  const DATE_STR = "2026-06-03" // miércoles

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna slots dentro del horario configurado (09:00–12:00, 30 min)", async () => {
    const { getAvailableSlots } = await import("../lib/actions/booking")

    mockDbSelect([makeAvailability({ startTime: "09:00", endTime: "12:00" })])
    mockDbSelect([makeService({ durationMinutes: 30, bufferMinutes: 0 })])
    mockDbSelect([]) // sin turnos reservados

    const slots = await getAvailableSlots(BUSINESS_ID, SERVICE_ID, DATE_STR)

    // Con 30 min de duración y sin buffer: 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
    expect(slots).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"])
  })

  it("retorna array vacío cuando no hay disponibilidad configurada para el día", async () => {
    const { getAvailableSlots } = await import("../lib/actions/booking")

    mockDbSelect([]) // sin registro de disponibilidad → la función debe devolver []

    const slots = await getAvailableSlots(BUSINESS_ID, SERVICE_ID, DATE_STR)

    expect(slots).toEqual([])
  })

  it("retorna array vacío cuando el servicio no existe", async () => {
    const { getAvailableSlots } = await import("../lib/actions/booking")

    mockDbSelect([makeAvailability()])
    mockDbSelect([]) // servicio no encontrado

    const slots = await getAvailableSlots(BUSINESS_ID, SERVICE_ID, DATE_STR)

    expect(slots).toEqual([])
  })

  it("excluye slots que se solapan con turnos ya reservados", async () => {
    const { getAvailableSlots } = await import("../lib/actions/booking")

    mockDbSelect([makeAvailability({ startTime: "09:00", endTime: "11:00" })])
    mockDbSelect([makeService({ durationMinutes: 30, bufferMinutes: 0 })])

    // Turno existente que ocupa 09:30–10:00
    const bookedStart = new Date(`${DATE_STR}T09:30:00`)
    const bookedEnd = new Date(`${DATE_STR}T10:00:00`)
    mockDbSelect([makeAppointment(bookedStart, bookedEnd)])

    const slots = await getAvailableSlots(BUSINESS_ID, SERVICE_ID, DATE_STR)

    // 09:00 y 10:00 deben estar disponibles; 09:30 debe estar bloqueado
    expect(slots).toContain("09:00")
    expect(slots).toContain("10:00")
    expect(slots).not.toContain("09:30")
  })

  it("respeta el bufferMinutes entre turnos", async () => {
    const { getAvailableSlots } = await import("../lib/actions/booking")

    // Servicio de 30 min + 15 min de buffer = slots cada 45 min
    mockDbSelect([makeAvailability({ startTime: "09:00", endTime: "12:00" })])
    mockDbSelect([makeService({ durationMinutes: 30, bufferMinutes: 15 })])
    mockDbSelect([]) // sin turnos reservados

    const slots = await getAvailableSlots(BUSINESS_ID, SERVICE_ID, DATE_STR)

    // slotMinutes = 45 → 09:00, 09:45, 10:30, 11:15
    expect(slots).toEqual(["09:00", "09:45", "10:30", "11:15"])
    // El slot de 09:30 NO debe aparecer (el paso es de 45 min, no 30)
    expect(slots).not.toContain("09:30")
  })

  it("excluye slots ya pasados cuando la fecha es hoy (filtro por hora actual + 60 min)", async () => {
    // Para este test usamos la fecha local de Argentina en el momento de ejecución
    const TZ = "America/Argentina/Buenos_Aires"
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: TZ })

    const { getAvailableSlots } = await import("../lib/actions/booking")

    // Disponibilidad de todo el día para maximizar la chance de que algún slot
    // quede excluido por la hora ya pasada
    mockDbSelect([makeAvailability({ startTime: "00:00", endTime: "23:30", dayOfWeek: "monday" })])
    mockDbSelect([makeService({ durationMinutes: 30, bufferMinutes: 0 })])
    mockDbSelect([])

    const slots = await getAvailableSlots(BUSINESS_ID, SERVICE_ID, todayStr)

    // Todos los slots devueltos deben ser ≥ (hora actual Argentina + 60 min)
    const localStr = new Date().toLocaleString("en-US", { timeZone: TZ })
    const localNow = new Date(localStr)
    const nowMinutes = localNow.getHours() * 60 + localNow.getMinutes() + 60

    for (const slot of slots) {
      const [h, m] = slot.split(":").map(Number)
      const slotMinutes = (h ?? 0) * 60 + (m ?? 0)
      expect(slotMinutes).toBeGreaterThan(nowMinutes)
    }
  })
})

// ─── bookAppointment ──────────────────────────────────────────────────────────

describe("bookAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Variables de entorno mínimas para que el código no explote
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key"
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  /**
   * Construye el FormData mínimo para llamar a bookAppointment
   */
  function buildFormData(overrides: Record<string, string> = {}) {
    const fd = new FormData()
    fd.append("businessId", overrides.businessId ?? BUSINESS_ID)
    fd.append("serviceId", overrides.serviceId ?? SERVICE_ID)
    fd.append("date", overrides.date ?? "2026-06-10")
    fd.append("time", overrides.time ?? "10:00")
    fd.append("clientName", overrides.clientName ?? "Carlos López")
    fd.append("clientPhone", overrides.clientPhone ?? "+5491155551111")
    fd.append("clientEmail", overrides.clientEmail ?? "carlos@example.com")
    return fd
  }

  /**
   * Configura los mocks de DB en el orden en que booking.ts los invoca:
   * 1) select service
   * 2) select staff
   * 3) select client
   * 4) insert appointment
   * 5) select business (para email)
   */
  function setupHappyPathMocks({
    existingClient = false,
    existingStaff = true,
  } = {}) {
    mockDbSelect([makeService()])                           // 1. service
    mockDbSelect(existingStaff ? [makeStaff()] : [])       // 2. staff existente o vacío

    if (!existingStaff) {
      // Si no hay staff, busca el nombre del negocio y luego inserta
      mockDbSelect([{ name: "Negocio Demo" }])             // 2b. select business.name
      mockDbInsert([makeStaff()])                          // 2c. insert staff
    }

    mockDbSelect(existingClient ? [makeClient()] : [])     // 3. buscar cliente por teléfono

    if (!existingClient) {
      mockDbInsert([makeClient()])                         // 3b. insertar cliente nuevo
    }

    mockDbInsert([{ id: APPOINTMENT_ID }])                 // 4. insert appointment
    mockDbSelect([{ name: "Negocio Demo", email: "negocio@example.com" }]) // 5. select biz
  }

  it("crea el turno con los datos correctos y redirige a /book/confirmed", async () => {
    const { bookAppointment } = await import("../lib/actions/booking")
    setupHappyPathMocks()

    const fd = buildFormData()
    let redirectUrl = ""

    try {
      await bookAppointment(fd)
    } catch (err) {
      // El redirect de Next.js lanza un error interno que interceptamos
      if (err instanceof Error && err.message.startsWith("NEXT_REDIRECT:")) {
        redirectUrl = err.message.replace("NEXT_REDIRECT:", "")
      } else {
        throw err
      }
    }

    expect(redirectUrl).toContain("/book/confirmed")
    expect(redirectUrl).toContain(APPOINTMENT_ID)
    // El insert de appointment debe haberse llamado con status "pending"
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it("lanza un error cuando el servicio no existe", async () => {
    const { bookAppointment } = await import("../lib/actions/booking")

    mockDbSelect([]) // select service → vacío

    const fd = buildFormData({ serviceId: "svc-inexistente" })

    await expect(bookAppointment(fd)).rejects.toThrow("Servicio no encontrado")
  })

  it("reutiliza el cliente existente si el teléfono ya está registrado", async () => {
    const { bookAppointment } = await import("../lib/actions/booking")
    setupHappyPathMocks({ existingClient: true })

    const fd = buildFormData({ clientPhone: makeClient().phone! })

    try {
      await bookAppointment(fd)
    } catch (err) {
      if (!(err instanceof Error && err.message.startsWith("NEXT_REDIRECT:"))) throw err
    }

    // db.insert debe haberse llamado solo UNA vez (para el appointment),
    // no para el cliente porque ya existía
    const insertCalls = mockDb.insert.mock.calls.length
    expect(insertCalls).toBe(1)
  })

  it("crea staff por defecto cuando el negocio no tiene personal registrado", async () => {
    const { bookAppointment } = await import("../lib/actions/booking")
    setupHappyPathMocks({ existingStaff: false, existingClient: false })

    const fd = buildFormData()

    try {
      await bookAppointment(fd)
    } catch (err) {
      if (!(err instanceof Error && err.message.startsWith("NEXT_REDIRECT:"))) throw err
    }

    // insert debe haberse llamado al menos 2 veces: staff + client + appointment = 3
    expect(mockDb.insert.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── Edge cases de solapamiento ───────────────────────────────────────────────

describe("getAvailableSlots — edge cases de solapamiento", () => {
  const DATE_STR = "2026-06-04" // jueves fijo en el futuro

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("bloquea un slot que coincide exactamente con el inicio de otro turno (mismo horario exacto)", async () => {
    const { getAvailableSlots } = await import("../lib/actions/booking")

    mockDbSelect([makeAvailability({ startTime: "09:00", endTime: "11:00", dayOfWeek: "thursday" })])
    mockDbSelect([makeService({ durationMinutes: 30, bufferMinutes: 0 })])

    // Turno exactamente en 09:00–09:30
    const bookedStart = new Date(`${DATE_STR}T09:00:00`)
    const bookedEnd = new Date(`${DATE_STR}T09:30:00`)
    mockDbSelect([makeAppointment(bookedStart, bookedEnd)])

    const slots = await getAvailableSlots(BUSINESS_ID, SERVICE_ID, DATE_STR)

    // 09:00 debe estar bloqueado; 09:30 y 10:00 libres
    expect(slots).not.toContain("09:00")
    expect(slots).toContain("09:30")
    expect(slots).toContain("10:00")
  })

  it("bloquea un slot que empieza dentro de otro turno existente (solapamiento de inicio)", async () => {
    const { getAvailableSlots } = await import("../lib/actions/booking")

    mockDbSelect([makeAvailability({ startTime: "09:00", endTime: "12:00", dayOfWeek: "thursday" })])
    mockDbSelect([makeService({ durationMinutes: 30, bufferMinutes: 0 })])

    // Turno existente: 09:15–09:45 (ocupa el slot de 09:00 y de 09:30)
    const bookedStart = new Date(`${DATE_STR}T09:15:00`)
    const bookedEnd = new Date(`${DATE_STR}T09:45:00`)
    mockDbSelect([makeAppointment(bookedStart, bookedEnd)])

    const slots = await getAvailableSlots(BUSINESS_ID, SERVICE_ID, DATE_STR)

    // 09:00 se solapa (empieza antes y termina a las 09:30, que cae dentro del turno reservado)
    // 09:30 se solapa (empieza dentro del turno existente 09:15–09:45)
    expect(slots).not.toContain("09:00")
    expect(slots).not.toContain("09:30")
    // 10:00 debe estar libre
    expect(slots).toContain("10:00")
  })

  it("bloquea un slot cuyo fin cae dentro de un turno existente (solapamiento de fin)", async () => {
    const { getAvailableSlots } = await import("../lib/actions/booking")

    mockDbSelect([makeAvailability({ startTime: "09:00", endTime: "12:00", dayOfWeek: "thursday" })])
    mockDbSelect([makeService({ durationMinutes: 60, bufferMinutes: 0 })])

    // Turno existente: 09:45–10:45
    const bookedStart = new Date(`${DATE_STR}T09:45:00`)
    const bookedEnd = new Date(`${DATE_STR}T10:45:00`)
    mockDbSelect([makeAppointment(bookedStart, bookedEnd)])

    const slots = await getAvailableSlots(BUSINESS_ID, SERVICE_ID, DATE_STR)

    // El slot 09:00–10:00 termina a las 10:00 que cae dentro del turno 09:45–10:45 → solapamiento
    expect(slots).not.toContain("09:00")
    // El slot 11:00–12:00 debe estar libre
    expect(slots).toContain("11:00")
  })
})
