import { forwardRef } from "react"
import { cn } from "../lib/utils"

const Button = forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90",
        variant === "outline" && "border border-gray-200 bg-white shadow-sm hover:bg-gray-100",
        variant === "ghost" && "hover:bg-gray-100 hover:text-gray-900",
        size === "default" && "h-9 px-4 py-2",
        size === "sm" && "h-8 rounded-md px-3 text-xs",
        size === "lg" && "h-10 rounded-md px-8",
        size === "icon" && "h-9 w-9",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = 'Button'; // Add this line

Button.defaultProps = {
  variant: "default",
  size: "default",
}

export { Button }