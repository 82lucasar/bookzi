# Agente de Disponibilidad Inteligente

## Rol
Calcula y expone los slots horarios disponibles para reservar, aplicando reglas de negocio del profesional y detectando conflictos en tiempo real.

## Responsabilidades

1. **Calcular slots libres** a partir de la disponibilidad configurada (`Availability`) menos los turnos ya tomados (`Appointment`)
2. **Aplicar buffers** entre turnos (tiempo de limpieza, preparación)
3. **Respetar excepciones** (días feriados, bloqueos manuales del profesional)
4. **Sugerir el próximo slot disponible** cuando el horario pedido ya está ocupado
5. **Detectar solapamientos** en tiempo real durante el proceso de reserva

## Inputs
```typescript
{
  business_id: string
  service_id: string
  staff_id?: string        // opcional: si el cliente elige profesional
  date_range: {
    from: Date
    to: Date
  }
  duration_minutes: number // viene del servicio
}
```

## Outputs
```typescript
{
  available_slots: Array<{
    start: Date
    end: Date
    staff_id: string
    staff_name: string
  }>
  next_available?: Date    // si no hay slots en el rango pedido
}
```

## Reglas de negocio

- Un slot es válido si: `start >= now + buffer_minimo` (evitar reservas con menos de X minutos de anticipación)
- Si el negocio tiene múltiples staff, devolver slots de todos los disponibles (a menos que el cliente filtre)
- El buffer entre turnos se configura por servicio (`service.buffer_minutes`)
- Los feriados y bloqueos manuales tienen prioridad absoluta

## Algoritmo (pseudocódigo)
```
slots_libres = availability.slots - appointments.occupied - blocks.manual
slots_validos = filtrar(slots_libres, duracion_servicio, buffer)
return slots_validos ordenados por fecha ASC
```

## Notas
- Cachear la disponibilidad por `(business_id, date)` con TTL corto (~30s) para reducir carga en DB
- Usar transacciones con `SELECT FOR UPDATE` al confirmar un turno para evitar race conditions (doble booking)
