import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[7px] border px-4 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/60 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary: "border-mint-strong bg-mint text-ink hover:bg-mint-strong",
        secondary: "border-border bg-white text-ink hover:bg-canvas",
        coral: "border-coral-strong bg-coral text-ink hover:bg-coral-strong",
        yellow: "border-yellow bg-yellow text-ink hover:bg-yellow/80",
        danger: "border-coral-strong bg-coral-soft text-coral-ink hover:bg-coral/25",
        ghost: "border-transparent bg-transparent text-muted hover:bg-black/5 hover:text-ink",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-11 px-3 text-xs sm:h-9",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
