import { trpc } from "@/lib/trpc/client";

/**
 * Hook to create a new subcategory
 * Invalidates subcategory queries on success
 */
export function useCreateSubcategory() {
  const utils = trpc.useUtils();

  return trpc.subcategory.create.useMutation({
    onSuccess: (data) => {
      // Invalidate subcategory queries for the category
      void utils.subcategory.getByCategoryId.invalidate({
        categoryId: data.categoryId,
      });
      // Invalidate all subcategories query
      void utils.subcategory.getAll.invalidate();
      // Invalidate the specific subcategory query
      void utils.subcategory.getById.invalidate({ id: data.id });
    },
  });
}

/**
 * Hook to update a subcategory
 * Invalidates subcategory queries on success
 */
export function useUpdateSubcategory() {
  const utils = trpc.useUtils();

  return trpc.subcategory.update.useMutation({
    onSuccess: (data) => {
      // Invalidate subcategory queries for the category
      void utils.subcategory.getByCategoryId.invalidate({
        categoryId: data.categoryId,
      });
      // Invalidate all subcategories query
      void utils.subcategory.getAll.invalidate();
      // Invalidate the specific subcategory query
      void utils.subcategory.getById.invalidate({ id: data.id });
    },
  });
}

/**
 * Hook to delete a subcategory
 * Invalidates subcategory queries on success
 *
 * Note: This performs a hard delete (permanent removal)
 */
export function useDeleteSubcategory() {
  const utils = trpc.useUtils();

  return trpc.subcategory.delete.useMutation({
    onSuccess: (data) => {
      // Invalidate subcategory queries for the category
      void utils.subcategory.getByCategoryId.invalidate({
        categoryId: data.categoryId,
      });
      // Invalidate all subcategories query
      void utils.subcategory.getAll.invalidate();
      // Invalidate the specific subcategory query
      void utils.subcategory.getById.invalidate({ id: data.id });
    },
  });
}
