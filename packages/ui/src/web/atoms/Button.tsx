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
    "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = {
    primary:
      "bg-primary text-white hover:opacity-90 focus:ring-primary",
    secondary:
      "bg-secondary text-white hover:opacity-90 focus:ring-secondary",
    ghost:
      "bg-transparent text-primary border border-border hover:bg-surface focus:ring-primary",
    danger: "bg-danger text-white hover:opacity-90 focus:ring-danger",
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
