import type { DefaultBookmarkIcon } from '@/lib/types'

interface DefaultBookmarkIconProps {
  icon: DefaultBookmarkIcon
  className?: string
}

export function DefaultBookmarkIconComponent({
  icon: _icon,
  className = 'w-10 h-10 sm:w-8 sm:h-8',
}: DefaultBookmarkIconProps) {
  // 简单的三点跳动动画 - 最常见的 loading 动画
  // 圆点大小为容器宽度的 15%，自适应容器大小
  return (
    <div className={`${className} relative flex items-center justify-center`} style={{ gap: '8%' }}>
      <div
        className="rounded-full"
        style={{
          width: '15%',
          height: '15%',
          backgroundColor: 'hsl(var(--primary))',
          animation: 'bookmark-dot-bounce 1.4s ease-in-out infinite',
          animationDelay: '0s',
        }}
      />
      <div
        className="rounded-full"
        style={{
          width: '15%',
          height: '15%',
          backgroundColor: 'hsl(var(--primary))',
          animation: 'bookmark-dot-bounce 1.4s ease-in-out infinite',
          animationDelay: '0.2s',
        }}
      />
      <div
        className="rounded-full"
        style={{
          width: '15%',
          height: '15%',
          backgroundColor: 'hsl(var(--primary))',
          animation: 'bookmark-dot-bounce 1.4s ease-in-out infinite',
          animationDelay: '0.4s',
        }}
      />
    </div>
  )
}
