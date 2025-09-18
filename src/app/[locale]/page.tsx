import { useTranslations } from 'next-intl'
import { HeroSection } from '@/components/hero-section'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Layout } from '@/components/layout'

export default function HomePage() {
  const t = useTranslations()

  return (
    <Layout transparentHeader={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Переключатель языков */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>

        {/* Главная секция */}
        <HeroSection />
      </div>
    </Layout>
  )
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
