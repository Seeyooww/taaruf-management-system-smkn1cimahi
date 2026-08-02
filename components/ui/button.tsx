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
          "bg-zinc-950 text-white shadow-lg shadow-zinc-950/15 hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
        secondary:
          "border border-white/30 bg-white/70 text-zinc-900 shadow-lg shadow-zinc-500/10 backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/15",
        ghost:
          "text-zinc-600 hover:bg-zinc-950/5 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
        outline:
          "border border-zinc-200 bg-white/70 text-zinc-900 backdrop-blur-xl hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10",
        destructive:
          "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500",
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
