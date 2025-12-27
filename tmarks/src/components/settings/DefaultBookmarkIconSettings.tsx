import { useTranslation } from 'react-i18next'
import { DefaultBookmarkIconComponent } from '@/components/bookmarks/DefaultBookmarkIcon'
import { DEFAULT_ICON_OPTIONS } from '@/components/bookmarks/defaultIconOptions'
import type { DefaultBookmarkIcon } from '@/lib/types'

interface DefaultBookmarkIconSettingsProps {
  selectedIcon: DefaultBookmarkIcon
  onIconChange: (icon: DefaultBookmarkIcon) => void
}

export function DefaultBookmarkIconSettings({
  selectedIcon,
  onIconChange,
}: DefaultBookmarkIconSettingsProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t('appearance.defaultIcon.title')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('appearance.defaultIcon.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DEFAULT_ICON_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onIconChange(option.value)}
            className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
              selectedIcon === option.value
                ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <div className="w-20 h-20 flex items-center justify-center">
              <DefaultBookmarkIconComponent 
                icon={option.value} 
                className="w-16 h-16"
              />
            </div>
            <div className="text-center">
              <div className={`text-base font-semibold mb-1 ${
                selectedIcon === option.value 
                  ? 'text-primary' 
                  : 'text-foreground'
              }`}>
                {option.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('appearance.defaultIcon.currentSelection')}<span className="font-medium text-foreground">{DEFAULT_ICON_OPTIONS.find(o => o.value === selectedIcon)?.label}</span>
        </p>
      </div>
    </div>
  )
}
