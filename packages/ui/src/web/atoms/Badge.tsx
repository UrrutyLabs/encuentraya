import { HTMLAttributes, ReactNode } from "react";
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: "success" | "warning" | "danger" | "info";
  showIcon?: boolean;
}

const variantIcons = {
  success: CheckCircle,
  warning: AlertCircle,
  danger: XCircle,
  info: Info,
};

export function Badge({
  children,
  variant = "info",
  className = "",
  showIcon = false,
  ...props
}: BadgeProps) {
  const variantClasses = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-info/10 text-info border-info/20",
  };

  const Icon = showIcon ? variantIcons[variant] : null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
}
