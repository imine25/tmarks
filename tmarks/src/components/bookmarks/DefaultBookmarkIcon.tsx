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
  // 参考：https://github.com/n3r4zzurr0/svg-spinners (3-dots-bounce)
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-8px);
            }
          }
          .dot {
            animation: bounce 1.4s ease-in-out infinite;
          }
          .dot:nth-child(1) {
            animation-delay: 0s;
          }
          .dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          .dot:nth-child(3) {
            animation-delay: 0.4s;
          }
        `}</style>

        {/* 三个跳动的圆点 */}
        <circle className="dot" cx="6" cy="12" r="2" fill="hsl(var(--primary))" />
        <circle className="dot" cx="12" cy="12" r="2" fill="hsl(var(--primary))" />
        <circle className="dot" cx="18" cy="12" r="2" fill="hsl(var(--primary))" />
      </svg>
    </div>
  )
}
