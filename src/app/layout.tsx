import { redirect } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Перенаправляем на страницу выбора языка
  redirect('/ru')
}
