import { redirect } from "next/navigation";

/**
 * /search redirects to home (/) — home is the search experience.
 * Results remain at /search/results.
 */
export default function SearchPage() {
  redirect("/");
}
