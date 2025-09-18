import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await import('next-intl/server').then(m => m.getTranslations('seo'))
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale: params.locale,
    },
  }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  // Проверяем, что локаль поддерживается
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Получаем сообщения для текущей локали
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
