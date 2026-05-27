"use client";

import { useEffect, useState } from "react";

export type ViewMode = "calendar" | "schedule" | "overview";

const KEY = "prg.view";

export function useViewMode(): [ViewMode, (v: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>("calendar");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored === "calendar" || stored === "schedule" || stored === "overview") setView(stored);
    } catch {}
  }, []);

  const set = (v: ViewMode) => {
    setView(v);
    try { localStorage.setItem(KEY, v); } catch {}
  };

  return [view, set];
}
