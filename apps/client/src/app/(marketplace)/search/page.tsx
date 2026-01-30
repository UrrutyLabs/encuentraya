import { SearchScreen } from "@/screens/search/SearchScreen";

// Force dynamic rendering to prevent SSR issues with browser APIs
export const dynamic = "force-dynamic";

export default function SearchPage() {
  return <SearchScreen />;
}
