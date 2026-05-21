# Bookzi — Contexto del Proyecto para Claude

## ¿Qué es Bookzi?

App de turnos online para profesionales y negocios que quieren optimizar su agenda y mejorar la experiencia de sus clientes. Permite reservar, confirmar, cancelar y reprogramar turnos con notificaciones automáticas por WhatsApp y email.

**Tagline:** _Tu agenda inteligente para profesionales y negocios_

---

## Estado actual del proyecto

| Etapa | Estado |
|---|---|
| Investigación de nombre | ✅ Completada |
| Manual de marca (v1.0) | ✅ Completado |
| Estructura de carpetas | ✅ Creada |
| Definición de agentes IA | 🔲 Pendiente |
| Diseño de mockups / wireframes | 🔲 Pendiente |
| Arquitectura técnica | 🔲 Pendiente |
| Desarrollo frontend | 🔲 Pendiente |
| Desarrollo backend | 🔲 Pendiente |
| App móvil | 🔲 Pendiente |

---

## Marca

### Nombre
- **Nombre:** Bookzi
- **Origen:** "Book" (reservar en inglés) + "-zi" (sufijo dinámico, moderno)
- **Pronunciación:** /buk-zi/ — funciona en español e inglés
- ⚠️ **Alerta legal:** Verificar distancia con **Booksy** (competidor en LatAm) con un abogado de marcas antes de registrar.

### Colores
| Token | Hex | Uso |
|---|---|---|
| `--primary` | `#0284C7` | Color principal, botones CTA |
| `--primary-dark` | `#0369A1` | Hover, header |
| `--primary-light` | `#38BDF8` | Acentos, highlights |
| `--secondary` | `#0EA5E9` | Variante del primario |
| `--accent` | `#059669` | Confirmación, éxito |
| `--accent-light` | `#34D399` | Estados success |
| `--bg` | `#F0F9FF` | Fondo general |
| `--text-dark` | `#0F172A` | Texto principal |
| `--text-mid` | `#334155` | Texto secundario |
| `--text-muted` | `#64748B` | Labels, captions |
| `--border` | `#E0F0F8` | Bordes |
| `--error` | `#DC2626` | Errores, cancelaciones |

### Tipografía
- **Fuente:** Plus Jakarta Sans (Google Fonts)
- Display: 48px / 800 / -1.5px
- H1: 36px / 800 / -1px
- H2: 24px / 700
- Subtitle: 18px / 600
- Body: 16px / 400 / line-height 1.6
- Caption: 12px / 500

### Logo
- Ícono de calendario con checkmark en azul
- 4 variantes: fondo blanco, fondo oscuro, fondo primario, horizontal con wordmark
- Tamaño mínimo digital: 24×24px (ícono), 120px de ancho (logo horizontal)
- Archivo de referencia: `brand-manual.html`

### Voz y tono
- **Sí:** Directo, empático, humano — "Tu turno está confirmado para el martes a las 14:30. ¡Nos vemos!"
- **No:** Robótico, burocrático — "El sistema ha procesado exitosamente su solicitud de reserva N°4521."
- Usar voseo rioplatense en español (Argentina/Uruguay)

---

## Stack técnico (definido — sin costos de suscripción)

> Criterio: todas las herramientas son gratuitas (open source, free tier o sin cuota mensual fija).

| Capa | Tecnología | Plan gratuito |
|---|---|---|
| **Frontend web** | Next.js 15 + Tailwind v4 + TypeScript | Open source |
| **App móvil** | React Native 0.82+ (New Architecture) | Open source |
| **Backend API** | Node.js 18+ + Fastify + TypeScript | Open source |
| **Base de datos** | PostgreSQL via **Neon** | Free: 0.5GB, branching por PR |
| **Cache / Cola** | Redis via **Upstash** + BullMQ | Free: 10K comandos/día |
| **Auth** | **Supabase Auth** | Free: 50K usuarios activos/mes |
| **Email** | **Resend** | Free: 3.000 emails/mes |
| **WhatsApp** | Meta Cloud API | Free: 1.000 conv./mes + setup gratis |
| **Pagos** | **Mercado Pago** | Sin cuota mensual — solo comisión por transacción |
| **Hosting backend** | **Railway** | Free tier: $5 crédito/mes |
| **Hosting frontend** | **Vercel** | Free: proyectos ilimitados |
| **CI/CD** | **GitHub Actions** | Free: 2.000 min/mes |
| **Mobile build** | **EAS Build (Expo)** | Free: 30 builds/mes |
| **Errores** | **Sentry** | Free: 5.000 errores/mes |
| **Monitoreo** | **Grafana Cloud** | Free: 10K métricas, 50GB logs |
| **IaC** | No requerido en Fase 1 — Railway maneja la infra | — |

