import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "min-h-[44px] md:min-h-0 px-4 py-3 md:px-4 md:py-2 rounded-lg font-medium text-base md:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed touch-manipulation active:opacity-75";
  const variantClasses = {
    primary:
      "bg-primary text-white hover:opacity-90 focus:ring-primary disabled:hover:opacity-50",
    secondary:
      "bg-secondary text-white hover:opacity-90 focus:ring-secondary disabled:hover:opacity-50",
    ghost:
      "bg-transparent text-primary border border-border hover:bg-surface focus:ring-primary disabled:hover:bg-transparent",
    danger:
      "bg-danger text-white hover:opacity-90 focus:ring-danger disabled:hover:opacity-50",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
