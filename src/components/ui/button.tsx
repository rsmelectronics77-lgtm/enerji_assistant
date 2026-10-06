import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink hover:opacity-90",
  ghost: "text-ink hover:bg-line/60",
  outline: "border border-line text-ink hover:bg-line/60",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition disabled:opacity-60 disabled:pointer-events-none",
    variants[variant],
    className,
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClass(variant, className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
