import { notFound } from "next/navigation"
import { getBookingBusiness } from "@/lib/actions/booking"
import BookingClient from "./BookingClient"

export const dynamic = "force-dynamic"

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")
}

export default async function BookServicePage({
  params,
}: {
  params: Promise<{ slug: string; serviceId: string }>
}) {
  const { slug, serviceId } = await params
  const data = await getBookingBusiness(slug)
  if (!data) notFound()

  const service = data.services.find((s) => s.id === serviceId)
  if (!service) notFound()

  const { business } = data

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>

      {/* Header gradient igual al perfil público */}
      <div className="pub-header" style={{ paddingBottom: 20 }}>
        {/* Back link sutil */}
        <a
          href={`/book/${slug}`}
          style={{
            position: "absolute", top: 16, left: 16,
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)",
            textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver a servicios
        </a>

        <div className="pub-avatar-wrap">{initials(business.name)}</div>
        <div className="pub-name">{business.name}</div>
        {(business.category || business.address) && (
          <div className="pub-role">
            {[business.category, business.address].filter(Boolean).join(" · ")}
          </div>
        )}
        <div className="pub-meta">
          <span className="pub-meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Confirmación inmediata
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="page-body">
        <BookingClient
          business={{
            id: business.id,
            name: business.name,
            slug: business.slug,
          }}
          service={{
            id: service.id,
            name: service.name,
            durationMinutes: service.durationMinutes,
            price: service.price,
          }}
        />
      </div>
    </div>
  )
}
