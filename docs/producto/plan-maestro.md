# Bookzi — Plan Maestro del Proyecto

> **Plataforma:** bookzi.app  
> **Versión del plan:** 1.1  
> **Fecha:** Mayo 2026  
> **Estado:** En planificación  
> **Criterio de stack:** sin costos de suscripción — solo herramientas gratuitas, open source o sin cuota mensual fija

---

## 1. Visión del producto

Bookzi es un sistema SaaS de gestión de turnos y reservas online para profesionales, consultorios, centros médicos, estética, educación y servicios en general. Permite a cualquier profesional o negocio tener su propia agenda inteligente online en minutos, sin conocimientos técnicos.

### Propuesta de valor

| Para el profesional | Para el cliente |
|---|---|
| Elimina el tiempo en llamadas de coordinación | Reserva en cualquier momento, sin llamar |
| Reduce el ausentismo con recordatorios automáticos | Confirmación inmediata por WhatsApp |
| Centraliza la agenda y el historial de clientes | Reprograma o cancela con un clic |
| Analytics de ocupación e ingresos | Recordatorios 24h y 2h antes del turno |

### Mercados objetivo (en orden de prioridad)

1. **Salud y bienestar** — psicólogos, médicos, dentistas, kinesiólogos, nutricionistas
2. **Estética y belleza** — peluquerías, salones de belleza, barberías, spas
3. **Educación** — profesores particulares, coaches, tutores, academias
4. **Servicios profesionales** — abogados, contadores, consultores, arquitectos
5. **Fitness** — entrenadores personales, yoga, pilates, crossfit

### Tagline

_Tu agenda inteligente para profesionales y negocios_

---

## 2. Stack técnico — sin costos de suscripción

**Criterio de selección:** todas las herramientas son gratuitas en su tier base. Sin tarjeta de crédito requerida para arrancar. Escalables a planes pagos cuando el negocio lo justifique.

### Tabla completa

| Capa | Herramienta | Por qué | Free tier |
|---|---|---|---|
| **Frontend web** | Next.js 15 + Tailwind v4 + TypeScript | SSR, App Router, ecosistema React | Open source |
| **App móvil** | React Native 0.82+ (New Architecture) | +80% código compartido con web | Open source |
| **Backend API** | Node.js 18+ + Fastify + TypeScript | Rápido, type-safe, mismo lenguaje que frontend | Open source |
| **ORM** | Drizzle ORM | Type-safe, cercano a SQL, sin codegen | Open source |
| **Base de datos** | **Neon** (PostgreSQL serverless) | Branching por PR, scale-to-zero, compatible 100% con PG | 0.5 GB · 1 proyecto |
| **Cache / Cola** | **Upstash Redis** + BullMQ | Serverless Redis, perfecto para colas async | 10.000 comandos/día · 256 MB |
| **Auth** | **Supabase Auth** | Usuarios, sesiones, OAuth social, MFA | 50.000 usuarios activos/mes |
| **Email** | **Resend** | API simple, alta deliverability, templates React | 3.000 emails/mes · 1 dominio |
| **WhatsApp** | **Meta Cloud API** | Oficial, webhooks, templates pre-aprobados | 1.000 conversaciones/mes gratis |
| **Pagos** | **Mercado Pago** | Líder LatAm, checkout embebido | Sin cuota — solo comisión por transacción |
| **Hosting backend** | **Railway** | Deploy desde GitHub, PostgreSQL/Redis incluidos, zero-config | $5 crédito/mes (cubre MVP básico) |
| **Hosting frontend** | **Vercel** | Deploy automático desde GitHub, CDN global | Proyectos ilimitados · 100 GB bandwidth |
| **Repositorio** | **GitHub** | CI/CD, Actions, Issues, Projects | Repos privados ilimitados |
| **CI/CD** | **GitHub Actions** | Integrado con el repo, workflows YAML | 2.000 minutos/mes |
| **Mobile build** | **EAS Build (Expo)** | Builds iOS y Android en la nube | 30 builds/mes · todas las plataformas |
| **Error tracking** | **Sentry** | Alertas de errores en tiempo real | 5.000 errores/mes · 1 proyecto |
| **Monitoreo** | **Grafana Cloud** | Dashboards, alertas, logs | 10.000 series métricas · 50 GB logs |
| **Diseño / Mockups** | **Figma** | Herramienta de diseño colaborativo | 3 proyectos · editores ilimitados (viewer) |

