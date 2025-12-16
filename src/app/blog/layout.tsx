import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Блог о UX-дизайне | UX Audit Platform',
    template: '%s | UX Audit Platform'
  },
  description: 'Кейсы, исследования и практические советы по улучшению пользовательского опыта. Экспертные статьи о UX/UI дизайне, аналитике и тестировании интерфейсов.',
  keywords: ['UX дизайн', 'UI дизайн', 'пользовательский опыт', 'юзабилити', 'интерфейсы', 'веб-дизайн', 'UX исследования', 'A/B тестирование'],
  authors: [{ name: 'UX Audit Platform' }],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://ux-audit.vercel.app/blog',
    siteName: 'UX Audit Platform',
    title: 'Блог о UX-дизайне | UX Audit Platform',
    description: 'Кейсы, исследования и практические советы по улучшению пользовательского опыта',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Блог о UX-дизайне | UX Audit Platform',
    description: 'Кейсы, исследования и практические советы по улучшению пользовательского опыта',
  },
  alternates: {
    canonical: 'https://ux-audit.vercel.app/blog'
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
