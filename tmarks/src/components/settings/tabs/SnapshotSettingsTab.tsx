import { useTranslation } from 'react-i18next'
import { Camera, Trash2, Copy, CheckCircle } from 'lucide-react'
import { InfoBox } from '../InfoBox'
import { Toggle } from '@/components/common/Toggle'

interface SnapshotSettingsTabProps {
  retentionCount: number
  autoCreate: boolean
  autoDedupe: boolean
  autoCleanupDays: number
  onRetentionCountChange: (count: number) => void
  onAutoCreateChange: (enabled: boolean) => void
  onAutoDedupeChange: (enabled: boolean) => void
  onAutoCleanupDaysChange: (days: number) => void
}

export function SnapshotSettingsTab({
  retentionCount,
  autoCreate,
  autoDedupe,
  autoCleanupDays,
  onRetentionCountChange,
  onAutoCreateChange,
  onAutoDedupeChange,
  onAutoCleanupDaysChange,
}: SnapshotSettingsTabProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('snapshot.retention.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('snapshot.retention.description')}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('snapshot.retention.count')}</div>
              <div className="text-xs text-muted-foreground">
                {t('snapshot.retention.countHint')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={retentionCount}
                onChange={(e) => onRetentionCountChange(parseInt(e.target.value) || 0)}
                min="-1"
                max="100"
                className="input w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">{t('snapshot.retention.unit')}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              {t('snapshot.retention.tip')}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('snapshot.autoCreate.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('snapshot.autoCreate.description')}
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
          <div className="flex items-start gap-3">
            <Copy className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('snapshot.autoCreate.enable')}</div>
              <div className="text-xs text-muted-foreground">
                {t('snapshot.autoCreate.enableHint')}
              </div>
            </div>
          </div>
          <Toggle
            checked={autoCreate}
            onChange={onAutoCreateChange}
          />
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('snapshot.dedup.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('snapshot.dedup.description')}
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('snapshot.dedup.enable')}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• {t('snapshot.dedup.tip1')}</div>
                <div>• {t('snapshot.dedup.tip2')}</div>
                <div>• {t('snapshot.dedup.tip3')}</div>
              </div>
            </div>
          </div>
          <Toggle
            checked={autoDedupe}
            onChange={onAutoDedupeChange}
          />
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('snapshot.autoClean.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('snapshot.autoClean.description')}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">{t('snapshot.autoClean.days')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('snapshot.autoClean.daysHint')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={autoCleanupDays}
                onChange={(e) => onAutoCleanupDaysChange(parseInt(e.target.value) || 0)}
                min="0"
                max="365"
                className="input w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">{t('snapshot.autoClean.unit')}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
            <p className="text-xs text-muted-foreground">
              {t('snapshot.autoClean.warning')}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      <InfoBox icon={Camera} title={t('snapshot.infoBox.title')} variant="info">
        <ul className="space-y-1">
          <li>• {t('snapshot.infoBox.tip1')}</li>
          <li>• {t('snapshot.infoBox.tip2')}</li>
          <li>• {t('snapshot.infoBox.tip3')}</li>
          <li>• {t('snapshot.infoBox.tip4')}</li>
          <li>• {t('snapshot.infoBox.tip5')}</li>
        </ul>
      </InfoBox>
    </div>
  )
}
