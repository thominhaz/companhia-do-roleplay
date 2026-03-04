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
  return <header className={`${sticky ? 'sticky top-0 z-40' : ''} bg-surface-0/95 backdrop-blur-xl border-b border-border/20 shadow-depth-sm`}>
      <div className="px-5 md:px-8 lg:px-12 pt-4 pb-3 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img alt="Go20" className="h-16 w-auto" src={logoFull} />
          </div>
          {rightContent && <div className="flex items-center gap-2">
              {rightContent}
            </div>}
        </div>
        
        {(title || subtitle) && <div className="mt-3">
            {title && <h1 className="text-xl font-bold text-foreground">{title}</h1>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>}
      </div>
      
      {children && <div className="px-5 md:px-8 lg:px-12 pb-3 max-w-6xl mx-auto">
          {children}
        </div>}
    </header>;
}