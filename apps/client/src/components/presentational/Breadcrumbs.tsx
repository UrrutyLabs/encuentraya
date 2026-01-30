"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Text } from "@repo/ui";

export interface BreadcrumbItem {
  label: string;
  href?: string; // If provided, renders as Link; otherwise plain text (current page)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs Component
 *
 * Reusable breadcrumb navigation component
 * Renders: Home > Category > Subcategory > CurrentPage
 * Last item is not clickable (current page)
 */
export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 ${className}`}
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {isLast ? (
                <Text variant="small" className="text-text font-medium">
                  {item.label}
                </Text>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-muted hover:text-text transition-colors"
                >
                  <Text variant="small">{item.label}</Text>
                </Link>
              ) : (
                <Text variant="small" className="text-muted">
                  {item.label}
                </Text>
              )}
              {!isLast && (
                <ChevronRight
                  className="w-4 h-4 text-muted shrink-0"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
