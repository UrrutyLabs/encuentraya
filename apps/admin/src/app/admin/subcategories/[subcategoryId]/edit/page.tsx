import { SubcategoryEditScreen } from "@/screens/subcategories/SubcategoryEditScreen";

interface SubcategoryEditPageProps {
  params: Promise<{
    subcategoryId: string;
  }>;
}

export default async function SubcategoryEditPage({
  params,
}: SubcategoryEditPageProps) {
  const { subcategoryId } = await params;
  return <SubcategoryEditScreen subcategoryId={subcategoryId} />;
}
