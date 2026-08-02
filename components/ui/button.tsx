import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95",
        secondary:
          "border border-slate-200/80 bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 dark:border-white/10",
        ghost:
          "text-foreground/80 hover:bg-accent hover:text-foreground",
        outline:
          "border border-input bg-background/80 text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-white/15",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      },
      size: {
        default: "h-11 min-h-[44px] px-5 text-sm",
        sm: "h-10 min-h-[40px] px-4 text-xs font-medium",
        lg: "h-12 min-h-[48px] px-6 text-base",
        icon: "size-11 min-h-[44px] shrink-0 sm:size-10 sm:min-h-10",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
