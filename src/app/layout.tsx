import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "UX Audit",
  description: "Профессиональный анализ пользовательского опыта"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}

