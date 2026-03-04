import { ReactNode } from "react";
import logoFull from "@/assets/logo-full.png";
interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  rightContent?: ReactNode;
  children?: ReactNode;
  sticky?: boolean;
}
export function AppHeader({
  title,
  subtitle,
  rightContent,
  children,
  sticky = true
}: AppHeaderProps) {
  return <header className={`${sticky ? 'sticky top-0 z-40' : ''} bg-white/[0.06] backdrop-blur-[20px] backdrop-saturate-150 border-b border-white/[0.12] shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]`}>
      <div className="px-4 sm:px-5 md:px-8 lg:px-12 pt-3 sm:pt-4 pb-2 sm:pb-3 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img alt="Go20" className="h-12 sm:h-16 w-auto" src={logoFull} />
          </div>
          {rightContent && <div className="flex items-center gap-2">
              {rightContent}
            </div>}
        </div>
        
        {(title || subtitle) && <div className="mt-2 sm:mt-3">
            {title && <h1 className="text-lg sm:text-xl font-bold text-foreground">{title}</h1>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>}
      </div>
      
      {children && <div className="px-4 sm:px-5 md:px-8 lg:px-12 pb-2 sm:pb-3 max-w-6xl mx-auto">
          {children}
        </div>}
    </header>;
}