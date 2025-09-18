import { redirect } from 'next/navigation'

export default function RootPage() {
  // Редирект на русскую версию по умолчанию
  redirect('/ru')
}