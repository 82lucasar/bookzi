# Server Actions — Referencia de API

Next.js 15 App Router con `"use server"`. Todas las funciones se ejecutan en el servidor y se invocan directamente desde componentes de React o mediante `<form action={...}>`.

Ruta base del código: `apps/web/lib/actions/`

---

## booking.ts — Flujo de reserva pública

Acciones sin autenticación requerida. Las llama el flujo `/book/[slug]`, que es la página pública de reservas del negocio.

---

### `getBookingBusiness`

Carga los datos de un negocio y su lista de servicios activos a partir del slug de la URL.

**Parámetros**

| Nombre | Tipo     | Descripción                          |
|--------|----------|--------------------------------------|
| `slug` | `string` | Slug único del negocio (ej: `"ana-garcia-4x2k"`) |

**Retorno**

```typescript
{
  business: Business
  services: Service[]
} | null
```

Retorna `null` si el negocio no existe o tiene `deletedAt` no nulo.

**Errores posibles**

- No lanza excepciones. Retorna `null` si el slug no corresponde a ningún negocio activo.

**Ejemplo de uso**

```typescript
// app/book/[slug]/page.tsx
import { getBookingBusiness } from "@/lib/actions/booking"

export default async function BookPage({ params }: { params: { slug: string } }) {
  const data = await getBookingBusiness(params.slug)
  if (!data) return notFound()
  // ...
}
```

---

### `getAvailableSlots`

Calcula los horarios disponibles para un servicio en una fecha dada. Descuenta los turnos ya reservados y, si la fecha es hoy, los horarios que ya pasaron (con un buffer de 60 minutos).

**Parámetros**

| Nombre       | Tipo     | Descripción                                        |
|--------------|----------|----------------------------------------------------|
| `businessId` | `string` | UUID del negocio                                   |
| `serviceId`  | `string` | UUID del servicio                                  |
| `dateStr`    | `string` | Fecha en formato `YYYY-MM-DD`                      |

**Retorno**

```typescript
string[] // ej: ["09:00", "09:30", "10:00"]
```

Array de strings `HH:MM` en hora local Argentina (UTC-3). Retorna array vacío si no hay disponibilidad configurada para ese día.

**Lógica interna**

1. Resuelve el día de la semana a partir de `dateStr` usando `T12:00:00-03:00` para evitar cruce de día con UTC.
2. Consulta la tabla `availability` para ese `dayOfWeek` (sin `staffId`, es decir, disponibilidad del negocio completo).
3. Genera slots cada `durationMinutes + bufferMinutes`.
4. Filtra slots que se superponen con turnos existentes que no estén `cancelled`.
5. Si la fecha es hoy, filtra slots con `startTime <= horaActualArgentina + 60min`.

**Errores posibles**

- No lanza excepciones. Retorna `[]` si el servicio no existe.

**Ejemplo de uso**

```typescript
// Llamada desde un Server Component o Server Action
const slots = await getAvailableSlots(businessId, serviceId, "2026-06-15")
// ["10:00", "10:30", "11:00", ...]
```

---

### `bookAppointment`

Crea un turno nuevo desde el formulario público de reserva. Maneja de forma atómica: buscar o crear cliente, subir comprobante de pago (opcional), insertar el turno y enviar emails de notificación.

**Parámetros** (via `FormData`)

| Campo            | Tipo            | Requerido | Descripción                               |
|------------------|-----------------|-----------|-------------------------------------------|
| `businessId`     | `string`        | Sí        | UUID del negocio                          |
| `serviceId`      | `string`        | Sí        | UUID del servicio seleccionado            |
| `date`           | `string`        | Sí        | Fecha en formato `YYYY-MM-DD`             |
| `time`           | `string`        | Sí        | Hora en formato `HH:MM`                   |
| `clientName`     | `string`        | Sí        | Nombre completo del cliente               |
| `clientPhone`    | `string`        | Sí        | Teléfono (se usa para buscar cliente existente) |
| `clientEmail`    | `string`        | No        | Email del cliente                         |
| `paymentProof`   | `File`          | No        | Imagen o PDF del comprobante de pago      |

