import { SearchAutoClearSettings } from '../SearchAutoClearSettings'
import { TagSelectionAutoClearSettings } from '../TagSelectionAutoClearSettings'

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

      {/* 提示信息 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              自动化功能说明
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 自动清空功能可以帮助你快速回到初始状态</li>
              <li>• 你可以根据使用习惯调整自动清空的时间</li>
              <li>• 如果不需要自动清空，可以关闭对应的开关</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