### Herramientas de desarrollo local (todas gratuitas)

| Herramienta | Uso |
|---|---|
| Docker Desktop | PostgreSQL + Redis locales para desarrollo |
| VS Code | Editor (con extensiones TypeScript, Tailwind, Prettier) |
| Neon CLI | Gestión de branches de DB por feature |
| Railway CLI | Deploy y logs desde terminal |
| Expo Go | Testing de la app móvil en dispositivo físico sin build |

---

## 3. Arquitectura del sistema

```
                     ┌──────────────────────────────────┐
                     │        bookzi.app (Vercel)        │
                     │  Next.js 15 · App Router · CDN   │
                     │  Landing · Dashboard · Booking    │
                     └───────────────┬──────────────────┘
                                     │ HTTPS / API calls
                     ┌───────────────▼──────────────────┐
                     │      Bookzi API (Railway)         │
                     │    Node.js + Fastify + Drizzle    │
                     │    /api/v1/...                    │
                     └───┬──────────┬──────────┬─────────┘
                         │          │          │
              ┌──────────▼──┐ ┌─────▼────┐ ┌──▼──────────────┐
              │    Neon      │ │ Upstash  │ │  Supabase Auth  │
              │ PostgreSQL   │ │  Redis   │ │  (JWT / OAuth)  │
              │ (serverless) │ │ + BullMQ │ │                 │
              └─────────────┘ └─────┬────┘ └─────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │   Workers de cola   │
                          │   (Railway worker)  │
                          ├────────────────────┤
                          │ WhatsApp → Meta API │
                          │ Email    → Resend   │
                          │ Push     → FCM/APNs │
                          └────────────────────┘

         ┌────────────────────────────────────────────┐
         │         App Móvil (React Native)            │
         │  iOS (App Store) + Android (Play Store)     │
         │  EAS Build · Expo Go (dev) · Fastlane       │
         └────────────────────────────────────────────┘
```

### Flujo de un turno (extremo a extremo)

```
Cliente abre link → Booking flow (Vercel/Next.js)
  → GET /api/v1/slots (Railway API → Neon DB)
  → POST /api/v1/appointments (con SELECT FOR UPDATE en Neon)
  → Job encolado en Upstash Redis (BullMQ)
  → Worker envía WA (Meta Cloud API) + Email (Resend)
  → Profesional ve el turno en su panel
  → Confirma → Worker envía confirmación al cliente
```

---

## 4. Modelo de datos (entidades principales)

```
Business ──┬── Service ──── staff_services ──┐
           ├── Staff ───────────────────────┤
           ├── Client                        │
           ├── Availability                  │
           └── Appointment ◄────────────────┘
                  │
                  ├── Notification
                  ├── Waitlist
                  └── AuditLog
```

### Estados de un turno

```
  pending ──► confirmed ──► completed
     │              │
     └──► cancelled  └──► rescheduled ──► confirmed
```

---

## 5. Fases del proyecto

### Resumen

| Fase | Nombre | Duración estimada | Estado |
|---|---|---|---|
| 0 | Fundamentos | 3 semanas | ✅ Completada |
| 1 | MVP | 10–12 semanas | 🔲 Próxima |
| 2 | Producto completo | 8–10 semanas | 🔲 Pendiente |
| 3 | Mobile & escala | 8–10 semanas | 🔲 Pendiente |
| 4 | Crecimiento SaaS | Ongoing | 🔲 Pendiente |

---

### Fase 0 — Fundamentos ✅

