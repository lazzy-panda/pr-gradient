"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Blogger, Placement } from "@/lib/types";

export function useBloggers(query: string = "") {
  return useQuery({
    queryKey: ["bloggers", query],
    queryFn: () => api.get<{ bloggers: Blogger[] }>(`/api/bloggers${query ? `?q=${encodeURIComponent(query)}` : ""}`),
    select: (d) => d.bloggers,
  });
}

export function useBlogger(id: string | null) {
  return useQuery({
    queryKey: ["blogger", id],
    queryFn: () => api.get<{ blogger: Blogger & { placements: Placement[] } }>(`/api/bloggers/${id}`),
    enabled: !!id,
    select: (d) => d.blogger,
  });
}

export function useCreateBlogger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => api.post<{ blogger: Blogger }>("/api/bloggers", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bloggers"] }),
  });
}

export function useUpdateBlogger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch<{ blogger: Blogger }>(`/api/bloggers/${id}`, patch),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["bloggers"] });
      qc.invalidateQueries({ queryKey: ["blogger", vars.id] });
    },
  });
}
