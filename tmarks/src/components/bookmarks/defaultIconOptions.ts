import type { DefaultBookmarkIcon } from '@/lib/types'

// 图标选项配置
export const DEFAULT_ICON_OPTIONS: Array<{ value: DefaultBookmarkIcon; label: string; description: string }> = [
  { value: 'bookmark', label: '书签', description: '经典书签图标' },
  { value: 'star', label: '星星', description: '收藏星标' },
  { value: 'heart', label: '爱心', description: '喜爱标记' },
  { value: 'link', label: '链接', description: '链接图标' },
  { value: 'globe', label: '地球', description: '网络世界' },
  { value: 'folder', label: '文件夹', description: '分类整理' },
]
