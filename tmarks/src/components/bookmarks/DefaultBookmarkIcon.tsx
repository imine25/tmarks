import type { DefaultBookmarkIcon } from '@/lib/types'

interface DefaultBookmarkIconProps {
  icon: DefaultBookmarkIcon
  className?: string
}

export function DefaultBookmarkIconComponent({
  icon: _icon,
  className = 'w-10 h-10 sm:w-8 sm:h-8',
}: DefaultBookmarkIconProps) {
  // 使用 SVG 实现轨道旋转动画
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          {/* 定义轨道渐变 */}
          <linearGradient id="track-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          </linearGradient>

          {/* 定义小球动画 */}
          <style>{`
            @keyframes orbit-ball-move {
              0%, 100% {
                offset-distance: 0%;
              }
              50% {
                offset-distance: 100%;
              }
            }
            .orbit-ball {
              animation: orbit-ball-move 3.63s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* 9 条放射状轨道 */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const angle = (i * 360) / 9 // 每条轨道的角度
          const startX = 50 + Math.cos((angle * Math.PI) / 180) * 8
          const startY = 50 + Math.sin((angle * Math.PI) / 180) * 8
          const endX = 50 + Math.cos((angle * Math.PI) / 180) * 42
          const endY = 50 + Math.sin((angle * Math.PI) / 180) * 42

          // 计算小球的初始位置（根据延迟计算）
          const delay = i * 0.2
          const progress = (delay / 3.63) % 1
          const ballProgress = progress < 0.5 ? progress * 2 : (1 - progress) * 2
          const ballX = startX + (endX - startX) * ballProgress
          const ballY = startY + (endY - startY) * ballProgress

          return (
            <g key={i}>
              {/* 轨道线 */}
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="url(#track-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* 运动的小球 */}
              <circle
                cx={ballX}
                cy={ballY}
                r="2.5"
                fill="hsl(var(--primary))"
                style={{
                  filter: 'drop-shadow(0 0 3px hsl(var(--primary) / 0.6))',
                }}
              >
                <animate
                  attributeName="cx"
                  values={`${startX};${endX};${startX}`}
                  dur="3.63s"
                  repeatCount="indefinite"
                  begin={`${delay}s`}
                  calcMode="spline"
                  keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                />
                <animate
                  attributeName="cy"
                  values={`${startY};${endY};${startY}`}
                  dur="3.63s"
                  repeatCount="indefinite"
                  begin={`${delay}s`}
                  calcMode="spline"
                  keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                />
              </circle>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