**Retorno**

No retorna valor. Ejecuta `redirect()` a `/book/confirmed?id={appointmentId}` al finalizar.

**Efectos secundarios**

- Upsert de cliente por `(businessId, phone)`.
- Auto-crea un registro de `staff` si el negocio no tiene ninguno activo.
- Sube el comprobante a Supabase Storage en el bucket `payment-proofs` (falla silenciosamente si hay error de upload).
- Envía dos emails en paralelo: confirmación al cliente y notificación al profesional.

**Errores posibles**

| Error                         | Causa                                         |
|-------------------------------|-----------------------------------------------|
| `"Servicio no encontrado"`    | El `serviceId` no existe en la base de datos  |
| `"Sin personal disponible"`   | El negocio no tiene staff y falla la auto-creación |

**Ejemplo de uso**

```typescript
// app/book/[slug]/components/BookingForm.tsx
<form action={bookAppointment}>
  <input type="hidden" name="businessId" value={business.id} />
  <input type="hidden" name="serviceId" value={selectedService.id} />
  <input type="hidden" name="date" value={selectedDate} />
  <input type="hidden" name="time" value={selectedSlot} />
  <input name="clientName" />
  <input name="clientPhone" />
  <input name="clientEmail" />
  <input name="paymentProof" type="file" accept="image/*,.pdf" />
  <button type="submit">Confirmar turno</button>
</form>
```

---

### `getAppointmentPublic`

Carga los datos básicos de un turno para mostrar la pantalla de confirmación post-reserva. No requiere autenticación.

**Parámetros**

| Nombre | Tipo     | Descripción        |
|--------|----------|--------------------|
| `id`   | `string` | UUID del turno     |

**Retorno**

```typescript
{
  id: string
  status: AppointmentStatus
  startAt: Date
  endAt: Date
  priceSnapshot: string | null
  paymentProofUrl: string | null
  serviceName: string
  clientName: string
  businessName: string
} | null
```

Retorna `null` si el `id` está vacío o el turno no existe.

**Ejemplo de uso**

```typescript
// app/book/confirmed/page.tsx
import { getAppointmentPublic } from "@/lib/actions/booking"

export default async function ConfirmedPage({ searchParams }: { searchParams: { id: string } }) {
  const appt = await getAppointmentPublic(searchParams.id)
  if (!appt) return notFound()
}
```

---

## appointments.ts — CRUD de turnos del dashboard

Todas las acciones requieren sesión activa. Internamente llaman a `getMyBusiness()` para resolver el negocio del usuario autenticado y limitar el scope de cada operación.

---

### `getAppointment`

Carga el detalle completo de un turno específico, validando que pertenezca al negocio del usuario.

**Parámetros**

| Nombre | Tipo     | Descripción    |
|--------|----------|----------------|
| `id`   | `string` | UUID del turno |

**Retorno**

```typescript
{
  id: string
  startAt: Date
  endAt: Date
  status: AppointmentStatus
  notes: string | null
  priceSnapshot: string | null
  paymentProofUrl: string | null
  serviceId: string
  serviceName: string
  durationMinutes: number
  clientName: string
  clientPhone: string | null
  clientEmail: string | null
  businessId: string
} | null
```

Retorna `null` si el usuario no tiene negocio, el turno no existe, o el turno no pertenece al negocio.

**Errores posibles**

- No lanza excepciones.

**Ejemplo de uso**

```typescript
// app/dashboard/appointments/[id]/page.tsx
const appt = await getAppointment(params.id)
if (!appt) return notFound()
```

---

### `getAppointments`

Lista los turnos del negocio con filtros de rango temporal. Excluye turnos cancelados y con soft-delete.

