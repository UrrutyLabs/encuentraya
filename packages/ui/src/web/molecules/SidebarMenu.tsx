import { type LucideIcon } from "lucide-react";
import { Text } from "../atoms/Text";

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface SidebarMenuProps {
  items: SidebarMenuItem[];
  activeItem: string;
  onItemChange: (itemId: string) => void;
  className?: string;
}

export function SidebarMenu({
  items,
  activeItem,
  onItemChange,
  className = "",
}: SidebarMenuProps) {
  return (
    <nav className={`flex flex-col gap-1 ${className}`}>
      {items.map((item) => {
        const isActive = activeItem === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onItemChange(item.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
              text-left
              ${
                isActive
                  ? "bg-primary/10 text-primary border-l-4 border-primary"
                  : "text-muted hover:text-text hover:bg-surface"
              }
            `}
            aria-selected={isActive}
            role="menuitem"
          >
            {Icon && (
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-primary" : "text-muted"
                }`}
              />
            )}
            <Text
              variant="small"
              className={isActive ? "font-semibold" : "font-medium"}
            >
              {item.label}
            </Text>
          </button>
        );
      })}
    </nav>
  );
}