| Entregable | Estado |
|---|---|
| Investigación de nombre (Bookzi) | ✅ |
| Manual de marca v1.0 | ✅ |
| Estructura de carpetas del proyecto | ✅ |
| Agentes de producto (4 agentes) | ✅ |
| Equipo de agentes de desarrollo (9 agentes) | ✅ |
| Plan maestro del proyecto | ✅ (este documento) |

---

### Fase 1 — MVP (10–12 semanas)

**Objetivo:** Un profesional configura su agenda y comparte un link. Sus clientes reservan, reciben confirmación y recordatorios automáticos por WhatsApp. Todo con herramientas gratuitas.

#### Setup inicial — Semanas 1–2

| Tarea | Herramienta | Agente |
|---|---|---|
| Crear repositorio GitHub (monorepo con Turborepo) | GitHub (gratis) | `bookzi-devops` |
| Configurar Neon — proyecto + branch `main` y `develop` | Neon free tier | `bookzi-database` |
| Configurar Upstash Redis | Upstash free tier | `bookzi-devops` |
| Configurar Supabase Auth (project + JWT config) | Supabase free tier | `bookzi-backend` |
| Pipeline CI/CD GitHub Actions (test → lint → deploy Railway) | GitHub Actions (gratis) | `bookzi-devops` |
| Schema inicial PostgreSQL + migraciones con Drizzle | Neon | `bookzi-database` |
| Proyecto Next.js 15 en Vercel (deploy automático desde GitHub) | Vercel (gratis) | `bookzi-frontend` |
| Proyecto API Fastify en Railway (deploy desde GitHub) | Railway free tier | `bookzi-backend` |
| Worker BullMQ en Railway (servicio separado) | Railway free tier | `bookzi-backend` |

#### Backend API core — Semanas 3–5

| Endpoint | Descripción | Agente |
|---|---|---|
| `POST /api/v1/businesses` | Registro del negocio | `bookzi-backend` |
| `PUT /api/v1/businesses/:id` | Configuración del negocio | `bookzi-backend` |
| `CRUD /api/v1/services` | Gestión de servicios | `bookzi-backend` |
| `CRUD /api/v1/staff` | Gestión de equipo | `bookzi-backend` |
| `CRUD /api/v1/availability` | Franjas horarias por día | `bookzi-backend` |
| `GET /api/v1/slots` | Slots disponibles (anti-double-booking) | `bookzi-backend` + `bookzi-database` |
| `POST /api/v1/appointments` | Crear turno con `SELECT FOR UPDATE` | `bookzi-backend` |
| `PATCH /api/v1/appointments/:id/status` | Confirmar / cancelar | `bookzi-backend` |
| `GET /api/v1/appointments` | Lista del panel del profesional | `bookzi-backend` |
| `POST /api/v1/webhooks/whatsapp` | Webhook entrante de Meta | `bookzi-backend` |

#### Frontend web MVP — Semanas 5–8

| Pantalla | Descripción | Agente |
|---|---|---|
| **Onboarding del profesional** | Setup guiado: negocio → servicios → horarios | `bookzi-frontend` + `bookzi-design` |
| **Panel — Agenda del día** | Lista de turnos, badges de estado, confirmar/cancelar | `bookzi-frontend` + `bookzi-design` |
| Gestión de servicios | CRUD con precio y duración | `bookzi-frontend` |
| Configuración de disponibilidad | Horarios por día + bloqueos | `bookzi-frontend` |
| **Booking flow (link público del cliente)** | Wizard: servicio → horario → datos → confirm | `bookzi-frontend` + `bookzi-design` |
| Pantalla de confirmación | Turno confirmado con resumen | `bookzi-frontend` + `bookzi-design` |
| Cancelación / reprogramación (desde link en WA) | Flujo sin login para el cliente | `bookzi-frontend` |

#### Notificaciones WhatsApp — Semanas 8–10

**Modelo:** Bookzi opera como Business Solution Provider (BSP) de Meta. Cada negocio conecta su propio número durante el onboarding. Los templates los aprueba Bookzi una sola vez — todos los negocios los heredan automáticamente.

