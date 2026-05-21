# Agente de Analítica de Agenda

## Rol
Genera insights sobre el rendimiento de la agenda del profesional/negocio: ocupación, ingresos proyectados, clientes recurrentes y patrones de cancelación.

## Métricas que produce

### Ocupación
- % de slots ocupados vs. disponibles por semana/mes
- Horas pico de mayor demanda
- Días con mayor y menor ocupación

### Clientes
- Tasa de retención (clientes que vuelven en los últimos 90 días)
- Clientes nuevos vs. recurrentes por período
- Clientes con mayor frecuencia de turnos

### Cancelaciones
- Tasa de cancelación (%) por período
- Tiempo promedio de aviso antes de cancelar
- Servicios con mayor tasa de cancelación

### Ingresos (si el negocio usa precios)
- Ingresos realizados vs. proyectados
- Ticket promedio por servicio
- Proyección del mes en curso

## Outputs

### Dashboard (datos para el frontend)
```typescript
{
  period: { from: Date, to: Date }
  occupancy_rate: number           // porcentaje
  total_appointments: number
  completed: number
  cancelled: number
  new_clients: number
  returning_clients: number
  top_services: Array<{ name: string, count: number }>
  peak_hours: Array<{ hour: number, count: number }>
  revenue_realized?: number
  revenue_projected?: number
}
```

### Alertas automáticas al profesional
- "Tenés 3 slots libres esta tarde — ¿querés anunciarlos en redes?"
- "Tu tasa de cancelación subió 15% este mes"
- "Tu próximo mes está al 80% de ocupación — considerá abrir más horarios"

## Frecuencia de cálculo
- Métricas del dashboard: calculadas on-demand o con cache de 1h
- Alertas: evaluadas una vez por día (cron job)

## Notas
- Respetar el timezone del negocio en todos los cálculos
- Las métricas de ingresos solo se muestran si el negocio tiene precios cargados en sus servicios
- En v1 estas métricas son cálculos SQL directos; en v2 evaluar migrar a una capa de analytics dedicada
