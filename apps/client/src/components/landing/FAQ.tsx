"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Button } from "@repo/ui";
import { useScrollReveal } from "@/hooks/shared/useScrollReveal";

import type { FAQItem } from "@repo/content";

interface FAQProps {
  title: string;
  description: string;
  items: FAQItem[];
  showContactCTA?: boolean;
  ctaText?: string;
  ctaHref?: string;
}

export function FAQ({
  title,
  description,
  items,
  showContactCTA = true,
  ctaText = "Contactanos",
  ctaHref = "/contact",
}: FAQProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(
    new Set([0, 1, 2, 3]) // First 4 questions expanded by default
  );

  const { elementRef: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { elementRef: itemsRef, isVisible: itemsVisible } = useScrollReveal();
  const { elementRef: ctaRef, isVisible: ctaVisible } = useScrollReveal();

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div ref={headerRef} className="text-center mb-12">
            <Text
              variant="h1"
              className={`mb-4 text-primary transition-all duration-600 ${
                headerVisible
                  ? "animate-[fadeInDown_0.6s_ease-out]"
                  : "opacity-0"
              }`}
            >
              {title}
            </Text>
            <Text
              variant="body"
              className={`text-muted transition-all duration-600 ${
                headerVisible
                  ? "animate-[fadeIn_0.6s_ease-out_0.15s_both]"
                  : "opacity-0"
              }`}
            >
              {description}
            </Text>
          </div>

          <div
            ref={itemsRef}
            className={`space-y-4 mb-8 transition-all duration-600 ${
              itemsVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {items.map((item, index) => {
              const isOpen = openItems.has(index);
              const delay = index * 0.1;
              return (
                <Card
                  key={index}
                  className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    itemsVisible ? "animate-[slideUp_0.5s_ease-out]" : ""
                  }`}
                  style={
                    itemsVisible
                      ? {
                          animationDelay: `${delay}s`,
                          animationFillMode: "both",
                        }
                      : undefined
                  }
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg active:scale-[0.98]"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <Text variant="h2" className="text-text pr-4 text-lg">
                      {item.question}
                    </Text>
                    <ChevronDown
                      className={`w-5 h-5 text-muted shrink-0 transition-all duration-300 ${
                        isOpen ? "transform rotate-180 scale-110" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    id={`faq-answer-${index}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                    aria-hidden={!isOpen}
                  >
                    <div className="px-4 pb-4">
                      <Text
                        variant="body"
                        className="text-muted leading-relaxed"
                      >
                        {item.answer}
                      </Text>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {showContactCTA && (
            <div
              ref={ctaRef}
              className={`text-center transition-all duration-600 ${
                ctaVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className={`inline-flex items-center gap-2 mb-4 ${
                  ctaVisible ? "animate-[fadeIn_0.6s_ease-out_0.1s_both]" : ""
                }`}
              >
                <HelpCircle className="w-5 h-5 text-muted transition-transform duration-300 hover:scale-110" />
                <Text variant="body" className="text-muted">
                  ¿Tenés otra duda?
                </Text>
              </div>
              <div
                className={
                  ctaVisible
                    ? "animate-[fadeInUp_0.6s_ease-out_0.25s_both]"
                    : ""
                }
              >
                <Link href={ctaHref}>
                  <Button
                    variant="ghost"
                    className="text-primary transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {ctaText}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