| Tarea | Herramienta | Agente | Cuándo |
|---|---|---|---|
| Registrar Bookzi como BSP en Meta Business | Meta (gratis para setup) | `bookzi-backend` | **Semana 1 del desarrollo** |
| Aprobar templates de WA (confirmación, recordatorio 24h/2h, cancelación, reseña) | Meta Cloud API | `bookzi-backend` | **Semana 1** — tarda 2-4 semanas |
| MVP Fase 1: número compartido de Bookzi (un solo token) | Meta Cloud API | `bookzi-backend` | Semana 8 |
| Workers BullMQ en Railway para cola de envíos | Railway + Upstash | `bookzi-backend` | Semana 8 |
| Fallback automático a email (Resend) si WA falla | Resend free tier | `bookzi-backend` | Semana 8 |
| Registro de envíos en tabla `notifications` | Neon | `bookzi-backend` | Semana 8 |
| **Fase 2:** Embedded Signup — cada admin conecta su propio número en el onboarding | Meta Embedded Signup | `bookzi-backend` + `bookzi-frontend` | Fase 2 |

> ℹ️ **Nota de producto:** La aprobación de templates ocurre **durante el desarrollo** (semana 1), gestionada por el equipo de Bookzi como BSP. Los administradores de negocios **no necesitan hacer ningún trámite** ante Meta — solo conectan su número via Embedded Signup en el onboarding (Fase 2). En el MVP (Fase 1), los mensajes salen de un número compartido de Bookzi.

#### QA, seguridad y lanzamiento — Semanas 10–12

| Tarea | Herramienta | Agente |
|---|---|---|
| Tests de integración (booking flow + doble booking concurrente) | Vitest + DB real Neon | `bookzi-qa` |
| Auditoría de seguridad OWASP (IDOR, SQL injection, auth) | Código review | `bookzi-security` |
| Revisión de accesibilidad WCAG 2.2 | axe-core | `bookzi-design` |
| Configurar Sentry en API y frontend | Sentry free tier | `bookzi-devops` |
| Configurar alertas en Grafana Cloud | Grafana Cloud free tier | `bookzi-devops` |
| Deploy a producción en Railway + Vercel | Railway + Vercel | `bookzi-devops` |

**Criterios de aceptación del MVP:**
- ✅ Configurar negocio en < 10 minutos desde cero
- ✅ Reservar turno en < 3 pasos desde el link público
- ✅ Confirmación por WhatsApp en < 30 segundos
- ✅ Recordatorios enviados automáticamente 24h y 2h antes
- ✅ Cero doble bookings bajo tests de carga concurrente

---

### Fase 2 — Producto completo (8–10 semanas)

**Objetivo:** Analytics, pagos online, lista de espera, multi-staff y panel completo.

| Feature | Herramienta nueva | Agente | Semana |
|---|---|---|---|
| **Analytics del negocio** (ocupación, retención, ingresos) | Grafana Cloud | `bookzi-backend` + `bookzi-frontend` | 1–2 |
| **Alertas proactivas al profesional** via WA | Meta Cloud API | `bookzi-backend` | 2 |
| **Pagos online — Mercado Pago** | Mercado Pago (sin cuota) | `bookzi-backend` + `bookzi-frontend` | 3–4 |
| **Lista de espera** | — | `bookzi-backend` + `bookzi-frontend` | 4–5 |
| **Multi-staff** (agendas independientes por staff) | — | `bookzi-backend` + `bookzi-frontend` | 5–6 |
| **Historial y ficha de clientes** | — | `bookzi-frontend` | 6–7 |
| **Bloqueos manuales** (feriados, vacaciones) | — | `bookzi-frontend` | 7 |
| **Reprogramación guiada** desde panel y desde WA | — | `bookzi-backend` + `bookzi-frontend` | 7–8 |
| **Política de cancelación** configurable por negocio | — | `bookzi-backend` + `bookzi-frontend` | 8 |
| **Solicitud de reseña** (WA automático post-turno) | Meta Cloud API | `bookzi-backend` | 8 |