**Parámetros**

| Nombre   | Tipo                               | Descripción                              |
|----------|------------------------------------|------------------------------------------|
| `filter` | `"upcoming" \| "today" \| "past"` | Rango temporal. Default: `"upcoming"` |

**Retorno**

```typescript
Array<{
  id: string
  startAt: Date
  endAt: Date
  status: AppointmentStatus
  notes: string | null
  priceSnapshot: string | null
  serviceName: string
  clientName: string
  clientPhone: string | null
  clientEmail: string | null
}>
```

Límite: 50 registros. El orden es `startAt ASC` para upcoming/today, `startAt DESC` para past.

**Lógica de filtros**

| Valor       | Condición SQL                                    |
|-------------|--------------------------------------------------|
| `"today"`   | `startAt >= today_00:00` AND `startAt < today_24:00` |
| `"upcoming"`| `startAt >= today_00:00`                         |
| `"past"`    | `startAt < today_00:00`                          |

**Ejemplo de uso**

```typescript
// app/dashboard/appointments/page.tsx
const appointments = await getAppointments("upcoming")
```

---

### `getAppointmentsForCalendar`

Carga los turnos de los últimos 7 días hacia adelante para renderizar la vista de agenda. Excluye cancelados.

**Parámetros**

Ninguno.

**Retorno**

```typescript
Array<{
  id: string
  startAt: Date
  endAt: Date
  status: AppointmentStatus
  clientName: string
  serviceName: string
}>
```

Límite: 500 registros. Ordenado por `startAt ASC`.

**Ejemplo de uso**

```typescript
// app/dashboard/agenda/page.tsx
const events = await getAppointmentsForCalendar()
```

---

### `confirmAppointment`

Cambia el estado de un turno de `pending` a `confirmed`. Solo opera si el turno está actualmente en `pending`.

**Parámetros**

| Nombre          | Tipo     | Descripción    |
|-----------------|----------|----------------|
| `appointmentId` | `string` | UUID del turno |

**Retorno**

`void`

**Efectos secundarios**

- Revalida el cache de `/dashboard/appointments`, `/dashboard/agenda` y `/dashboard`.
- Envía email de confirmación al cliente (si tiene email registrado).

**Errores posibles**

- Si el usuario no tiene negocio, retorna sin hacer nada (no lanza excepción).

**Ejemplo de uso**

```typescript
// Desde un Server Action de formulario
<form action={confirmAppointment.bind(null, appointmentId)}>
  <button type="submit">Confirmar</button>
</form>
```

---

### `cancelAppointment`

Cancela un turno y lo marca como cancelado por el profesional.

**Parámetros**

| Nombre          | Tipo     | Descripción    |
|-----------------|----------|----------------|
| `appointmentId` | `string` | UUID del turno |

**Retorno**

`void`

**Efectos secundarios**

- Setea `cancelledAt = now()`, `cancelledBy = "professional"`.
- Revalida cache de las rutas del dashboard.
- Envía email de cancelación al cliente y al profesional en paralelo.

**Errores posibles**

- Si el usuario no tiene negocio, retorna sin hacer nada.

---

### `rescheduleAppointment`

Cambia la fecha y hora de un turno y lo deja en estado `confirmed`.

**Parámetros**

| Nombre            | Tipo     | Descripción                            |
|-------------------|----------|----------------------------------------|
| `id`              | `string` | UUID del turno                         |
| `newDate`         | `string` | Nueva fecha en formato `YYYY-MM-DD`    |
| `newTime`         | `string` | Nueva hora en formato `HH:MM`          |
| `durationMinutes` | `number` | Duración del servicio (para calcular `endAt`) |

**Retorno**

`void`

**Efectos secundarios**

- Recalcula `startAt` y `endAt` con zona horaria `UTC-3`.
- Setea `status = "confirmed"` y actualiza `updatedAt`.
- Revalida cache del dashboard.
- Envía email de reprogramación al cliente y al profesional.

