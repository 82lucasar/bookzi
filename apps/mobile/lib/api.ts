const BASE = "https://bookzi-api-production.up.railway.app/api/v1"

async function get<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message ?? `API ${res.status}: ${path}`)
  }
  return res.json()
}

async function patch<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

export type BusinessPublic = {
  id: string
  name: string
  slug: string
  category: string
  phone: string | null
  address: string | null
}

export type ServicePublic = {
  id: string
  businessId: string
  name: string
  description: string | null
  durationMinutes: number
  price: string
  currency: string
  isActive: boolean
}

export type AppointmentPublic = {
  id: string
  status: string
  startAt: string
  endAt: string
  priceSnapshot: string | null
  serviceName: string
  businessName: string
  clientName: string
}

export async function getPublicBusiness(slug: string): Promise<{ business: BusinessPublic; services: ServicePublic[] }> {
  return get(`/public/businesses/${slug}`)
}

export async function getSlots(businessId: string, serviceId: string, date: string): Promise<{ slots: string[] }> {
  return get(`/public/slots?businessId=${businessId}&serviceId=${serviceId}&date=${date}`)
}

export async function createPublicAppointment(data: {
  businessId: string
  serviceId: string
  date: string
  time: string
  clientName: string
  clientPhone: string
  clientEmail?: string
}): Promise<{ appointmentId: string }> {
  return post("/public/appointments", data)
}

export async function getPublicAppointment(id: string): Promise<AppointmentPublic> {
  return get(`/public/appointments/${id}`)
}

// ─── Professional endpoints (require auth token) ─────────────────────────────

export type Appointment = {
  id: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  startAt: string
  endAt: string
  clientName: string
  clientPhone: string | null
  clientEmail: string | null
  serviceName: string
  priceSnapshot: string | null
  currency: string | null
  notes: string | null
}

export type Business = {
  id: string
  name: string
  slug: string
  category: string
  phone: string | null
  email: string | null
}

export async function getMyBusiness(token: string): Promise<Business> {
  return get("/me/business", token)
}

export async function getAppointments(token: string, params?: { date?: string; status?: string }): Promise<Appointment[]> {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""
  return get(`/appointments${qs}`, token)
}

export async function updateAppointmentStatus(
  token: string,
  id: string,
  status: "confirmed" | "cancelled" | "completed"
): Promise<void> {
  return patch(`/appointments/${id}/status`, { status }, token)
}

export type Service = {
  id: string
  name: string
  durationMinutes: number
  price: string
  currency: string
  isActive: boolean
}

export async function getServices(token: string): Promise<Service[]> {
  return get("/services", token)
}

export async function createAppointment(token: string, data: {
  clientName: string
  clientPhone: string
  clientEmail?: string
  serviceId: string
  date: string
  time: string
  notes?: string
  sendNotification?: boolean
}): Promise<Appointment> {
  return post("/appointments", data, token)
}

export async function getAppointmentDetail(token: string, id: string): Promise<Appointment & {
  clientEmail: string | null
  clientPhone: string | null
  paymentProofUrl: string | null
  currencySnapshot: string | null
}> {
  return get(`/appointments/${id}`, token)
}
