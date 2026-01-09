import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-lg p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
