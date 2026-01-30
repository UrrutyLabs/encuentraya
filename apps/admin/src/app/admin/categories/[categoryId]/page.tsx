import { CategoryDetailScreen } from "@/screens/categories/CategoryDetailScreen";

interface CategoryDetailPageProps {
  params: Promise<{
    categoryId: string;
  }>;
}

export default async function CategoryDetailPage({
  params,
}: CategoryDetailPageProps) {
  const { categoryId } = await params;
  return <CategoryDetailScreen categoryId={categoryId} />;
}
