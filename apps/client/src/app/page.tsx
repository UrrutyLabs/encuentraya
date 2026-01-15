"use client";

import { useClientAuth } from "@/hooks/auth";
import { LandingLoading } from "@/components/landing/LandingLoading";
import { LandingScreen } from "@/screens/landing/LandingScreen";

export default function Home() {
  const { isLoading } = useClientAuth();

  if (isLoading) {
    return <LandingLoading />;
  }

  return <LandingScreen />;
}
