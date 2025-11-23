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
  return (
    <div className={`${className} relative flex items-center justify-center gap-1`}>
      <style>{`
        @keyframes bookmark-dot-bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
      <div
        className="w-1.5 h-1.5 rounded-full bg-primary"
        style={{
          animation: 'bookmark-dot-bounce 1.4s ease-in-out infinite',
          animationDelay: '0s',
        }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full bg-primary"
        style={{
          animation: 'bookmark-dot-bounce 1.4s ease-in-out infinite',
          animationDelay: '0.2s',
        }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full bg-primary"
        style={{
          animation: 'bookmark-dot-bounce 1.4s ease-in-out infinite',
          animationDelay: '0.4s',
        }}
      />
    </div>
  )
}
