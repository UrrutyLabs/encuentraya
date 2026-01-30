import { type ReactNode } from "react";

interface HeroTitleProps {
  children: ReactNode;
  /**
   * Size variant - responsive by default
   * @default "large"
   */
  size?: "large" | "xlarge";
  /**
   * Text alignment
   * @default "center"
   */
  align?: "center" | "left" | "right";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * HeroTitle Component
 *
 * A large, prominent title component for hero sections.
 * Provides consistent styling for hero titles across the app.
 *
 * @example
 * ```tsx
 * <HeroTitle>¿Qué necesitás arreglar?</HeroTitle>
 * <HeroTitle size="xlarge" align="center" className="mb-8">
 *   Tu título aquí
 * </HeroTitle>
 * ```
 */
export function HeroTitle({
  children,
  size = "large",
  align = "center",
  className = "",
}: HeroTitleProps) {
  const sizeClasses = {
    large: "text-3xl md:text-4xl lg:text-5xl", // 24px / 32px / 40px
    xlarge: "text-4xl md:text-5xl lg:text-6xl", // 32px / 40px / 48px
  };

  const alignClasses = {
    center: "text-center",
    left: "text-left",
    right: "text-right",
  };

  const classes = [
    "font-bold",
    "leading-tight",
    "text-text",
    sizeClasses[size],
    alignClasses[align],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <h1 className={classes}>{children}</h1>;
}
