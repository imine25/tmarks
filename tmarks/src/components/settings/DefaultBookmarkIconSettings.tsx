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
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">默认书签图标</h3>
        <p className="text-sm text-muted-foreground mt-1">
          选择当书签没有封面图和网站图标时显示的默认图标
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {DEFAULT_ICON_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onIconChange(option.value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105 ${
              selectedIcon === option.value
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <DefaultBookmarkIconComponent 
                icon={option.value} 
                className={`w-10 h-10 ${
                  selectedIcon === option.value 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              />
            </div>
            <div className="text-center">
              <div className={`text-sm font-medium ${
                selectedIcon === option.value 
                  ? 'text-primary' 
                  : 'text-foreground'
              }`}>
                {option.label}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xs text-muted-foreground">
          当前选择：<span className="font-medium text-foreground">{DEFAULT_ICON_OPTIONS.find(o => o.value === selectedIcon)?.label}</span>
        </p>
      </div>
    </div>
  )
}
