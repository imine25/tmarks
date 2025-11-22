import type { DefaultBookmarkIcon } from '@/lib/types'

interface DefaultBookmarkIconProps {
  icon: DefaultBookmarkIcon
  className?: string
}

export function DefaultBookmarkIconComponent({ icon, className = 'w-10 h-10 sm:w-8 sm:h-8' }: DefaultBookmarkIconProps) {
  if (icon === 'gradient-glow') {
    return (
      <div className={`${className} relative flex items-center justify-center`}>
        {/* 背景光晕 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 opacity-20 blur-md animate-pulse"></div>
        
        {/* 主图标 */}
        <svg className="relative w-full h-full" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="gradient-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6">
                <animate attributeName="stop-color" values="#3b82f6; #8b5cf6; #ec4899; #3b82f6" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#8b5cf6">
                <animate attributeName="stop-color" values="#8b5cf6; #ec4899; #3b82f6; #8b5cf6" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#ec4899">
                <animate attributeName="stop-color" values="#ec4899; #3b82f6; #8b5cf6; #ec4899" dur="4s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          
          {/* 书签形状 */}
          <path 
            d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" 
            fill="url(#gradient-glow)"
            opacity="0.9"
          >
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1; 1.05; 1"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* 星星装饰 */}
          <circle cx="12" cy="10" r="1.5" fill="white" opacity="0.8">
            <animate attributeName="opacity" values="0.8; 0.3; 0.8" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    )
  }

  if (icon === 'pulse-breath') {
    return (
      <div className={`${className} relative flex items-center justify-center`}>
        {/* 外圈脉冲 */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"></div>
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
        
        {/* 主图标 */}
        <svg className="relative w-full h-full" viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id="pulse-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
            </radialGradient>
          </defs>
          
          {/* 心形 */}
          <path 
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
            fill="url(#pulse-gradient)"
            className="text-primary"
          >
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1; 1.1; 1"
              dur="1.5s"
              repeatCount="indefinite"
              additive="sum"
            />
          </path>
          
          {/* 内部光点 */}
          <circle cx="12" cy="11" r="2" fill="white" opacity="0.6">
            <animate attributeName="r" values="2; 2.5; 2" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6; 0.9; 0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    )
  }

  // 默认静态图标（保留作为后备）
  return (
    <svg className={`${className} text-primary/60`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
    </svg>
  )
}
