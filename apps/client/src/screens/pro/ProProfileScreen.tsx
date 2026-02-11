"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { AppShell } from "@/components/presentational/AppShell";
import { SearchBar } from "@/components/search/SearchBar";
import { useSetMobileHeader } from "@/contexts/MobileHeaderContext";
import { ProProfileSkeleton } from "@/components/presentational/ProProfileSkeleton";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { Breadcrumbs } from "@/components/presentational/Breadcrumbs";
import { useProDetail } from "@/hooks/pro";
import { useAuth } from "@/hooks/auth";
import { useCategories, useCategoryBySlug } from "@/hooks/category";
import { useSubcategoryBySlugAndCategoryId } from "@/hooks/subcategory";
import { useSearchLocation } from "@/contexts/SearchLocationContext";
import {
  ProProfileHeader,
  ProBio,
  ProOverview,
  ProAvailability,
  ProServicesOffered,
  ProReviews,
  ProRequestForm,
} from "@/components/pro";

export function ProProfileScreen() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const proId = params.proId as string;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const searchQuery = searchParams.get("q") || "";

  // Get category/subcategory from URL params
  const categorySlug = searchParams.get("category") || undefined;
  const subcategorySlug = searchParams.get("subcategory") || undefined;

  // Fetch category and subcategory from slugs first (needed for pro query with categoryId)
  const { category } = useCategoryBySlug(categorySlug);
  const { subcategory } = useSubcategoryBySlugAndCategoryId(
    subcategorySlug,
    category?.id
  );

  const { pro, isLoading, error } = useProDetail(proId, category?.id);
  const { user, loading: authLoading } = useAuth();
  const { categories } = useCategories();
  const { initialLocation, initialZipCode } = useSearchLocation();
  const setHeader = useSetMobileHeader();

  useEffect(() => {
    if (pro?.name) {
      setHeader?.setTitle(pro.name);
      setHeader?.setBackHref("/");
    }
    return () => {
      setHeader?.setTitle(null);
      setHeader?.setBackHref(null);
    };
    // setHeader (context value) changes when state updates, which would cause an infinite loop.
    // The underlying setters are stable; we only need to react to pro?.name changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pro?.name]);

  // Map categoryIds to Category objects for display
  const proCategories = useMemo(
    () =>
      pro?.categoryIds
        ? categories.filter((cat) => pro.categoryIds.includes(cat.id))
        : [],
    [pro, categories]
  );

  // Check if pro offers the selected service
  const serviceValidationError = useMemo(() => {
    if (!category || !pro) {
      return null; // No category selected or pro not loaded yet
    }

    // Check if pro offers this category
    if (!pro.categoryIds.includes(category.id)) {
      return "Este profesional no ofrece servicios en esta categoría.";
    }

    // If subcategory is provided, check if pro offers it
    // Note: We don't have subcategoryIds on Pro yet, so we'll rely on backend validation
    // For now, we only validate category match
    return null;
  }, [category, pro]);

  // Build breadcrumbs (include location in hrefs so search respects user's location)
  const breadcrumbItems = useMemo(() => {
    const items: Array<{ label: string; href?: string }> = [
      { label: "Home", href: "/" },
    ];

    if (category) {
      const params = new URLSearchParams({ category: category.slug });
      if (initialLocation?.trim())
        params.set("location", initialLocation.trim());
      if (initialZipCode?.trim()) params.set("zipCode", initialZipCode.trim());
      items.push({
        label: category.name,
        href: `/search/results?${params.toString()}`,
      });
    }

    if (subcategory && category) {
      const params = new URLSearchParams({
        category: category.slug,
        subcategory: subcategory.slug,
      });
      if (initialLocation?.trim())
        params.set("location", initialLocation.trim());
      if (initialZipCode?.trim()) params.set("zipCode", initialZipCode.trim());
      items.push({
        label: subcategory.name,
        href: `/search/results?${params.toString()}`,
      });
    }

    // Current page (pro name) - not clickable
    if (pro) {
      items.push({
        label: pro.name,
      });
    }

    return items;
  }, [category, subcategory, pro, initialLocation, initialZipCode]);

  // Calculate derived states
  const isActive = useMemo(
    () => pro?.isApproved && !pro?.isSuspended,
    [pro?.isApproved, pro?.isSuspended]
  );

  const handleReserveClick = () => {
    if (authLoading) {
      // Still checking auth, wait
      return;
    }
    if (!user) {
      // Not authenticated, show modal
      setShowAuthModal(true);
      return;
    }
    // Ensure pro exists before proceeding
    if (!pro?.id) {
      return;
    }

    // Build wizard URL with category/subcategory if present
    const params = new URLSearchParams();
    params.set("proId", pro.id);
    if (categorySlug) {
      params.set("category", categorySlug);
    }
    if (subcategorySlug) {
      params.set("subcategory", subcategorySlug);
    }

    // Authenticated, proceed to job creation
    router.push(`/book?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <AppShell
        showLogin={false}
        centerContent={
          <SearchBar initialQuery={searchQuery} preserveParams={true} />
        }
      >
        <div className="px-4 py-4 md:py-8">
          <ProProfileSkeleton />
        </div>
      </AppShell>
    );
  }

  if (error || !pro) {
    return (
      <AppShell
        showLogin={false}
        centerContent={
          <SearchBar initialQuery={searchQuery} preserveParams={true} />
        }
      >
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <Text variant="h2" className="mb-2 text-text">
                Profesional no encontrado
              </Text>
              <Text variant="body" className="text-muted mb-4">
                El profesional que buscas no existe o fue eliminado.
              </Text>
              <Link href="/">
                <Button
                  variant="primary"
                  className="flex items-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a búsqueda
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      showLogin={true}
      centerContent={
        <SearchBar initialQuery={searchQuery} preserveParams={true} />
      }
    >
      <div className="px-4 py-4 md:py-8 pb-24 lg:pb-4 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          {breadcrumbItems.length > 1 && (
            <div className="mb-4 md:mb-6">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
          )}

          {/* Service Validation Error */}
          {serviceValidationError && (
            <div className="mb-4 md:mb-6">
              <Card className="p-4 border-warning bg-warning/10">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <Text
                      variant="body"
                      className="font-medium text-warning mb-1"
                    >
                      Servicio no disponible
                    </Text>
                    <Text variant="small" className="text-muted">
                      {serviceValidationError}
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Scrollable Profile (2 columns on lg+) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pro Profile Header */}
              <ProProfileHeader
                name={pro.name}
                avatarUrl={pro.avatarUrl}
                rating={pro.rating}
                reviewCount={pro.reviewCount}
              />

              {/* Bio Section */}
              <ProBio bio={pro.bio} />

              {/* Overview Section */}
              <ProOverview
                completedJobsCount={pro.completedJobsCount}
                serviceArea={pro.serviceArea}
              />

              {/* Availability Section */}
              {pro.availabilitySlots && pro.availabilitySlots.length > 0 && (
                <ProAvailability availabilitySlots={pro.availabilitySlots} />
              )}

              {/* Services Offered Section */}
              {proCategories.length > 0 && (
                <ProServicesOffered categories={proCategories} />
              )}

              {/* Reviews Section */}
              <ProReviews
                proId={pro.id}
                rating={pro.rating}
                reviewCount={pro.reviewCount}
              />
            </div>

            {/* Right: Fixed Request Form (1 column on lg+) - only when category context set */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="lg:sticky lg:top-4">
                {isActive &&
                  !pro.isSuspended &&
                  !serviceValidationError &&
                  category && (
                    <ProRequestForm
                      hourlyRate={pro.hourlyRate}
                      startingPriceForCategory={pro.startingPriceForCategory}
                      proId={pro.id}
                      onContratar={handleReserveClick}
                      disabled={authLoading}
                      isMobileFooter={false}
                    />
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Sticky Footer - only when category context set */}
      {isActive && !pro.isSuspended && !serviceValidationError && category && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border bg-surface shadow-lg">
          <div className="px-4 py-3">
            <ProRequestForm
              hourlyRate={pro.hourlyRate}
              startingPriceForCategory={pro.startingPriceForCategory}
              proId={pro.id}
              onContratar={handleReserveClick}
              disabled={authLoading}
              isMobileFooter={true}
            />
          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        returnUrl={(() => {
          const params = new URLSearchParams();
          params.set("proId", pro.id);
          if (categorySlug) params.set("category", categorySlug);
          if (subcategorySlug) params.set("subcategory", subcategorySlug);
          return `/book?${params.toString()}`;
        })()}
        title="Iniciá sesión para contratar"
        message="Necesitás iniciar sesión para contratar un servicio con este profesional."
      />
    </AppShell>
  );
}
