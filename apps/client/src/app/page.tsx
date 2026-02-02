import { Suspense } from "react";
import { SearchScreen } from "@/screens/search/SearchScreen";

function HomePageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Cargando...</div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <SearchScreen />
    </Suspense>
  );
}