**Errores posibles**

| Error                          | Causa                                  |
|--------------------------------|----------------------------------------|
| `"No se encontró el negocio"`  | El usuario no tiene negocio registrado |

**Ejemplo de uso**

```typescript
await rescheduleAppointment(appt.id, "2026-07-01", "10:30", appt.durationMinutes)
```

---

### `createDashboardAppointment`

Crea un turno manualmente desde el dashboard (sin pasar por el flujo público). El turno se crea en estado `pending`.

**Parámetros**

```typescript
data: {
  clientName: string
  clientPhone: string
  clientEmail: string
  serviceId: string
  date: string    // YYYY-MM-DD
  time: string    // HH:MM
}
```

**Retorno**

```typescript
string // ID del turno creado
```

**Efectos secundarios**

- Upsert de cliente por `(businessId, phone)`.
- Auto-crea staff si no existe.
- Revalida cache de `/dashboard`.
- No envía emails (creación manual por el profesional).

**Errores posibles**

| Error                          | Causa                                   |
|--------------------------------|-----------------------------------------|
| `"No se encontró el negocio"`  | El usuario no tiene negocio registrado  |
| `"Servicio no encontrado"`     | El `serviceId` no existe                |

---

## business.ts — Gestión del negocio

---

### `getMyBusiness`

Resuelve el negocio del usuario autenticado. Es la función de autenticación/autorización usada internamente por todos los demás actions del dashboard.

**Parámetros**

Ninguno. Lee el usuario desde la sesión de Supabase.

**Retorno**

```typescript
Business | null
```

Retorna `null` si el usuario no está autenticado o no tiene negocio creado.

**Ejemplo de uso**

```typescript
// Internamente en otros actions
const business = await getMyBusiness()
if (!business) return null
```

---

### `createBusiness`

Crea el negocio del usuario durante el onboarding. Genera un slug único y crea el primer registro de staff automáticamente.

**Parámetros** (via `FormData`)

| Campo      | Tipo     | Requerido | Descripción                          |
|------------|----------|-----------|--------------------------------------|
| `name`     | `string` | Sí        | Nombre del negocio                   |
| `category` | `string` | No        | Categoría (ej: `"peluquería"`)        |
| `phone`    | `string` | No        | Teléfono de contacto                 |

**Retorno**

No retorna valor. Ejecuta `redirect()` a `/onboarding/services`.

**Lógica del slug**

El slug se genera a partir del nombre: lowercase, sin acentos, caracteres no alfanuméricos reemplazados por guiones, más 4 caracteres aleatorios. Ej: `"Ana García"` → `"ana-garcia-4x2k"`.

**Efectos secundarios**

- Crea un registro en `staff` con los datos del dueño del negocio.
- El email del negocio se toma del usuario autenticado en Supabase.

**Errores posibles**

- Si el usuario no está autenticado, ejecuta `redirect("/login")`.

**Ejemplo de uso**

```typescript
// app/onboarding/business/page.tsx
<form action={createBusiness}>
  <input name="name" placeholder="Nombre del negocio" />
  <input name="category" placeholder="Categoría" />
  <input name="phone" placeholder="Teléfono" />
  <button type="submit">Crear negocio</button>
</form>
```

---

## services.ts — Gestión de servicios

---

### `getServices`

Lista los servicios activos del negocio del usuario autenticado.

**Parámetros**

Ninguno.

**Retorno**

```typescript
Service[] // ordenado por createdAt ASC
```

Solo incluye servicios con `isActive = true` y `deletedAt IS NULL`.

**Ejemplo de uso**

```typescript
const services = await getServices()
```

---

### `createService`

Crea un nuevo servicio para el negocio del usuario.

**Parámetros** (via `FormData`)

