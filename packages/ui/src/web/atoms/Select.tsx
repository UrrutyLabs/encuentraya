import { SelectHTMLAttributes, ReactNode } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({
  label,
  className = "",
  children,
  ...props
}: SelectProps) {
  const selectClasses = `w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-0 focus:border-border ${className}`;

  if (label) {
    return (
      <div>
        <label className="block text-sm font-medium text-text mb-1">
          {label}
        </label>
        <select className={selectClasses} {...props}>
          {children}
        </select>
      </div>
    );
  }

  return (
    <select className={selectClasses} {...props}>
      {children}
    </select>
  );
}