---

### Fase 3 — Mobile & escala (8–10 semanas)

**Objetivo:** App nativa React Native en App Store y Google Play.

#### App del profesional

| Feature | Agente | Semana |
|---|---|---|
| Navegación (Tab Navigator) | `bookzi-mobile` | 1 |
| Agenda del día (offline con MMKV) | `bookzi-mobile` | 1–2 |
| Confirmar / cancelar desde app | `bookzi-mobile` | 2 |
| Push notifications FCM + APNs | `bookzi-mobile` + `bookzi-backend` | 3 |
| Deep linking desde notificaciones | `bookzi-mobile` | 3 |
| Vista de clientes | `bookzi-mobile` | 4 |
| Configuración básica de disponibilidad | `bookzi-mobile` | 4–5 |

#### App del cliente

| Feature | Agente | Semana |
|---|---|---|
| Booking flow nativo | `bookzi-mobile` | 5–6 |
| Mis turnos (historial y próximos) | `bookzi-mobile` | 6 |
| Cancelar/reprogramar desde app | `bookzi-mobile` | 7 |
| Push notifications de recordatorio | `bookzi-mobile` | 7 |
| Publicación App Store + Google Play | `bookzi-mobile` + `bookzi-devops` | 8–10 |

---

### Fase 4 — Crecimiento SaaS (ongoing)

| Feature | Prioridad |
|---|---|
| Landing page con SEO por industria (psicólogos, peluquerías, etc.) | Alta |
| Planes y billing (Freemium → Pro → Business) | Alta |
| Widget embebible "Reservar turno" para sitios web | Alta |
| Google Calendar sync (API gratuita) | Media |
| Reportes exportables PDF/Excel | Media |
| API pública para partners | Media |
| Marketplace de profesionales por categoría y zona | Baja |
| Multi-idioma (expansión México, Colombia) | Baja |

---

## 6. Modelo de negocio SaaS

### Planes (precios en ARS)

| Plan | Precio | Incluye | Target |
|---|---|---|---|
| **Free** | Gratis siempre | 1 profesional · 30 turnos/mes · Email | Prueba / solo-professionals |
| **Starter** | ARS 8.500/mes | 1 profesional · Turnos ilimitados · WhatsApp · Analytics básico | Profesionales independientes |
| **Pro** | ARS 18.000/mes | Hasta 3 staff · Pagos online · Lista de espera · Analytics completo | Pequeños negocios |
| **Business** | ARS 45.000/mes | Hasta 10 staff · Multi-sede · Soporte prioritario | Centros médicos, centros de estética |
| **Enterprise** | A consultar | Ilimitado · SLA · Onboarding dedicado | Franquicias, cadenas |

### Métricas objetivo año 1

| Métrica | 6 meses | 12 meses |
|---|---|---|
| Negocios activos | 50 | 300 |
| Turnos procesados/mes | 2.000 | 20.000 |
| MRR | ARS 400.000 | ARS 3.500.000 |
| Churn mensual | < 5% | < 3% |
| NPS | > 40 | > 55 |

---

## 7. Límites de free tiers y puntos de upgrade

| Herramienta | Límite free | Cuándo upgradear |
|---|---|---|
| **Neon** | 0.5 GB storage | Al superar 50K turnos históricos (~300 negocios activos) |
| **Upstash Redis** | 10.000 comandos/día | Al superar ~500 notificaciones/día |
| **Resend** | 3.000 emails/mes | Al superar ~200 profesionales activos (con fallback WA) |
| **Meta Cloud API** | 1.000 conversaciones/mes | Desde el día 1 en producción — pasar a plan pago rápido |
| **Railway** | $5 crédito/mes | Al superar ~10 req/seg sostenidos |
| **Vercel** | 100 GB bandwidth | Al superar ~10.000 visitas únicas/mes |
| **GitHub Actions** | 2.000 min/mes | Si el pipeline supera ~30 min por run |
| **EAS Build** | 30 builds/mes | Durante desarrollo activo de la app móvil |
| **Sentry** | 5.000 errores/mes | Al acercarse a producción con usuarios reales |
| **Grafana Cloud** | 10K series métricas | Al agregar más de 5 servicios monitoreados |

