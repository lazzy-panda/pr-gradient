"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Placement, ConflictResult } from "@/lib/types";

export interface PlacementsFilters {
  from?: string;
  to?: string;
  brand?: string;
  bloggerId?: string;
}

function qs(params: PlacementsFilters): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  return entries.length ? "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&") : "";
}

export function usePlacements(filters: PlacementsFilters = {}) {
  return useQuery({
    queryKey: ["placements", filters],
    queryFn: () => api.get<{ placements: Placement[] }>("/api/placements" + qs(filters)),
    select: (d) => d.placements,
  });
}

export function useCreatePlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      api.post<{ placement: Placement; conflict: ConflictResult }>("/api/placements", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["placements"] }),
  });
}

export function useUpdatePlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch<{ placement: Placement; conflict: ConflictResult }>(`/api/placements/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["placements"] }),
  });
}

export function useDeletePlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ placement: Placement }>(`/api/placements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["placements"] }),
  });
}

export function useCheckConflict() {
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      api.post<ConflictResult>("/api/placements/check-conflict", input),
  });
}
