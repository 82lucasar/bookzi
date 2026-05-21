# Agente de Cancelaciones y Lista de Espera

## Rol
Gestiona el flujo de cancelación y reprogramación de turnos, y notifica automáticamente a clientes en lista de espera cuando se libera un slot.

## Flujos

### Cancelación iniciada por el cliente
1. Cliente solicita cancelar (link en WhatsApp o app)
2. Verificar si la cancelación está dentro de la política del negocio (`business.cancellation_policy_hours`)
3. Si está dentro del plazo → cancelar y notificar al profesional
4. Si está fuera del plazo → mostrar advertencia (posible cargo o penalidad)
5. Liberar el slot y notificar a la lista de espera

### Cancelación iniciada por el profesional
1. Profesional cancela desde su panel
2. Notificación inmediata al cliente con disculpa y opción de reprogramar
3. Liberar el slot → notificar lista de espera

### Lista de espera
1. Cuando un slot está ocupado, el cliente puede anotarse en lista de espera
2. Al liberarse un slot, se notifica al primer cliente de la lista (FIFO)
3. El cliente tiene 30 minutos para confirmar; si no responde, se pasa al siguiente

### Reprogramación
1. Cliente o profesional solicita reprogramar
2. El agente de disponibilidad provee nuevos slots
3. Al confirmar el nuevo horario → actualizar `Appointment` y notificar ambas partes

## Estados manejados
- `confirmed` → `cancelled`
- `confirmed` → `rescheduled` → `confirmed`
- `waitlist_notified` → `confirmed` | `expired`

## Inputs
- `appointment_id`
- `action`: `cancel` | `reschedule`
- `initiated_by`: `client` | `professional`
- `new_slot?`: nuevo horario (solo para reprogramación)

## Notas
- Guardar motivo de cancelación (campo opcional) para analytics
- El tiempo de expiración de la notificación de lista de espera (30 min) es configurable por negocio