---

## Estructura del proyecto

```
proyecto app de reservas/
├── CLAUDE.md                    ← Este archivo
├── investigacion-nombre.md      ← Research del nombre de marca
├── brand-manual.html            ← Manual de marca completo v1.0
├── agentes de la app/           ← Definición de agentes IA del proyecto
├── docs/                        ← Documentación general
│   ├── arquitectura/            ← Decisiones técnicas y diagramas
│   ├── api/                     ← Documentación de endpoints
│   └── producto/                ← PRD, user stories, roadmap
├── design/                      ← Assets de diseño
│   ├── assets/                  ← Logos, íconos exportados
│   ├── mockups/                 ← Wireframes y pantallas
│   └── tokens/                  ← Design tokens (JSON/CSS)
├── src/                         ← Código fuente
│   ├── frontend/                ← App web
│   │   ├── components/          ← Componentes reutilizables
│   │   ├── pages/               ← Vistas/rutas
│   │   ├── hooks/               ← Custom hooks
│   │   ├── styles/              ← CSS global y variables
│   │   └── utils/               ← Helpers y utilidades
│   ├── backend/                 ← API y lógica de negocio
│   │   ├── routes/              ← Definición de endpoints
│   │   ├── controllers/         ← Lógica de cada endpoint
│   │   ├── models/              ← Modelos de datos
│   │   ├── middleware/          ← Auth, validación, logging
│   │   └── services/            ← Servicios externos (WhatsApp, email)
│   └── mobile/                  ← App móvil
│       ├── screens/             ← Pantallas
│       ├── components/          ← Componentes nativos
│       └── navigation/          ← Stack de navegación
├── database/                    ← Base de datos
│   ├── migrations/              ← Migraciones de esquema
│   └── seeds/                   ← Datos de prueba
└── marketing/                   ← Materiales de marketing
    ├── landing/                 ← Landing page
    ├── social/                  ← Assets para redes sociales
    └── copy/                    ← Textos y copies
```

---

## Entidades principales (modelo de datos tentativo)

- **Business** — negocio o profesional (nombre, categoría, zona horaria, configuración)
- **Service** — servicio ofrecido (nombre, duración, precio)
- **Staff** — miembros del equipo con agenda propia
- **Client** — cliente con historial de turnos
- **Appointment** — turno (fecha/hora, servicio, cliente, estado, notas)
- **Availability** — disponibilidad horaria por staff/servicio
- **Notification** — registro de mensajes enviados (WhatsApp, email)

### Estados de un turno
`pending` → `confirmed` → `completed`  
`pending` → `confirmed` → `cancelled`  
`confirmed` → `rescheduled` → `confirmed`

---

## Convenciones de código (por confirmar)

- Idioma del código: **inglés** (variables, funciones, comentarios técnicos)
- Idioma de la UI y copy: **español rioplatense**
- Commits: convención Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- Sin comentarios obvios en el código — solo cuando el "por qué" no es evidente

---

## Competidores investigados y descartados como nombres

Agendly, Agendix, Turnly, Citio, Reservix, Slotix — todos con dominios o marcas activas. Ver `investigacion-nombre.md` para el detalle completo.

---

## Notas para Claude

- Siempre usar los tokens de color definidos en la paleta, nunca colores arbitrarios
- El voseo rioplatense es intencional en toda la comunicación del producto
- La app es B2B2C: el profesional/negocio configura todo, el cliente final solo reserva
- Priorizar mobile-first en todas las decisiones de UI
- El mercado primario es Argentina/Uruguay, con potencial de expansión a LatAm
