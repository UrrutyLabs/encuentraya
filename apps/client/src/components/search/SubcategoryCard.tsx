"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { type Subcategory } from "@repo/domain";

interface SubcategoryCardProps {
  subcategory: Subcategory;
  onClick: (subcategory: Subcategory) => void;
}

// Generate a color based on subcategory ID for consistent placeholder
function getPlaceholderColor(id: string): string {
  const colors = [
    "from-primary/30 to-primary/10",
    "from-secondary/30 to-secondary/10",
    "from-accent/30 to-accent/10",
    "from-success/30 to-success/10",
    "from-warning/30 to-warning/10",
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index] || colors[0];
}

export const SubcategoryCard = memo(function SubcategoryCard({
  subcategory,
  onClick,
}: SubcategoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const placeholderColor = getPlaceholderColor(subcategory.id);

  return (
    <Card
      className="overflow-hidden hover:shadow-md active:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer touch-manipulation relative w-full aspect-[4/5]"
      onClick={() => onClick(subcategory)}
    >
      {/* Image fills the entire card */}
      <div className={`absolute inset-0 bg-linear-to-br ${placeholderColor}`}>
        {!imageError && subcategory.imageUrl ? (
          <Image
            src={subcategory.imageUrl}
            alt={subcategory.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Text variant="h3" className="text-primary">
                {subcategory.name.charAt(0).toUpperCase()}
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Name overlay: white, bottom left */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-linear-to-t from-black/70 via-black/40 to-transparent pointer-events-none"
        aria-hidden
      >
        <Text
          variant="body"
          className="text-lg md:text-xl font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        >
          {subcategory.name}
        </Text>
      </div>
    </Card>
  );
});
