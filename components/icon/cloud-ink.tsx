import { cn } from "@/lib/utils";

export default function CloudInkIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("ink-cloud-icon", className)}
      aria-hidden="true"
    >
      <defs>
        {/* 墨色渐变 - 模拟水墨渲染 */}
        <linearGradient id="ink-cloud-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.75" />
        </linearGradient>
        
        {/* 晕染效果 - 模拟传统绘画质感 */}
        <radialGradient id="ink-cloud-blur" cx="50%" cy="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        
        {/* 高光 - 增加立体感 */}
        <radialGradient id="ink-cloud-highlight" cx="30%" cy="30%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </radialGradient>
      </defs>
      
      {/* 云朵主体 - 使用线条勾勒 */}
      <path
        d="M19.5 14.5c0 1.38-1.12 2.5-2.5 2.5h-10c-2.21 0-4-1.79-4-4 0-1.93 1.36-3.54 3.17-3.9C6.5 6.5 8.5 4.5 11 4.5c2.5 0 4.5 2 4.83 4.5 1.81.36 3.17 1.97 3.17 3.9 0 .55-.14 1.07-.38 1.52.24.45.38.97.38 1.58z"
        fill="url(#ink-cloud-gradient)"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      
      {/* 水墨晕染层 - 模拟传统绘画质感 */}
      <ellipse
        cx="14"
        cy="12"
        rx="4"
        ry="3"
        fill="url(#ink-cloud-blur)"
      />
      
      <ellipse
        cx="10"
        cy="14"
        rx="3"
        ry="2.5"
        fill="url(#ink-cloud-blur)"
      />
      
      {/* 高光层 - 增加古典艺术韵味 */}
      <ellipse
        cx="13"
        cy="11"
        rx="2.5"
        ry="2"
        fill="url(#ink-cloud-highlight)"
      />
      
      {/* 细节线条 - 线条勾勒手法 */}
      <path
        d="M8 12c-.5 0-1 .2-1.3.5M16 12c.5 0 1 .2 1.3.5"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

