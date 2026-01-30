"use client";

import { Text } from "./Text";

interface AvatarProps {
  /**
   * URL of the avatar image
   */
  avatarUrl?: string;
  /**
   * Name of the person (used for alt text and initials fallback)
   */
  name: string;
  /**
   * Size of the avatar
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "w-8 h-8",
    text: "text-xs",
  },
  md: {
    container: "w-12 h-12",
    text: "text-sm",
  },
  lg: {
    container: "w-24 h-24 md:w-28 md:h-28",
    text: "text-base",
  },
  xl: {
    container: "w-32 h-32",
    text: "text-lg",
  },
};

/**
 * Get initials from a name for avatar fallback
 */
function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return "?";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  if (parts.length === 0) {
    return "?";
  }

  const firstPart = parts[0];
  if (!firstPart || firstPart.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return firstPart.substring(0, 2).toUpperCase();
  }

  // Take first letter of first and last name
  const lastPart = parts[parts.length - 1];
  if (!lastPart || lastPart.length === 0) {
    return firstPart[0]?.toUpperCase() || "?";
  }

  const firstChar = firstPart[0];
  const lastChar = lastPart[0];
  if (!firstChar || !lastChar) {
    return "?";
  }
  return (firstChar + lastChar).toUpperCase();
}

/**
 * Avatar Component
 * Displays a user's avatar image or initials fallback
 * @example
 * <Avatar avatarUrl="/avatar.jpg" name="Juan Pérez" size="md" />
 */
export function Avatar({
  avatarUrl,
  name,
  size = "md",
  className = "",
}: AvatarProps) {
  const initials = getInitials(name);
  const sizeConfig = sizeClasses[size];

  return (
    <div className={`relative shrink-0 ${className}`}>
      {avatarUrl ? (
        <div
          className={`${sizeConfig.container} rounded-full overflow-hidden border-2 border-border relative`}
        >
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className={`${sizeConfig.container} rounded-full bg-primary/10 border-2 border-border flex items-center justify-center`}
        >
          <Text
            variant="small"
            className={`${sizeConfig.text} text-primary font-semibold`}
          >
            {initials}
          </Text>
        </div>
      )}
    </div>
  );
}
