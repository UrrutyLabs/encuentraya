"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Text } from "@repo/ui";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted mb-4">
      <Link href="/admin" className="hover:text-primary transition-colors">
        Admin
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <Text variant="small" className="text-text">
              {item.label}
            </Text>
          )}
        </div>
      ))}
    </nav>
  );
}
