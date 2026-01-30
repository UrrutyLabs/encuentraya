"use client";

import { useState, useMemo, useEffect } from "react";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { useProDetail } from "@/hooks/pro";
import { useRebookTemplate } from "@/hooks/order";

export interface UseLocationStepDataReturn {
  address: string;
  hours: string;
  setAddress: (value: string) => void;
  setHours: (value: string) => void;
  pro: ReturnType<typeof useProDetail>["pro"];
  estimatedCost: number | undefined;
}

/**
 * Encapsulates data fetching and state for LocationStep (rebook template, pro, initial values, estimated cost)
 */
export function useLocationStepData(): UseLocationStepDataReturn {
  const { state } = useWizardState();
  const { data: rebookTemplate } = useRebookTemplate(
    state.rebookFrom || undefined
  );
  const { pro } = useProDetail(state.proId || undefined);

  const initialAddress = useMemo(
    () => state.address || rebookTemplate?.addressText || "",
    [state.address, rebookTemplate?.addressText]
  );
  const initialHours = useMemo(
    () => state.hours || rebookTemplate?.estimatedHours.toString() || "",
    [state.hours, rebookTemplate?.estimatedHours]
  );

  const [address, setAddress] = useState(initialAddress);
  const [hours, setHours] = useState(initialHours);

  // Sync local state when initial values change (e.g., from rebook template)
  useEffect(() => {
    setAddress(initialAddress);
  }, [initialAddress]);
  useEffect(() => {
    setHours(initialHours);
  }, [initialHours]);

  const estimatedCost = useMemo(() => {
    if (!pro || !hours) return undefined;
    return parseFloat(hours) * pro.hourlyRate;
  }, [pro, hours]);

  return {
    address,
    hours,
    setAddress,
    setHours,
    pro,
    estimatedCost,
  };
}
