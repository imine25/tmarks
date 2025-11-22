import type { DefaultBookmarkIcon } from '@/lib/types'

// 图标选项配置 - 仅保留动态图标
export const DEFAULT_ICON_OPTIONS: Array<{ value: DefaultBookmarkIcon; label: string; description: string }> = [
  { value: 'gradient-glow', label: '渐变光晕', description: '动态渐变色彩' },
  { value: 'pulse-breath', label: '脉冲呼吸', description: '柔和呼吸动画' },
]