---

## 8. Equipo de agentes

### Agentes del producto (`agentes de la app/`)

| Agente | Responsabilidad |
|---|---|
| `agente-notificaciones` | Templates WA/email, lógica de envío, fallbacks |
| `agente-disponibilidad` | Cálculo de slots libres, buffers, anti-double-booking |
| `agente-cancelaciones` | Flujo de cancelación, lista de espera, reprogramación |
| `agente-analitica` | Métricas de ocupación, retención e ingresos |

### Agentes de desarrollo (`.claude/agents/`)

| Agente | Área | Invocarlo cuando... |
|---|---|---|
| `bookzi-frontend` | Next.js 15 · React · Tailwind | Crear componentes, páginas, flujos de UI |
| `bookzi-backend` | Node.js · Fastify · Drizzle · Neon | Endpoints, reglas de negocio, integraciones |
| `bookzi-mobile` | React Native · iOS/Android | Screens, navegación, push notifications |
| `bookzi-database` | PostgreSQL · Neon · migraciones | Esquema, índices, queries lentos |
| `bookzi-devops` | Railway · Vercel · GitHub Actions | CI/CD, deploy, monitoreo |
| `bookzi-security` | OWASP · WCAG · Ley 25.326 | Auditorías de seguridad y privacidad |
| `bookzi-design` | UI/UX · NN Group · WCAG 2.2 | Revisión de diseño y accesibilidad |
| `bookzi-qa` | Vitest · Playwright · Maestro | Tests, casos de borde, cobertura |
| `bookzi-docs` | OpenAPI · ADRs · user stories | Documentación técnica y de producto |

---

## 9. Integraciones de terceros

| Servicio | Uso | Fase | Costo | Criticidad |
|---|---|---|---|---|
| **Supabase Auth** | Auth multi-tenant | Fase 1 | Gratis | 🔴 Crítica |
| **Neon** | Base de datos PostgreSQL | Fase 1 | Gratis | 🔴 Crítica |
| **Upstash** | Redis + cola BullMQ | Fase 1 | Gratis | 🔴 Crítica |
| **Meta Cloud API** | WhatsApp notifications | Fase 1 | Gratis (1K conv/mes) | 🔴 Crítica |
| **Resend** | Email transaccional | Fase 1 | Gratis (3K/mes) | 🟠 Alta |
| **Mercado Pago** | Pagos online | Fase 2 | Solo comisión | 🟠 Alta |
| **FCM (Firebase)** | Push Android | Fase 3 | Gratis | 🟠 Alta |
| **Apple APNs** | Push iOS | Fase 3 | Gratis (requiere Developer Program $99/año) | 🟠 Alta |
| **Google Calendar API** | Sync de agenda | Fase 4 | Gratis | 🟡 Media |

> ⚠️ **Apple Developer Program ($99/año):** es el único costo obligatorio si se quiere publicar en App Store. Es un costo de programa, no de suscripción de herramienta. Se puede retrasar hasta Fase 3.

---

## 10. Ambientes y deploy

| Ambiente | Hosting | Base de datos | Propósito |
|---|---|---|---|
| **Local** | Docker (PostgreSQL + Redis) | Docker local | Desarrollo sin consumir free tier |
| **Preview** | Vercel Preview + Railway PR env | Neon branch por PR | Testing de features antes de merge |
| **Staging** | Railway + Vercel | Neon branch `develop` | QA, demos, smoke tests |
| **Producción** | Railway + Vercel | Neon branch `main` | Usuarios reales |

### Flujo de desarrollo con Neon branching

```
main branch (producción)
  └── develop branch (staging)
        └── feature/nombre-feature (preview automático por PR)
              → Tests corren contra esta branch de DB
              → Merge a develop → deploy a staging
              → Merge a main → deploy a producción
```

