"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BrandRow } from "@/lib/types";
import { FALLBACK_BRAND_COLOR } from "@/lib/domain";

interface BrandsResponse {
  brands: BrandRow[];
}

export function useBrands(options: { includeArchived?: boolean } = {}) {
  const { includeArchived = false } = options;
  const query = useQuery({
    queryKey: ["brands", { includeArchived }],
    queryFn: () => api.get<BrandsResponse>(`/api/brands${includeArchived ? "?includeArchived=true" : ""}`),
    select: (d) => d.brands,
    staleTime: 5 * 60_000, // brands rarely change
  });

  const byCode = useMemo(() => {
    const m: Record<string, BrandRow> = {};
    for (const b of query.data ?? []) m[b.code] = b;
    return m;
  }, [query.data]);

  return {
    brands: query.data ?? [],
    byCode,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/** Lightweight lookup helpers for components that already have a brand code in hand. */
export function brandLabel(byCode: Record<string, BrandRow>, code: string): string {
  return byCode[code]?.name ?? code;
}
export function brandShort(byCode: Record<string, BrandRow>, code: string): string {
  return byCode[code]?.shortCode ?? code.slice(0, 2);
}
export function brandColor(byCode: Record<string, BrandRow>, code: string): string {
  return byCode[code]?.color ?? FALLBACK_BRAND_COLOR;
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => api.post<{ brand: BrandRow }>("/api/brands", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, patch }: { code: string; patch: Record<string, unknown> }) =>
      api.patch<{ brand: BrandRow }>(`/api/brands/${code}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}
