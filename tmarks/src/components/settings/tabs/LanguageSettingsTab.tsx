import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

export function LanguageSettingsTab() {
  const { t } = useTranslation('settings')
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{t('language.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t('language.description')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('language.label')}
          </label>
          <select
            value={currentLanguage}
            onChange={(e) => changeLanguage(e.target.value as typeof currentLanguage)}
            className="input w-full max-w-xs"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-2">{t('language.hint')}</p>
        </div>
      </div>
    </div>
  )
}
