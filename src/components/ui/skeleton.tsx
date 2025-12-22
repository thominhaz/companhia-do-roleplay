import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "go20";
}

function Skeleton({ className, variant = "go20", ...props }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "rounded-md",
        variant === "go20" ? "skeleton-go20" : "animate-pulse bg-muted",
        className
      )} 
      {...props} 
    />
  );
}

export { Skeleton };
