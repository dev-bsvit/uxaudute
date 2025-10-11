import { ChevronRight, Share2 } from 'lucide-react'
import Link from 'next/link'
import { BackArrow } from '@/components/icons/back-arrow'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  breadcrumbs?: Breadcrumb[]
  icon?: React.ReactNode
  title: string
  subtitle?: string
  showShareButton?: boolean
  onShare?: () => void
  shareButtonLabel?: string
  primaryButton?: {
    label: string
    onClick: () => void
    disabled?: boolean
  }
  secondaryButton?: {
    icon: React.ReactNode
    onClick: () => void
  }
  showBackButton?: boolean
  onBack?: () => void
}

export function PageHeader({
  breadcrumbs,
  icon,
  title,
  subtitle,
  showShareButton,
  onShare,
  shareButtonLabel,
  primaryButton,
  secondaryButton,
  showBackButton,
  onBack
}: PageHeaderProps) {
  const computedShareLabel = shareButtonLabel || 'Share'

  return (
    <div className="w-full flex flex-col gap-3 pt-3 px-5 pb-5">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1
            const content = (
              <span
                className={`text-xs font-normal ${
                  isLast
                    ? 'text-[#1F1F1F]'
                    : 'text-[rgba(23,26,36,0.30)]'
                }`}
                style={{ fontFamily: 'Inter' }}
              >
                {crumb.label}
              </span>
            )

            return (
              <div key={index} className="flex items-center gap-2">
                {crumb.href && !isLast ? (
                  <Link href={crumb.href}>{content}</Link>
                ) : (
                  content
                )}
                {!isLast && (
                  <ChevronRight className="w-4 h-4 text-[rgba(23,26,36,0.30)]" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Main content */}
      <div className="flex items-center gap-4 w-full">
        {/* Left side - Back Button + Icon (optional) + Title + Subtitle */}
        <div className="flex items-center gap-4 flex-1">
          {showBackButton && onBack && <BackArrow onClick={onBack} />}
          {icon && (
            <div className="w-[50px] h-[50px] rounded-[44px] bg-[#EEF2FA] flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="flex flex-col flex-1">
            <h1
              className="text-[38px] font-semibold leading-[41.8px] text-[#1F1F1F]"
              style={{ fontFamily: 'Inter Display' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-xs font-normal leading-[15.6px] text-[rgba(23,26,36,0.64)]"
                style={{ fontFamily: 'Inter Display' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Buttons */}
        <div className="flex items-center gap-2">
          {showShareButton && onShare && (
            <button
              onClick={onShare}
              className="px-6 py-4 bg-[#0058FC] rounded-[44px] hover:bg-[#0047d1] transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span
                className="text-base font-medium leading-[17.6px] text-white"
                style={{ fontFamily: 'Inter Display' }}
              >
                {computedShareLabel}
              </span>
            </button>
          )}
          {secondaryButton && (
            <button
              onClick={secondaryButton.onClick}
              className="w-[50px] h-[50px] rounded-full bg-[#EEF2FA] flex items-center justify-center hover:bg-[#e0e8f5] transition-colors"
            >
              {secondaryButton.icon}
            </button>
          )}
          {primaryButton && (
            <button
              onClick={primaryButton.onClick}
              disabled={primaryButton.disabled}
              className="px-6 py-4 bg-[#0058FC] rounded-[44px] hover:bg-[#0047d1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                className="text-base font-medium leading-[17.6px] text-white"
                style={{ fontFamily: 'Inter Display' }}
              >
                {primaryButton.label}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
