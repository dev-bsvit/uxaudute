import { redirect } from 'next/navigation'

export default function RootLayout() {
  // Редирект на русскую версию по умолчанию
  redirect('/ru')
}