| Campo             | Tipo     | Requerido | Descripción                             |
|-------------------|----------|-----------|-----------------------------------------|
| `name`            | `string` | Sí        | Nombre del servicio                     |
| `description`     | `string` | No        | Descripción larga                       |
| `durationMinutes` | `string` | Sí        | Duración en minutos (se parsea a int)   |
| `bufferMinutes`   | `string` | No        | Buffer entre turnos en minutos. Default: `0` |
| `price`           | `string` | No        | Precio (se guarda como string numérico) |

**Retorno**

No retorna valor. Ejecuta `redirect()` a `/dashboard/services`.

**Efectos secundarios**

- La moneda se fija en `"ARS"`.
- Revalida cache de `/dashboard/services`.

**Errores posibles**

- Si el usuario no tiene negocio, ejecuta `redirect("/dashboard/setup")`.

---

### `saveOnboardingServices`

Guarda múltiples servicios en bulk durante el onboarding. Ignora los que tengan nombre vacío.

**Parámetros**

```typescript
servicesData: Array<{
  name: string
  durationMinutes: number
  price: string
  maxPerDay?: number | null
}>
```

**Retorno**

No retorna valor. Ejecuta `redirect()` a `/onboarding/availability`.

**Ejemplo de uso**

```typescript
await saveOnboardingServices([
  { name: "Corte de cabello", durationMinutes: 30, price: "5000" },
  { name: "Coloración", durationMinutes: 120, price: "12000", maxPerDay: 3 },
])
```

---

### `deleteService`

Soft-delete de un servicio: setea `deletedAt` y `isActive = false`.

**Parámetros**

| Nombre      | Tipo     | Descripción       |
|-------------|----------|-------------------|
| `serviceId` | `string` | UUID del servicio |

**Retorno**

`void`

**Efectos secundarios**

- Revalida cache de `/dashboard/services`.
- No elimina el registro de la base de datos (soft-delete).

---

## availability.ts — Disponibilidad horaria

---

### `getAvailability`

Carga la configuración de disponibilidad semanal del negocio. Si no hay configuración, retorna un horario por defecto (lunes a viernes, 09:00–18:00).

**Parámetros**

Ninguno.

**Retorno**

```typescript
DayConfig[]

type DayConfig = {
  day: string           // "monday" | "tuesday" | ... | "sunday"
  isActive: boolean     // si el negocio atiende ese día
  startTime: string     // "HH:MM"
  endTime: string       // "HH:MM"
  enabledServiceIds: string[]  // IDs de servicios habilitados ese día
}
```

Siempre retorna los 7 días en orden de lunes a domingo.

**Horario por defecto**

Lunes a viernes activos, 09:00–18:00, sin servicios asignados. Sábado y domingo inactivos.

**Ejemplo de uso**

```typescript
// app/dashboard/availability/page.tsx
const schedule = await getAvailability()
```

---

### `saveAvailability`

Guarda la configuración de disponibilidad semanal completa. Realiza un replace total: elimina todos los registros existentes y los reinserta.

**Parámetros**

```typescript
days: DayConfig[]
```

**Retorno**

`void`

**Efectos secundarios**

- Elimina todos los registros de `availability` del negocio donde `staffId IS NULL`.
- Elimina en cascada los registros relacionados en `availability_services`.
- Reinserta los 7 días y los servicios habilitados por día.
- Revalida cache de `/dashboard/availability`.

**Advertencia**

La operación no es transaccional en caso de fallo parcial entre el `delete` y el `insert`. Si el insert falla, la disponibilidad queda vacía hasta el próximo guardado.

**Ejemplo de uso**

```typescript
await saveAvailability([
  { day: "monday", isActive: true, startTime: "09:00", endTime: "17:00", enabledServiceIds: ["uuid-1"] },
  { day: "tuesday", isActive: true, startTime: "09:00", endTime: "17:00", enabledServiceIds: ["uuid-1", "uuid-2"] },
  // ...
])
```
