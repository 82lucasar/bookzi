import { cva, type VariantProps } from "class-variance-authority"
import { clsx } from "clsx"
import * as React from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--primary)] text-white",
          "hover:bg-[var(--primary-dark)]",
          "focus-visible:ring-[var(--primary)]",
        ],
        secondary: [
          "bg-white text-[var(--primary)] border border-[var(--primary)]",
          "hover:bg-[var(--bg)]",
          "focus-visible:ring-[var(--primary)]",
        ],
        ghost: [
          "text-[var(--text-mid)]",
          "hover:bg-[var(--bg)] hover:text-[var(--text-dark)]",
          "focus-visible:ring-[var(--border)]",
        ],
        danger: [
          "bg-[var(--error)] text-white",
          "hover:bg-red-700",
          "focus-visible:ring-[var(--error)]",
        ],
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
)

Button.displayName = "Button"
