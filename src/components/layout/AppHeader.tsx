import { ReactNode } from "react";
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
  return <header className={`${sticky ? 'sticky top-0 z-40' : ''} bg-gradient-to-b from-dark to-darker border-b border-border/30`}>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img alt="Go20" className="h-16 w-auto" src="/lovable-uploads/efa0d41b-14e0-4651-a827-05d928549cb9.png" />
            <span className="text-lg font-bold text-foreground">Go20</span>
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
      
      {children && <div className="px-5 pb-3">
          {children}
        </div>}
    </header>;
}