import { SubcategoryDetailScreen } from "@/screens/subcategories/SubcategoryDetailScreen";

interface SubcategoryDetailPageProps {
  params: Promise<{
    subcategoryId: string;
  }>;
}

export default async function SubcategoryDetailPage({
  params,
}: SubcategoryDetailPageProps) {
  const { subcategoryId } = await params;
  return <SubcategoryDetailScreen subcategoryId={subcategoryId} />;
}
