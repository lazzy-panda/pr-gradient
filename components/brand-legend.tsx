"use client";

import { AlertTriangle } from "lucide-react";
import { useBrands } from "@/hooks/use-brands";

export function BrandLegend() {
  const { brands } = useBrands();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 18px", padding: "18px 4px 4px", fontSize: 12, color: "var(--color-ink-3)" }}>
      {brands.map((b) => (
        <span key={b.code} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="dot-mini" style={{ background: b.color }} />
          <span>{b.name}</span>
        </span>
      ))}
      <span style={{ width: 1, height: 16, background: "var(--color-line-1)" }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 14, height: 14, borderRadius: 999, background: "var(--color-conflict)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle size={9} color="#fff" strokeWidth={2.6} />
        </span>
        Конфликт
      </span>
    </div>
  );
}
