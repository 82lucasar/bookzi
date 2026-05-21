import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
})

export const metadata: Metadata = {
  title: "Bookzi — Tu agenda inteligente",
  description:
    "Sistema de gestión de turnos y reservas online para profesionales y negocios.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={plusJakartaSans.variable}>
      <body>{children}</body>
    </html>
  )
}
