import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
})

export const metadata: Metadata = {
  title: "Bookzi — Tu agenda inteligente para profesionales y negocios",
  description:
    "Reservas online, confirmaciones automáticas y recordatorios por WhatsApp. Gestioná tu agenda desde un solo lugar.",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={plusJakartaSans.className} style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}>
      {children}
    </div>
  )
}
