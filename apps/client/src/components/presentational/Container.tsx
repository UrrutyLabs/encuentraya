import { type ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  /**
   * Maximum width of the container
   * @default "4xl"
   */
  maxWidth?: "4xl" | "6xl" | "full";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Container Component
 *
 * Reusable container component that provides consistent max-width and centering.
 * Used throughout the app to maintain consistent page width.
 *
 * @example
 * ```tsx
 * <Container maxWidth="4xl">
 *   <YourContent />
 * </Container>
 * ```
 */
export function Container({
  children,
  maxWidth = "4xl",
  className = "",
}: ContainerProps) {
  const maxWidthClasses = {
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    full: "max-w-full",
  };

  // For full width, don't add mx-auto
  if (maxWidth === "full") {
    return <div className={className}>{children}</div>;
  }

  const classes = ["mx-auto", maxWidthClasses[maxWidth], className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
