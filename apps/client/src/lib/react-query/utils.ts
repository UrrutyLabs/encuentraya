/**
 * Re-export React Query utilities from shared package
 * This maintains backward compatibility with existing imports
 */

export {
  isClientError,
  isServerError,
  createOptimisticUpdate,
  invalidateRelatedQueries,
  refetchQueries,
  type OptimisticUpdateConfig,
} from "@repo/react-query/utils";
