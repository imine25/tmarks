import { DefaultBookmarkIconSettings } from '../DefaultBookmarkIconSettings'
import type { DefaultBookmarkIcon } from '@/lib/types'

interface AppearanceSettingsTabProps {
  defaultIcon: DefaultBookmarkIcon
  tagLayout: 'grid' | 'masonry'
  onIconChange: (icon: DefaultBookmarkIcon) => void
  onTagLayoutChange: (layout: 'grid' | 'masonry') => void
}

export function AppearanceSettingsTab({
  defaultIcon,
  tagLayout,
  onIconChange,
  onTagLayoutChange,
}: AppearanceSettingsTabProps) {
  return (
    <div className="space-y-6">
      <DefaultBookmarkIconSettings
        selectedIcon={defaultIcon}
        onIconChange={onIconChange}
      />

      <div className="border-t border-border"></div>

      {/* 标签布局 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">标签布局</h3>
          <p className="text-sm text-muted-foreground mt-1">
            选择标签侧边栏的显示方式
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onTagLayoutChange('grid')}
            className={`p-6 rounded-xl border-2 transition-all ${
              tagLayout === 'grid'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z" />
              </svg>
              <div>
                <div className="text-sm font-medium">标准网格</div>
                <div className="text-xs text-muted-foreground mt-1">整齐排列</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onTagLayoutChange('masonry')}
            className={`p-6 rounded-xl border-2 transition-all ${
              tagLayout === 'masonry'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h5v16H4zM10 10h5v10h-5zM16 6h5v14h-5z" />
              </svg>
              <div>
                <div className="text-sm font-medium">横向瀑布</div>
                <div className="text-xs text-muted-foreground mt-1">紧凑显示</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 提示信息 */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
              外观定制说明
            </h4>
            <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
              <li>• 默认图标会在书签没有封面图和网站图标时显示</li>
              <li>• 标签布局影响侧边栏标签的排列方式</li>
              <li>• 所有外观设置会实时生效</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
