import { trpc } from "@/lib/trpc/client";

/**
 * Hook to create a new category
 * Invalidates category list queries on success
 */
export function useCreateCategory() {
  const utils = trpc.useUtils();

  return trpc.category.create.useMutation({
    onSuccess: () => {
      // Invalidate all category queries to refetch updated data
      void utils.category.getAll.invalidate();
    },
  });
}

/**
 * Hook to update a category
 * Invalidates category queries on success
 */
export function useUpdateCategory() {
  const utils = trpc.useUtils();

  return trpc.category.update.useMutation({
    onSuccess: (data) => {
      // Invalidate all category queries
      void utils.category.getAll.invalidate();
      // Invalidate the specific category query
      void utils.category.getById.invalidate({ id: data.id });
      // Invalidate by key and slug if they exist
      if (data.key) {
        void utils.category.getByKey.invalidate({ key: data.key });
      }
      if (data.slug) {
        void utils.category.getBySlug.invalidate({ slug: data.slug });
      }
    },
  });
}

/**
 * Hook to soft delete a category
 * Invalidates category queries on success
 */
export function useDeleteCategory() {
  const utils = trpc.useUtils();

  return trpc.category.delete.useMutation({
    onSuccess: (data) => {
      // Invalidate all category queries (including those with includeDeleted)
      void utils.category.getAll.invalidate();
      // Invalidate the specific category query
      void utils.category.getById.invalidate({ id: data.id });
      // Invalidate by key and slug if they exist
      if (data.key) {
        void utils.category.getByKey.invalidate({ key: data.key });
      }
      if (data.slug) {
        void utils.category.getBySlug.invalidate({ slug: data.slug });
      }
    },
  });
}

/**
 * Hook to restore a soft-deleted category
 * Invalidates category queries on success
 */
export function useRestoreCategory() {
  const utils = trpc.useUtils();

  return trpc.category.restore.useMutation({
    onSuccess: (data) => {
      // Invalidate all category queries (including those with includeDeleted)
      void utils.category.getAll.invalidate();
      // Invalidate the specific category query
      void utils.category.getById.invalidate({ id: data.id });
      // Invalidate by key and slug if they exist
      if (data.key) {
        void utils.category.getByKey.invalidate({ key: data.key });
      }
      if (data.slug) {
        void utils.category.getBySlug.invalidate({ slug: data.slug });
      }
    },
  });
}
