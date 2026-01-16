import { HTMLAttributes, ReactNode } from "react";
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "new";
  showIcon?: boolean;
}

const variantIcons = {
  success: CheckCircle,
  warning: AlertCircle,
  danger: XCircle,
  info: Info,
  new: Info, // Use Info icon for "new" variant
};

export function Badge({
  children,
  variant = "info",
  className = "",
  showIcon = false,
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: {
      backgroundColor: "rgba(22, 163, 74, 0.1)",
      color: "#16A34A",
      borderColor: "rgba(22, 163, 74, 0.2)",
    },
    warning: {
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      color: "#F59E0B",
      borderColor: "rgba(245, 158, 11, 0.2)",
    },
    danger: {
      backgroundColor: "rgba(220, 38, 38, 0.1)",
      color: "#DC2626",
      borderColor: "rgba(220, 38, 38, 0.2)",
    },
    info: {
      backgroundColor: "rgba(37, 99, 235, 0.1)",
      color: "#2563eb",
      borderColor: "rgba(37, 99, 235, 0.2)",
    },
    new: {
      backgroundColor: "rgba(44, 177, 188, 0.1)",
      color: "#2CB1BC",
      borderColor: "rgba(44, 177, 188, 0.2)",
    },
  };

  const Icon = showIcon ? variantIcons[variant] : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${className}`}
      style={{ 
        lineHeight: '1.2',
        ...variantStyles[variant]
      }}
      {...props}
    >
      {Icon && (
        <Icon 
          className="w-3 h-3 shrink-0" 
          style={{ 
            display: 'inline-block',
            verticalAlign: 'middle',
            marginTop: '-1px'
          }} 
        />
      )}
      <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        {children}
      </span>
    </span>
  );
}
