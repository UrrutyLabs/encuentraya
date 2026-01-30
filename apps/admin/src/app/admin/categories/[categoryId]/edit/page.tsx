import { CategoryEditScreen } from "@/screens/categories/CategoryEditScreen";

interface CategoryEditPageProps {
  params: Promise<{
    categoryId: string;
  }>;
}

export default async function CategoryEditPage({
  params,
}: CategoryEditPageProps) {
  const { categoryId } = await params;
  return <CategoryEditScreen categoryId={categoryId} />;
}
