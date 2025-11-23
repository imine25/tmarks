import type { DefaultBookmarkIcon } from '@/lib/types'

interface DefaultBookmarkIconProps {
  icon: DefaultBookmarkIcon
  className?: string
}

export function DefaultBookmarkIconComponent({
  icon: _icon,
  className = 'w-10 h-10 sm:w-8 sm:h-8',
}: DefaultBookmarkIconProps) {
  // 使用 SVG 实现轨道旋转动画（更可靠）
  // 目前只有一个图标选项，所以忽略 icon 参数
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          {/* 定义渐变 */}
          <linearGradient id="track-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          </linearGradient>

          {/* 定义动画 */}
          <style>{`
            @keyframes orbit-move {
              0%, 100% { cy: 15; }
              50% { cy: 85; }
            }
            .orbit-ball {
              animation: orbit-move 3.63s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* 9 条轨道，每条旋转 20 度 */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <g key={i} transform={`rotate(${i * 20} 50 50)`}>
            {/* 轨道线 */}
            <line
              x1="50"
              y1="15"
              x2="50"
              y2="85"
              stroke="url(#track-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* 运动的小球 */}
            <circle
              className="orbit-ball"
              cx="50"
              cy="15"
              r="2.5"
              fill="hsl(var(--primary))"
              style={{
                animationDelay: `${i * 0.2}s`,
                filter: 'drop-shadow(0 0 3px hsl(var(--primary) / 0.6))',
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
