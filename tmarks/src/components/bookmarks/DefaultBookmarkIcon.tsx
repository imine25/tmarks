import type { DefaultBookmarkIcon } from '@/lib/types'

interface DefaultBookmarkIconProps {
  icon: DefaultBookmarkIcon
  className?: string
}

export function DefaultBookmarkIconComponent({ icon, className = 'w-10 h-10 sm:w-8 sm:h-8' }: DefaultBookmarkIconProps) {
  if (icon === 'orbital-spinner') {
    return (
      <div className={`${className} relative flex items-center justify-center`}>
        <style>{`
          @keyframes orbital-move {
            0% { transform: translateY(0); }
            50% { transform: translateY(92%); }
            100% { transform: translateY(0); }
          }
          
          .orbital-container {
            position: relative;
            width: 100%;
            height: 100%;
          }
          
          .orbital-track {
            position: absolute;
            width: 9%;
            height: 100%;
            left: 50%;
            top: 0;
            margin-left: -4.5%;
            border-radius: 50px;
            background: linear-gradient(to bottom, 
              hsl(var(--primary) / 0.15) 0%, 
              hsl(var(--primary) / 0.08) 50%, 
              hsl(var(--primary) / 0.15) 100%
            );
          }
          
          .orbital-track::after {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 38%;
            background: linear-gradient(to bottom, 
              hsl(var(--primary) / 0.2), 
              transparent
            );
            border-radius: 50px;
          }
          
          .orbital-track::before {
            content: "";
            position: absolute;
            bottom: 0;
            right: 0;
            width: 100%;
            height: 35%;
            background: linear-gradient(to top, 
              hsl(var(--primary) / 0.2), 
              transparent
            );
            border-radius: 50px;
          }
          
          .orbital-ball {
            width: 9%;
            height: 9%;
            border-radius: 50%;
            background: hsl(var(--primary));
            box-shadow: 
              0 0 4px hsl(var(--primary) / 0.5),
              0 0 8px hsl(var(--primary) / 0.3),
              inset 0 -2px 3px rgba(0, 0, 0, 0.2);
            animation: orbital-move 3.63s ease-in-out infinite;
            position: absolute;
            left: 50%;
            top: 0;
            margin-left: -4.5%;
          }
        `}</style>
        
        <div className="orbital-container">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="orbital-track" style={{ transform: `rotate(${i * 20}deg)` }}>
              <div className="orbital-ball" style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 默认返回轨道旋转（作为唯一动画）
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <style>{`
        @keyframes orbital-move {
          0% { transform: translateY(0); }
          50% { transform: translateY(92%); }
          100% { transform: translateY(0); }
        }
        
        .orbital-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .orbital-track {
          position: absolute;
          width: 9%;
          height: 100%;
          left: 50%;
          top: 0;
          margin-left: -4.5%;
          border-radius: 50px;
          background: linear-gradient(to bottom, 
            hsl(var(--primary) / 0.15) 0%, 
            hsl(var(--primary) / 0.08) 50%, 
            hsl(var(--primary) / 0.15) 100%
          );
        }
        
        .orbital-track::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 38%;
          background: linear-gradient(to bottom, 
            hsl(var(--primary) / 0.2), 
            transparent
          );
          border-radius: 50px;
        }
        
        .orbital-track::before {
          content: "";
          position: absolute;
          bottom: 0;
          right: 0;
          width: 100%;
          height: 35%;
          background: linear-gradient(to top, 
            hsl(var(--primary) / 0.2), 
            transparent
          );
          border-radius: 50px;
        }
        
        .orbital-ball {
          width: 9%;
          height: 9%;
          border-radius: 50%;
          background: hsl(var(--primary));
          box-shadow: 
            0 0 4px hsl(var(--primary) / 0.5),
            0 0 8px hsl(var(--primary) / 0.3),
            inset 0 -2px 3px rgba(0, 0, 0, 0.2);
          animation: orbital-move 3.63s ease-in-out infinite;
          position: absolute;
          left: 50%;
          top: 0;
          margin-left: -4.5%;
        }
      `}</style>
      
      <div className="orbital-container">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="orbital-track" style={{ transform: `rotate(${i * 20}deg)` }}>
            <div className="orbital-ball" style={{ animationDelay: `${i * 0.2}s` }} />
          </div>
        ))}
      </div>
    </div>
  )
}
