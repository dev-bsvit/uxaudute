import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from '@/components/language-provider'
import { LanguageAutoInitializer } from '@/components/language-auto-initializer'
import { LanguageDetectionDebug } from '@/components/language-detection-debug'
import { LanguageInitializationTest } from '@/components/language-initialization-test'
import { LanguagePersistenceTest } from '@/components/language-persistence-test'
import { SmoothLanguageInitializer } from '@/components/smooth-language-initializer'
import { DynamicHtmlLang } from '@/components/dynamic-html-lang'
import { DynamicMetadata } from '@/components/dynamic-metadata'

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "UX Audit",
  description: "Профессиональный анализ пользовательского опыта",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <LanguageProvider>
          <SmoothLanguageInitializer
            showLoadingScreen={true}
            loadingMessage="Загрузка языковых настроек..."
            minLoadingTime={200}
          >
            <DynamicHtmlLang />
            <DynamicMetadata />
            {children}
            {process.env.NODE_ENV === 'development' && (
              <>
                <LanguageDetectionDebug />
                <LanguageInitializationTest />
                <LanguagePersistenceTest />
              </>
            )}
          </SmoothLanguageInitializer>
        </LanguageProvider>
      </body>
    </html>
  )
}

