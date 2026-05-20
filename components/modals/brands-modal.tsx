"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Plus, Archive, ArchiveRestore, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { useBrands, useCreateBrand, useUpdateBrand } from "@/hooks/use-brands";
import { usePlacements } from "@/hooks/use-placements";
import type { BrandRow } from "@/lib/types";

interface Props {
  onClose: () => void;
}

// Default color palette for new brands (curated to contrast against white).
const COLOR_PALETTE = [
  "#B91C5C", "#DB2777", "#EC4899", "#F97316", "#EA580C", "#D97706",
  "#CA8A04", "#65A30D", "#059669", "#0D9488", "#0891B2", "#0284C7",
  "#1D4ED8", "#4338CA", "#7C3AED", "#9333EA", "#C026D3", "#374151",
];

export function BrandsModal({ onClose }: Props) {
  const { brands, isLoading } = useBrands({ includeArchived: true });
  const { data: allPlacements = [] } = usePlacements({}); // load all for counts
  const [editing, setEditing] = useState<BrandRow | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const placementCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of allPlacements) m[p.brand] = (m[p.brand] ?? 0) + 1;
    return m;
  }, [allPlacements]);

  const active = brands.filter(b => !b.isArchived);
  const archived = brands.filter(b => b.isArchived);

  return (
    <div className="m-overlay" onClick={onClose}>
      <div className="m-shell" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="m-head">
          <div className="m-title">Бренды</div>
          <button className="iconbtn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="bm-body">
          {isLoading ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : (
            <>
              <div className="bm-section-head">
                <span>Активные · {active.length}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => setCreating(true)}>
                  <Plus size={13} /> Добавить бренд
                </button>
              </div>
              <div className="bm-list">
                {active.length === 0 ? (
                  <div className="bm-empty">Нет активных брендов.</div>
                ) : active.map(b => (
                  <BrandRow
                    key={b.code} brand={b}
                    placementCount={placementCount[b.code] ?? 0}
                    onEdit={() => setEditing(b)}
                  />
                ))}
              </div>

              {archived.length > 0 && (
                <>
                  <div className="bm-section-head" style={{ marginTop: 20 }}>
                    <span>В архиве · {archived.length}</span>
                  </div>
                  <div className="bm-list">
                    {archived.map(b => (
                      <BrandRow
                        key={b.code} brand={b}
                        placementCount={placementCount[b.code] ?? 0}
                        onEdit={() => setEditing(b)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {creating && (
        <BrandForm
          mode="create"
          existingCodes={brands.map(b => b.code)}
          onCancel={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}
      {editing && (
        <BrandForm
          mode="edit"
          brand={editing}
          existingCodes={brands.map(b => b.code)}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      <style>{`
        .m-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(11,11,12,0.40);
          display: flex; align-items: center; justify-content: center;
          padding: 32px;
          animation: m-fade 140ms ease-out;
        }
        .m-shell {
          width: 640px;
          background: var(--color-surface);
          border-radius: 14px;
          box-shadow: var(--sh-modal);
          max-height: calc(100vh - 64px);
          display: flex; flex-direction: column;
          animation: m-pop 160ms ease-out;
          overflow: hidden;
        }
        .m-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--color-line-2);
        }
        .m-title { font-size: 18px; font-weight: 600; }
        .bm-body { padding: 18px 24px 24px; overflow-y: auto; }
        .bm-section-head {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12px; font-weight: 600; color: var(--color-ink-3);
          text-transform: uppercase; letter-spacing: 0.04em;
          margin-bottom: 8px;
        }
        .bm-list {
          display: flex; flex-direction: column; gap: 0;
          border: 1px solid var(--color-line-2);
          border-radius: 8px;
          overflow: hidden;
        }
        .bm-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          background: transparent;
          border-bottom: 1px solid var(--color-line-2);
        }
        .bm-row:last-child { border-bottom: none; }
        .bm-row:hover { background: var(--color-bg); }
        .bm-empty {
          padding: 16px;
          text-align: center;
          font-size: 13px;
          color: var(--color-ink-3);
        }
      `}</style>
    </div>
  );
}

function BrandRow({ brand, placementCount, onEdit }: { brand: BrandRow; placementCount: number; onEdit: () => void }) {
  return (
    <div className="bm-row" style={{ opacity: brand.isArchived ? 0.65 : 1 }}>
      <span style={{ width: 16, height: 16, borderRadius: 4, background: brand.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500 }}>{brand.name}</div>
        <div style={{ fontSize: 11, color: "var(--color-ink-3)", fontFamily: "var(--font-mono)" }}>
          {brand.code} · {brand.shortCode}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--color-ink-3)", textAlign: "right" }}>
        <div>{placementCount} {pluralPlacements(placementCount)}</div>
        {!brand.isHolding && <div style={{ color: "var(--color-ink-4)" }}>внешний</div>}
      </div>
      <button className="iconbtn" onClick={onEdit} aria-label="Редактировать"><Pencil size={14} /></button>
    </div>
  );
}

function BrandForm({ mode, brand, existingCodes, onCancel, onSaved }: {
  mode: "create" | "edit";
  brand?: BrandRow;
  existingCodes: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const createMut = useCreateBrand();
  const updateMut = useUpdateBrand();

  const [code, setCode] = useState(brand?.code ?? "");
  const [name, setName] = useState(brand?.name ?? "");
  const [shortCode, setShortCode] = useState(brand?.shortCode ?? "");
  const [color, setColor] = useState(brand?.color ?? COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
  const [isHolding, setIsHolding] = useState(brand?.isHolding ?? true);
  const [isArchived, setIsArchived] = useState(brand?.isArchived ?? false);

  const codeInvalid = mode === "create" && (
    !/^[A-Z][A-Z0-9_]*$/.test(code) ||
    existingCodes.includes(code)
  );
  const codeError = mode === "create"
    ? (existingCodes.includes(code) ? "Код уже занят" : !code ? null : !/^[A-Z][A-Z0-9_]*$/.test(code) ? "UPPER_SNAKE_CASE" : null)
    : null;

  const canSave =
    !codeInvalid &&
    code.trim().length > 0 &&
    name.trim().length > 0 &&
    shortCode.trim().length > 0 &&
    /^#[0-9A-Fa-f]{6}$/.test(color);

  const submit = async () => {
    try {
      if (mode === "create") {
        await createMut.mutateAsync({
          code: code.trim(),
          name: name.trim(),
          shortCode: shortCode.trim().toUpperCase(),
          color,
          isHolding,
          sortOrder: 100,
        });
        toast.success(`Бренд «${name}» добавлен`);
      } else if (brand) {
        await updateMut.mutateAsync({
          code: brand.code,
          patch: {
            name: name.trim(),
            shortCode: shortCode.trim().toUpperCase(),
            color,
            isHolding,
            isArchived,
          },
        });
        toast.success(`Бренд «${name}» обновлён`);
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { body?: { error?: string } };
      toast.error("Ошибка: " + (e.body?.error ?? "не удалось сохранить"));
    }
  };

  return (
    <div className="bf-overlay" onClick={onCancel}>
      <div className="bf-shell" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="bf-title">
          {mode === "create" ? "Новый бренд" : `Редактировать «${brand?.name}»`}
        </div>

        <Field label="Код">
          <input
            className="ctl mono"
            value={code}
            disabled={mode === "edit"}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
            placeholder="VIVIENNE_SABO"
          />
          {codeError && <div className="fld-err">{codeError}</div>}
          {mode === "create" && <div className="fld-hint">Идентификатор. Латиница, верхний регистр, без пробелов. После создания не меняется.</div>}
        </Field>

        <Field label="Название">
          <input className="ctl" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vivienne Sabó" />
        </Field>

        <Field label="Короткий код">
          <input
            className="ctl"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="VS"
            style={{ width: 100, fontFamily: "var(--font-mono)" }}
          />
        </Field>

        <Field label="Цвет">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 36, height: 30, border: "1px solid var(--color-line-1)", borderRadius: 6, padding: 2 }} />
            <input
              className="ctl mono"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 110 }}
            />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {COLOR_PALETTE.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 22, height: 22, borderRadius: 4,
                    background: c, border: c.toLowerCase() === color.toLowerCase() ? "2px solid var(--color-ink-1)" : "1px solid var(--color-line-1)",
                    cursor: "pointer",
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </Field>

        <Field label="">
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={isHolding} onChange={(e) => setIsHolding(e.target.checked)} />
            Бренд НТС «Градиент» (учитывается в conflict-detect между брендами холдинга)
          </label>
        </Field>

        {mode === "edit" && (
          <Field label="">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} />
              В архиве (скрыт из селекторов размещения, исторические placements остаются)
            </label>
          </Field>
        )}

        <div className="bf-foot">
          <button className="btn btn-ghost" onClick={onCancel}>Отмена</button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!canSave || createMut.isPending || updateMut.isPending}
          >
            {createMut.isPending || updateMut.isPending ? "..." : (mode === "create" ? "Добавить" : "Сохранить")}
          </button>
        </div>
      </div>
      <style>{`
        .bf-overlay {
          position: fixed; inset: 0; z-index: 700;
          background: rgba(11,11,12,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: m-fade 140ms ease-out;
        }
        .bf-shell {
          width: 480px;
          background: var(--color-surface);
          border-radius: 12px;
          box-shadow: var(--sh-modal);
          padding: 22px 24px;
          animation: m-pop 160ms ease-out;
          display: flex; flex-direction: column; gap: 14px;
        }
        .bf-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
        .bf-foot {
          display: flex; justify-content: flex-end; gap: 8px;
          margin-top: 6px;
        }
        .ctl {
          width: 100%;
          padding: 8px 10px;
          background: var(--color-surface);
          border: 1px solid var(--color-line-1);
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          font-family: inherit;
        }
        .ctl.mono { font-family: var(--font-mono); }
        .ctl:focus { border-color: var(--color-ink-3); }
        .ctl:disabled { background: var(--color-bg); color: var(--color-ink-3); }
        .fld-err { font-size: 12px; color: var(--color-conflict); margin-top: 4px; }
        .fld-hint { font-size: 11px; color: var(--color-ink-3); margin-top: 4px; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "start", columnGap: 14 }}>
      <label style={{ fontSize: 13, color: "var(--color-ink-2)", fontWeight: 500, paddingTop: 6 }}>{label}</label>
      <div>{children}</div>
    </div>
  );
}

function pluralPlacements(n: number): string {
  const lt = n % 100;
  if (lt >= 11 && lt <= 14) return "размещений";
  const l = n % 10;
  if (l === 1) return "размещение";
  if (l >= 2 && l <= 4) return "размещения";
  return "размещений";
}
