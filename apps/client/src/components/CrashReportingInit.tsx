"use client";

import { useEffect } from "react";
import { initCrashReporting } from "@/lib/crash-reporting";

/**
 * Client-side component to initialize crash reporting
 * Runs only on the client side
 */
export function CrashReportingInit() {
  useEffect(() => {
    initCrashReporting();
  }, []);

  return null;
}
