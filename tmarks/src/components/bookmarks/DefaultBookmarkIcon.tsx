import type { DefaultBookmarkIcon } from '@/lib/types'

interface DefaultBookmarkIconProps {
  icon: DefaultBookmarkIcon
  className?: string
}

export function DefaultBookmarkIconComponent({
  icon: _icon,
  className = 'w-10 h-10 sm:w-8 sm:h-8',
}: DefaultBookmarkIconProps) {
  // 经典的轨道旋转动画 - 类似 atom/orbit spinner
  // 参考：https://github.com/n3r4zzurr0/svg-spinners
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <style>{`
          @keyframes orbit-rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .orbit-ring {
            transform-origin: center;
            animation: orbit-rotate 3s linear infinite;
          }
        `}</style>

        {/* 中心点 */}
        <circle cx="12" cy="12" r="1.5" fill="hsl(var(--primary))" opacity="0.3" />

        {/* 3 个轨道环 */}
        {[0, 1, 2].map((i) => {
          const rotation = i * 60 // 每个环旋转 60 度
          const delay = -i * 1 // 动画延迟
          return (
            <g
              key={i}
              className="orbit-ring"
              style={{
                animationDelay: `${delay}s`,
              }}
            >
              {/* 轨道椭圆 */}
              <ellipse
                cx="12"
                cy="12"
                rx="10"
                ry="4"
                stroke="hsl(var(--primary))"
                strokeWidth="0.5"
                fill="none"
                opacity="0.2"
                transform={`rotate(${rotation} 12 12)`}
              />
              {/* 运动的小球 */}
              <circle
                cx="22"
                cy="12"
                r="1.5"
                fill="hsl(var(--primary))"
                transform={`rotate(${rotation} 12 12)`}
                style={{
                  filter: 'drop-shadow(0 0 2px hsl(var(--primary) / 0.8))',
                }}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
