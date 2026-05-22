export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyBusiness } from "@/lib/actions/business"
import { getServices, deleteService } from "@/lib/actions/services"

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const business = await getMyBusiness()
  if (!business) redirect("/dashboard/setup")

  const serviceList = await getServices()

  return (
    <div className="min-h-screen">

      {/* Page header */}
      <div
        className="bg-white px-6 lg:px-10 py-7 flex items-center justify-between"
        style={{ borderBottom: "1.5px solid var(--color-border)" }}
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-dark)]" style={{ letterSpacing: "-0.5px" }}>
            Servicios
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 font-medium">
            Administrá los servicios que ofrecés y sus precios
          </p>
        </div>
        <a
          href="/dashboard/services/new"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl font-bold text-sm text-white transition-all hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, #0284C7, #0369A1)",
            boxShadow: "0 2px 10px rgba(2,132,199,0.35)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo servicio
        </a>
      </div>

      <div className="px-6 lg:px-10 py-8 max-w-4xl">
        {serviceList.length === 0 ? (
          <div
            className="bg-white rounded-3xl py-20 text-center shadow-sm"
            style={{ border: "1.5px solid var(--color-border)" }}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(2,132,199,0.08)" }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="font-extrabold text-[var(--color-text-dark)] text-xl mb-2" style={{ letterSpacing: "-0.5px" }}>
              Todavía no tenés servicios
            </p>
            <p className="text-[var(--color-text-muted)] mb-8 max-w-xs mx-auto leading-relaxed">
              Agregá tus servicios para que los clientes puedan hacer reservas online.
            </p>
            <a
              href="/dashboard/services/new"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl font-bold text-sm text-white transition-all hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #0284C7, #0369A1)",
                boxShadow: "0 4px 16px rgba(2,132,199,0.35)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Agregar mi primer servicio
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {serviceList.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                style={{ border: "1.5px solid var(--color-border)" }}
              >
                <div className="flex items-center gap-5 px-6 py-6">
                  {/* Ícono */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(2,132,199,0.08)" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[var(--color-text-dark)] text-base mb-0.5" style={{ letterSpacing: "-0.3px" }}>
                      {service.name}
                    </p>
                    {service.description && (
                      <p className="text-sm text-[var(--color-text-muted)] leading-snug line-clamp-1 mb-3">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ background: "rgba(2,132,199,0.08)", color: "var(--color-primary)" }}
                      >
                        {formatDuration(service.durationMinutes)}
                      </span>
                      {service.price && (
                        <span className="text-base font-extrabold text-[var(--color-accent)]">
                          ${Number(service.price).toLocaleString("es-AR")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Eliminar */}
                  <form action={deleteService.bind(null, service.id)}>
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-xl text-xs font-bold transition-all hover:bg-red-50 hover:text-[var(--color-error)]"
                      style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)", background: "white" }}
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
