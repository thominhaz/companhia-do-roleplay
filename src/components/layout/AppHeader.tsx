import { ReactNode } from "react";
import { Dices } from "lucide-react";

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
  return (
    <header className={`${sticky ? 'sticky top-0 z-40' : ''} bg-gradient-to-b from-slate-950 to-transparent`}>
      <div className="flex justify-between items-center px-6 py-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-slate-900/80 rounded-lg flex items-center justify-center border border-white/10 shadow-arcane">
            <Dices className="text-arcane-400 w-6 h-6" />
          </div>
          <span className="font-serif font-bold text-2xl tracking-widest text-white">
            Go<span className="text-arcane-500">20</span>
          </span>
        </div>
        
        {/* Right Content */}
        {rightContent && (
          <div className="flex items-center gap-4">
            {rightContent}
          </div>
        )}
      </div>
      
      {/* Title Section */}
      {(title || subtitle) && (
        <div className="px-6 pb-4">
          {title && <h1 className="font-serif text-3xl lg:text-4xl text-white font-bold tracking-tight">{title}</h1>}
          {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
        </div>
      )}
      
      {/* Children Content */}
      {children && (
        <div className="px-6 pb-4">
          {children}
        </div>
      )}
    </header>
  );
}