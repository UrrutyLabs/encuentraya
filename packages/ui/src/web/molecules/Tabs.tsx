import { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { Text } from "../atoms/Text";

export interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className = "" }: TabsProps) {
  return (
    <div className={`border-b border-border ${className}`}>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
                whitespace-nowrap
                ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-text hover:border-border"
                }
              `}
              aria-selected={isActive}
              role="tab"
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              <Text variant="small" className={isActive ? "font-semibold" : "font-medium"}>
                {tab.label}
              </Text>
            </button>
          );
        })}
      </div>
    </div>
  );
}
