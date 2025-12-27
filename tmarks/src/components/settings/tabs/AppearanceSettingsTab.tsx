import { useTranslation } from 'react-i18next'
import { Palette } from 'lucide-react'
import { DefaultBookmarkIconSettings } from '../DefaultBookmarkIconSettings'
import { InfoBox } from '../InfoBox'
import type { DefaultBookmarkIcon } from '@/lib/types'

interface AppearanceSettingsTabProps {
  defaultIcon: DefaultBookmarkIcon
  onIconChange: (icon: DefaultBookmarkIcon) => void
}

export function AppearanceSettingsTab({
  defaultIcon,
  onIconChange,
}: AppearanceSettingsTabProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="space-y-6">
      <DefaultBookmarkIconSettings
        selectedIcon={defaultIcon}
        onIconChange={onIconChange}
      />

      <InfoBox icon={Palette} title={t('appearance.infoBox.title')} variant="info">
        <ul className="space-y-1">
          <li>• {t('appearance.infoBox.tip1')}</li>
        </ul>
      </InfoBox>
    </div>
  )
}