---

## 11. Roadmap visual

```
2026
May       Jun       Jul       Ago       Sep       Oct       Nov       Dic
├─────────┤─────────┤─────────┤─────────┤─────────┤─────────┤─────────┤
│ FASE 0  │              FASE 1 — MVP                                  │
│ ✅ Done │ Setup ──► API Core ──► Frontend ──► WhatsApp ──► 🚀 MVP   │
│         │                                                            │
│         │              FASE 2 — Producto completo                   │
│         │         │ Analytics · Pagos · Waitlist · Multi-staff ────► │
│         │         │                                                  │
│         │         │                   FASE 3 — Mobile               │
│         │         │              │ RN Pro + Cliente ────────────────►│
│         │         │              │                                   │
│         │         │              │       FASE 4 — SaaS Growth        │
│         │         │              │    │ Landing · Billing · Widget ─►│
```

---

## 12. Decisiones de arquitectura pendientes

| Decisión | Opciones | Recomendación | Agente |
|---|---|---|---|
| Estructura del monorepo | Turborepo vs Nx vs Lerna | **Turborepo** — más simple, mejor integración con Vercel | `bookzi-devops` |
| Gestión de estado global web | Zustand vs Jotai | **Zustand** — consistente con mobile | `bookzi-frontend` |
| Gestión de estado mobile | Zustand vs Redux Toolkit | **Zustand** — compartir lógica con web | `bookzi-mobile` |
| Testing E2E web | Playwright vs Cypress | **Playwright** — gratis, multi-browser, integrado con CI | `bookzi-qa` |
| Gestión de formularios | React Hook Form vs TanStack Form | **React Hook Form v7 + Zod** — más estable y documentado | `bookzi-frontend` |

---

## 13. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Aprobación templates WA tarda 2-4 semanas | Alta | Alto | Iniciar registro de Bookzi como BSP en **semana 1** del desarrollo — los admins no hacen este trámite |
| Verificación de cuenta Meta Business de Bookzi | Media | Alto | Preparar documentación de la empresa antes de empezar el desarrollo |
| Admin sin número dedicado para WA Business | Alta | Medio | En el onboarding, explicar el requisito claramente; ofrecer email como alternativa sin fricción |
| Alerta legal con Booksy (nombre similar) | Media | Alto | Consultar abogado de marcas antes del lanzamiento público |
| Doble booking bajo carga concurrente | Baja | Crítico | `SELECT FOR UPDATE` + constraint GiST en Neon (ya diseñado) |
| Límites del free tier de Neon / Upstash | Media | Medio | Monitorear uso desde el día 1; upgrade es sencillo y sin migración |
| EAS Build free (30 builds/mes) insuficiente en dev activo | Alta | Bajo | Usar Expo Go en dispositivo físico para desarrollo; EAS solo para releases |

---

## 14. Convenciones del proyecto

| Aspecto | Convención |
|---|---|
| Idioma del código | Inglés (variables, funciones, comentarios técnicos) |
| Idioma de la UI | Español rioplatense (voseo) |
| Commits | Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:` |
| Branches | `main` (producción) · `develop` (staging) · `feat/nombre` |
| PRs | CI verde + 1 review antes de merge |
| Colores en UI | Siempre tokens CSS — nunca colores hardcodeados |
| Comentarios en código | Solo cuando el "por qué" no es evidente |

---

## 15. Links y recursos del proyecto

| Recurso | Ubicación |
|---|---|
| Manual de marca | `brand-manual.html` |
| Investigación del nombre | `investigacion-nombre.md` |
| Agentes del producto | `agentes de la app/` |
| Agentes de desarrollo | `.claude/agents/` |
| Instrucciones para Claude | `CLAUDE.md` |
| Documentación de API | `docs/api/` |
| Decisiones de arquitectura (ADRs) | `docs/arquitectura/` |
| Este documento | `docs/producto/plan-maestro.md` |
