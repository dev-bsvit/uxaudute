import { useTranslations } from 'next-intl'
import { HeroSection } from '@/components/hero-section'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function HomePage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Переключатель языков */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Главная секция */}
      <HeroSection />
    </div>
  )
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const t = useTranslations('seo')
  
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
