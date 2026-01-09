import { HTMLAttributes, ReactNode } from "react";

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  variant?: "body" | "small" | "xs" | "h1" | "h2";
  as?: "p" | "h1" | "h2" | "span" | "div";
}

export function Text({
  children,
  variant = "body",
  as,
  className = "",
  ...props
}: TextProps) {
  const Component = as || (variant === "h1" ? "h1" : variant === "h2" ? "h2" : "p");

  const variantClasses = {
    h1: "text-2xl font-bold leading-8 text-text",
    h2: "text-xl font-semibold leading-7 text-text",
    body: "text-base leading-6 text-text",
    small: "text-sm leading-5 text-text",
    xs: "text-xs leading-4 text-text",
  };

  return (
    <Component className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
}
