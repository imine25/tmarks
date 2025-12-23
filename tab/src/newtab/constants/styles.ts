/**
 * 统一样式常量 - iOS 风格设计系统
 */

// 圆角
export const BORDER_RADIUS = {
  SM: 'rounded-lg',      // 8px - 小型元素
  MD: 'rounded-xl',      // 12px - 按钮、卡片
  LG: 'rounded-2xl',     // 16px - 弹窗、面板
  XL: 'rounded-3xl',     // 24px - 大型弹窗
  IOS: 'rounded-[14px]', // iOS 标准
} as const;

// 按钮基础样式
export const BUTTON_STYLES = {
  // 图标按钮 (44px iOS 推荐尺寸)
  ICON: 'w-11 h-11 rounded-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-white/20',
  
  // 主要按钮
  PRIMARY: 'px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-white/20 text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50',
  
  // 次要按钮
  SECONDARY: 'px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/20',
  
  // 危险按钮
  DANGER: 'px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30',
  
  // 幽灵按钮
  GHOST: 'p-1.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20',
} as const;

// 输入框样式
export const INPUT_STYLES = {
  DEFAULT: 'bg-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none border border-white/10 focus:border-white/30 placeholder-white/40',
  SEARCH: 'bg-transparent text-white placeholder-white/50 outline-none',
} as const;

// 玻璃效果
export const GLASS_STYLES = {
  DEFAULT: 'glass',
  DARK: 'glass-dark',
  CARD: 'glass-card',
  MODAL: 'glass-modal',
} as const;

// 过渡动画
export const TRANSITION = {
  FAST: 'transition-all duration-150',
  DEFAULT: 'transition-all duration-200',
  SLOW: 'transition-all duration-300',
  COLORS: 'transition-colors',
} as const;

// 文本颜色
export const TEXT_COLORS = {
  PRIMARY: 'text-white',
  SECONDARY: 'text-white/70',
  MUTED: 'text-white/50',
  DISABLED: 'text-white/40',
  DANGER: 'text-red-400',
  SUCCESS: 'text-green-400',
  INFO: 'text-blue-400',
} as const;

// iOS 系统颜色
export const IOS_COLORS = {
  BLUE: '#0a84ff',
  RED: '#ff453a',
  GREEN: '#30d158',
  ORANGE: '#ff9f0a',
  GRAY: '#8e8e93',
} as const;
