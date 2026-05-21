# Agente de Notificaciones Automáticas

## Rol
Envía recordatorios y confirmaciones a clientes y profesionales en los momentos clave del ciclo de vida de un turno. Opera bajo un modelo multi-tenant donde **cada negocio tiene su propia integración de WhatsApp** configurada durante el onboarding.

---

## Arquitectura WhatsApp multi-tenant

Bookzi opera como **Business Solution Provider (BSP)** de Meta. Esto significa:

- Bookzi aprueba los templates de mensajes **una sola vez** durante el desarrollo
- Cada negocio conecta su **propio número de WhatsApp Business** via Embedded Signup
- Los mensajes salen del número del negocio (no de un número genérico de Bookzi)
- Cada negocio tiene su propio `whatsapp_access_token` y `phone_number_id` almacenado en la tabla `businesses`

### Fase 1 — MVP: número compartido de Bookzi
Durante el MVP, todos los mensajes salen de un único número de Bookzi. Los templates se aprueban durante el desarrollo. Los mensajes incluyen el nombre del negocio en el contenido.

### Fase 2 — Número propio por negocio (Embedded Signup)
Cada admin conecta su número en el onboarding. Ver sección "Onboarding del admin" más abajo.

---

## Disparadores

| Evento | Canal | Tiempo | Destinatario |
|---|---|---|---|
| Turno creado | WhatsApp + Email | Inmediato | Cliente |
| Turno confirmado por el profesional | WhatsApp | Inmediato | Cliente |
| Recordatorio previo (largo) | WhatsApp | 24h antes | Cliente |
| Recordatorio previo (corto) | WhatsApp | 2h antes | Cliente |
| Turno cancelado | WhatsApp + Email | Inmediato | Cliente + Profesional |
| Turno reprogramado | WhatsApp + Email | Inmediato | Cliente + Profesional |
| Nuevo turno recibido | WhatsApp | Inmediato | Profesional |
| Turno completado | WhatsApp | 1h después | Cliente (solicitud de reseña) |

---

## Inputs

```typescript
{
  appointment_id: string
  event_type: NotificationEvent
  recipient: 'client' | 'professional'
  business_id: string   // para obtener el token WA del negocio correcto
}
```

## Outputs
- Mensaje enviado vía WhatsApp Business API (con el token del negocio correspondiente)
- Registro en tabla `notifications` con estado (`sent`, `failed`, `pending`)
- En caso de fallo WA → fallback automático a email vía Resend

---

## Templates de mensajes (aprobados por Bookzi como BSP)

Los siguientes templates se aprueban una sola vez en Meta. Las variables `{entre_llaves}` son dinámicas por turno.

### Confirmación de turno (cliente)
```
¡Hola {nombre}! Tu turno en *{negocio}* está confirmado.
📅 {dia}, {fecha} a las {hora}
💈 {servicio} con {staff}
📍 {direccion}

¿Necesitás cancelar o reprogramar? Respondé este mensaje.
```

### Recordatorio 24h (cliente)
```
¡Hola {nombre}! Te recordamos que mañana tenés turno en *{negocio}*.
⏰ {hora} — {servicio}

¿Todo bien? Si necesitás cambiar algo, avisanos con tiempo.
```

### Recordatorio 2h (cliente)
```
¡Hola {nombre}! En 2 horas tenés turno en *{negocio}*.
⏰ {hora} — {servicio} con {staff}

¡Te esperamos!
```

### Cancelación (cliente)
```
¡Hola {nombre}! Tu turno del {fecha} a las {hora} en *{negocio}* fue cancelado.

Si querés reservar otro horario: {link_booking}
```

### Nuevo turno recibido (profesional)
```
📅 Nuevo turno recibido en *{negocio}*
👤 {nombre_cliente} — {telefono_cliente}
🕐 {dia} {fecha} a las {hora}
💈 {servicio}
```

### Solicitud de reseña (cliente)
```
¡Hola {nombre}! Esperamos que hayas quedado conforme con {servicio} en *{negocio}*.
⭐ ¿Nos dejás una reseña rápida?
{link_resena}
```

---

## Onboarding del admin — Conexión de WhatsApp (Fase 2)

Cuando un administrador crea su cuenta en Bookzi, el paso de configuración de WhatsApp funciona así:

### Flujo Embedded Signup

```
1. Admin entra a Bookzi por primera vez
2. Onboarding step: "Conectá tu WhatsApp Business"
3. Bookzi abre popup con el flujo OAuth de Meta:
   → Admin inicia sesión en Facebook
   → Selecciona o crea su cuenta de Meta Business
   → Conecta su número de teléfono (debe ser un número dedicado,
     no puede ser el mismo que usa para WhatsApp personal)
   → Verifica el número con SMS o llamada
4. Meta devuelve: { access_token, phone_number_id, waba_id }
5. Bookzi guarda estos datos encriptados en la tabla businesses:
   → whatsapp_access_token (encriptado en reposo)
   → whatsapp_phone_number_id
   → whatsapp_waba_id
   → whatsapp_connected_at
6. ✅ Listo — los mensajes del negocio salen de su propio número
```

### Requisito para el admin
- Tener una **página de Facebook** o cuenta de Meta Business
- Un **número de teléfono dedicado** para el negocio (puede ser el de la recepción, no el personal)
- El número NO puede tener WhatsApp personal activo previamente (o hay que migrar)

### ¿Qué pasa si el admin no conecta WhatsApp?
- Las notificaciones se envían por **email únicamente** (vía Resend)
- El panel muestra un banner: "Conectá tu WhatsApp para enviar recordatorios automáticos"
- El admin puede completar la conexión en cualquier momento desde Configuración

---

## Lógica de envío multi-tenant

```typescript
async function sendWhatsAppNotification(appointmentId: string, event: NotificationEvent) {
  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
    with: { business: true, client: true, service: true, staff: true }
  })

  // Usar el token del negocio si tiene WA conectado, si no → email
  const { whatsapp_access_token, whatsapp_phone_number_id } = appointment.business

  if (!whatsapp_access_token) {
    return sendEmailFallback(appointment, event)
  }

  await metaCloudAPI.sendTemplate({
    accessToken: decrypt(whatsapp_access_token),  // desencriptar en uso
    phoneNumberId: whatsapp_phone_number_id,
    to: appointment.client.phone,
    template: getTemplateForEvent(event),
    variables: buildTemplateVariables(appointment)
  })
}
```

---

## Servicios externos

| Servicio | Uso | Costo |
|---|---|---|
| **Meta Cloud API** | Envío de mensajes WA (con token de cada negocio) | 1.000 conv./mes gratis, luego por conversación |
| **Resend** | Email de fallback y confirmaciones | 3.000 emails/mes gratis |
| **Upstash Redis + BullMQ** | Cola de mensajes programados (recordatorios 24h/2h) | 10.000 comandos/día gratis |

---

## Notas críticas

- Respetar la zona horaria del negocio (`business.timezone`) para calcular los tiempos de envío
- Los `whatsapp_access_token` se almacenan encriptados en la DB — nunca en texto plano ni en logs
- Si el canal WhatsApp falla → fallback automático a email (sin intervención manual)
- Los templates están aprobados por Bookzi como BSP — cada negocio que se conecta los hereda automáticamente, sin trámite adicional
- Idempotencia: verificar en tabla `notifications` antes de enviar que no existe un envío exitoso para el mismo `(appointment_id, event, channel)`
