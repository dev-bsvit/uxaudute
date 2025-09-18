import { redirect } from 'next/navigation'

export default function RootPage() {
  // Перенаправляем на русскую версию
  redirect('/ru')
}
