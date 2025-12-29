import { tierConfig } from "@/hooks/useSupporterContent";
import { cn } from "@/lib/utils";

interface SupporterBadgeProps {
  tier: string;
  creatorName: string;
  className?: string;
}

export function SupporterBadge({ tier, creatorName, className }: SupporterBadgeProps) {
  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.mestre_epico;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm",
        config.borderColor,
        config.bgColor,
        className
      )}
    >
      <span className="text-sm">{config.icon}</span>
      <div className="flex flex-col">
        <span className={cn("text-xs font-semibold", config.textColor)}>
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
          por {creatorName}
        </span>
      </div>
    </div>
  );
}
