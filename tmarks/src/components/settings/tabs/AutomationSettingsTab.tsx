import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { SearchAutoClearSettings } from '../SearchAutoClearSettings'
import { TagSelectionAutoClearSettings } from '../TagSelectionAutoClearSettings'
import { InfoBox } from '../InfoBox'

interface AutomationSettingsTabProps {
  searchEnabled: boolean
  searchSeconds: number
  tagEnabled: boolean
  tagSeconds: number
  onSearchEnabledChange: (enabled: boolean) => void
  onSearchSecondsChange: (seconds: number) => void
  onTagEnabledChange: (enabled: boolean) => void
  onTagSecondsChange: (seconds: number) => void
}

export function AutomationSettingsTab({
  searchEnabled,
  searchSeconds,
  tagEnabled,
  tagSeconds,
  onSearchEnabledChange,
  onSearchSecondsChange,
  onTagEnabledChange,
  onTagSecondsChange,
}: AutomationSettingsTabProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="space-y-6">
      <SearchAutoClearSettings
        enabled={searchEnabled}
        seconds={searchSeconds}
        onEnabledChange={onSearchEnabledChange}
        onSecondsChange={onSearchSecondsChange}
      />

      <div className="border-t border-border"></div>

      <TagSelectionAutoClearSettings
        enabled={tagEnabled}
        seconds={tagSeconds}
        onEnabledChange={onTagEnabledChange}
        onSecondsChange={onTagSecondsChange}
      />

      <div className="border-t border-border"></div>

      <InfoBox icon={Info} title={t('automation.infoBox.title')} variant="info">
        <ul className="space-y-1">
          <li>• {t('automation.infoBox.tip1')}</li>
        </ul>
      </InfoBox>
    </div>
  )
}
