import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "border border-primary/60 bg-transparent text-primary shadow-depth-sm hover:bg-primary hover:text-primary-foreground hover:shadow-depth-md",
        destructive: "border border-destructive/60 bg-transparent text-destructive shadow-depth-sm hover:bg-destructive hover:text-destructive-foreground hover:shadow-depth-md",
        outline: "border border-border bg-transparent shadow-depth-sm hover:bg-surface-2 hover:text-foreground hover:shadow-depth-md",
        secondary: "border border-secondary/60 bg-transparent text-secondary shadow-depth-sm hover:bg-secondary hover:text-secondary-foreground hover:shadow-depth-md",
        ghost: "hover:bg-surface-2 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "border border-primary/40 bg-gradient-to-r from-primary/10 to-accent/10 text-primary shadow-depth-sm hover:from-primary hover:to-accent hover:text-primary-foreground hover:shadow-depth-md",
        glow: "border border-primary/60 bg-primary/10 text-primary shadow-depth-glow hover:bg-primary hover:text-primary-foreground hover:shadow-depth-lg",
        cyan: "border border-cyan-blue/60 bg-transparent text-cyan-blue shadow-depth-sm hover:bg-cyan-blue hover:text-background hover:shadow-depth-md",
        purple: "border border-cosmic-purple/60 bg-transparent text-cosmic-purple shadow-depth-sm hover:bg-cosmic-purple hover:text-white hover:shadow-depth-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  enableRipple?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, enableRipple = true, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableRipple && !asChild) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement("span");
        ripple.className = "ripple-effect";
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      }
      
      onClick?.(e);
    };
    
    if (asChild) {
      return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    }
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onClick={handleClick}
        {...props} 
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
