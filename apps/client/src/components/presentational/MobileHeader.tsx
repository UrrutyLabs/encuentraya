"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Text } from "@repo/ui";
import {
  getMobileHeaderTitle,
  getMobileHeaderBackHref,
  getMobileHeaderShowBack,
} from "@/config/mobileHeaderMap";
import { useMobileHeader } from "@/contexts/MobileHeaderContext";
import { MOBILE_SHELL } from "@/config/clientMobileTabs";

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const override = useMobileHeader();

  const title =
    override?.title !== undefined && override.title !== null
      ? override.title
      : getMobileHeaderTitle(pathname);

  const showBack = getMobileHeaderShowBack(pathname);
  const backHref =
    override?.backHref !== undefined && override.backHref !== null
      ? override.backHref
      : getMobileHeaderBackHref(pathname);

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border flex items-center min-h-[56px]"
      style={{
        minHeight: MOBILE_SHELL.headerHeight,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
      aria-label="Cabecera"
    >
      <div className="flex items-center w-full px-2 min-h-[44px]">
        {showBack ? (
          backHref ? (
            <Link
              href={backHref}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 text-text hover:text-primary touch-manipulation"
              aria-label="Volver"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 text-text hover:text-primary touch-manipulation"
              aria-label="Volver"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden />
            </button>
          )
        ) : (
          <div className="w-10 min-w-[40px]" aria-hidden />
        )}

        <div className="flex-1 min-w-0 flex justify-center px-2">
          <Text
            variant="body"
            className="font-semibold truncate text-center text-text"
          >
            {title}
          </Text>
        </div>

        <div className="w-10 min-w-[40px]" aria-hidden />
      </div>
    </header>
  );
}
