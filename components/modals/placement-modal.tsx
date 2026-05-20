"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronDown, Plus, Trash2, X, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { placementInputSchema, type PlacementInput } from "@/lib/schemas";
import {
  CATEGORIES, CATEGORY_LABELS,
  TOOLS, TOOL_LABELS,
  PLATFORMS, PLATFORM_LABELS,
  PLACEMENT_STATUSES, STATUS_LABELS,
} from "@/lib/domain";
import type { Brand, Category, Tool, Platform, PlacementStatus } from "@/lib/domain";
import { useBrands } from "@/hooks/use-brands";
import { useCheckConflict, useCreatePlacement, useUpdatePlacement, useDeletePlacement } from "@/hooks/use-placements";
import { useCreateBlogger } from "@/hooks/use-bloggers";
import type { Placement, Blogger, ConflictResult } from "@/lib/types";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Props {
  mode: "create" | "edit";
  placement?: Placement;
  prefill?: Partial<Placement>;
  bloggers: Blogger[];
  onClose: () => void;
}

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function PlacementModal({ mode, placement, prefill, bloggers, onClose }: Props) {
  const { brands: activeBrands } = useBrands(); // active only — can't add new placements with archived brands
  const defaultValues = (mode === "edit" && placement
    ? {
        date: placement.date.slice(0, 10),
        brand: placement.brand as Brand,
        category: placement.category as Category,
        product: placement.product,
        bloggerId: placement.bloggerId,
        tool: placement.tool as Tool,
        platform: placement.platform as Platform,
        postUrl: placement.postUrl ?? "",
        status: placement.status as PlacementStatus,
      }
    : {
        date: (prefill?.date ?? "").slice(0, 10) || todayYmd(),
        product: "",
        postUrl: "",
        status: "PLANNED" as PlacementStatus,
        ...(prefill ?? {}),
      }) as Partial<PlacementInput>;

  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<PlacementInput>({
    // @ts-expect-error zod resolver typing mismatch with react-hook-form generic defaults
    resolver: zodResolver(placementInputSchema),
    defaultValues,
  });

  const watched = useWatch({ control });

  // Live conflict preview
  const checkMut = useCheckConflict();
  const [preview, setPreview] = useState<ConflictResult | null>(null);
  useEffect(() => {
    const { date, bloggerId, brand, category, tool } = watched;
    if (!date || !bloggerId || !brand || !category || !tool) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    checkMut.mutateAsync({
      date, bloggerId, brand, category, tool,
      excludeId: mode === "edit" ? placement?.id : undefined,
    }).then((r) => { if (!cancelled) setPreview(r); }).catch(() => setPreview(null));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched.date, watched.bloggerId, watched.brand, watched.category, watched.tool]);

  const createMut = useCreatePlacement();
  const updateMut = useUpdatePlacement();
  const deleteMut = useDeletePlacement();
  const createBloggerMut = useCreateBlogger();

  const [confirm, setConfirm] = useState<null | { type: "save" | "delete"; payload?: PlacementInput }>(null);

  const submit = handleSubmit(async (raw) => {
    const data = raw as unknown as PlacementInput;
    if (preview?.hasConflict) {
      setConfirm({ type: "save", payload: data });
      return;
    }
    await doSave(data, false);
  });

  const doSave = async (data: PlacementInput, force: boolean) => {
    try {
      if (mode === "edit" && placement) {
        await updateMut.mutateAsync({ id: placement.id, patch: { ...data, force } });
        toast.success("Размещение обновлено");
      } else {
        await createMut.mutateAsync({ ...data, force });
        toast.success("Размещение создано");
      }
      onClose();
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { error?: string } };
      toast.error("Ошибка: " + (e.body?.error ?? "не удалось сохранить"));
    }
  };

  const doDelete = async () => {
    if (!placement) return;
    try {
      await deleteMut.mutateAsync(placement.id);
      toast.success("Размещение удалено");
      onClose();
    } catch (err: unknown) {
      const e = err as { body?: { error?: string } };
      toast.error("Ошибка: " + (e.body?.error ?? ""));
    }
  };

  return (
    <ModalShell title={mode === "edit" ? "Редактировать размещение" : "Новое размещение"} onClose={onClose}>
      <form onSubmit={submit} className="pm-body">
        <Field label="Дата" required error={errors.date?.message}>
          <input type="date" {...register("date")} className="ctl" />
        </Field>

        <Field label="Блогер" required error={errors.bloggerId?.message}>
          <Controller
            name="bloggerId"
            control={control}
            render={({ field }) => (
              <BloggerCombobox
                value={field.value}
                onChange={(id, platform, autofillBrand) => {
                  field.onChange(id);
                  if (platform && !watched.platform) setValue("platform", platform);
                }}
                bloggers={bloggers}
                onCreateNew={async ({ name, platform, handle }) => {
                  const cleanHandle = handle.replace(/^@/, "").toLowerCase();
                  const handleField = {
                    TIKTOK: "handleTiktok",
                    INSTAGRAM: "handleInstagram",
                    TELEGRAM: "handleTelegram",
                    VK: "handleVk",
                    YOUTUBE: "handleYoutube",
                  }[platform];
                  const created = await createBloggerMut.mutateAsync({
                    canonicalName: name,
                    level: "MID",
                    [handleField]: cleanHandle || null,
                  });
                  field.onChange(created.blogger.id);
                  setValue("platform", platform);
                  toast.success(`Блогер «${name}» добавлен`);
                }}
              />
            )}
          />
        </Field>

        <Field label="Бренд" required error={errors.brand?.message}>
          <Controller
            name="brand"
            control={control}
            render={({ field }) => (
              <SelectChip
                value={field.value}
                onChange={field.onChange}
                options={activeBrands.map(b => ({ value: b.code, label: b.name, color: b.color }))}
                placeholder="— выбрать —"
              />
            )}
          />
        </Field>

        <Field label="Категория" required error={errors.category?.message}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <NativeSelect value={field.value ?? ""} onChange={field.onChange} options={CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] }))} placeholder="— выбрать —" />
            )}
          />
        </Field>

        <Field label="Продукт" required error={errors.product?.message}>
          <input {...register("product")} className="ctl" placeholder="Например: Муссовые помады MUSE" />
        </Field>

        <Field label="Инструмент" required error={errors.tool?.message}>
          <Controller
            name="tool"
            control={control}
            render={({ field }) => (
              <NativeSelect value={field.value ?? ""} onChange={field.onChange} options={TOOLS.map(t => ({ value: t, label: TOOL_LABELS[t] }))} placeholder="— выбрать —" />
            )}
          />
        </Field>

        <Field label="Платформа" required error={errors.platform?.message}>
          <Controller
            name="platform"
            control={control}
            render={({ field }) => (
              <NativeSelect value={field.value ?? ""} onChange={field.onChange} options={PLATFORMS.map(p => ({ value: p, label: PLATFORM_LABELS[p] }))} placeholder="— выбрать —" />
            )}
          />
        </Field>

        <Field label="Ссылка на пост" error={errors.postUrl?.message}>
          <input {...register("postUrl")} className="ctl" placeholder="https://…  (опц.)" />
        </Field>

        <Field label="Статус" required error={errors.status?.message}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <NativeSelect value={field.value ?? "PLANNED"} onChange={field.onChange} options={PLACEMENT_STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))} />
            )}
          />
        </Field>

        {/* Conflict preview */}
        <div className="pm-preview-wrap">
          <ConflictPreview result={preview} loading={checkMut.isPending} />
        </div>

        <div className="pm-foot">
          {mode === "edit" ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirm({ type: "delete" })}
              disabled={deleteMut.isPending}
            >
              <Trash2 size={14} /> Удалить
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </form>

      {confirm?.type === "save" && (
        <ConfirmDialog
          title="Конфликт обнаружен"
          body={
            <>
              Размещение нарушает правила интервалов:
              <ul style={{ margin: "8px 0 0", paddingLeft: 16 }}>
                {preview?.conflicts.map((c, i) => (
                  <li key={i} style={{ fontSize: 12 }}>{c.reason}</li>
                ))}
              </ul>
              Всё равно сохранить?
            </>
          }
          confirmLabel="Всё равно сохранить"
          tone="danger"
          onConfirm={async () => {
            if (confirm.payload) await doSave(confirm.payload, true);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === "delete" && (
        <ConfirmDialog
          title="Удалить размещение?"
          body="Размещение получит статус «Отменено». Данные сохранятся, но из активного планирования исчезнут."
          confirmLabel="Удалить"
          tone="danger"
          onConfirm={async () => { await doDelete(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <style>{`
        .pm-body {
          padding: 18px 24px 0;
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 14px;
        }
        .pm-foot {
          padding: 16px 24px;
          border-top: 1px solid var(--color-line-2);
          display: flex; justify-content: space-between; align-items: center;
          background: var(--color-surface);
          margin-top: 14px;
        }
        .pm-preview-wrap { padding-top: 4px; }
        .ctl {
          width: 100%;
          padding: 8px 10px;
          background: var(--color-surface);
          border: 1px solid var(--color-line-1);
          border-radius: 8px;
          font-size: 13px;
          outline: none;
        }
        .ctl:focus { border-color: var(--color-ink-3); }
      `}</style>
    </ModalShell>
  );
}

function Field({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", columnGap: 16, rowGap: 6 }}>
      <label style={{ fontSize: 13, color: "var(--color-ink-2)", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "var(--color-conflict)" }}> *</span>}
      </label>
      <div>{children}</div>
      {error && <div style={{ gridColumn: 2, color: "var(--color-conflict)", fontSize: 12 }}>{error}</div>}
    </div>
  );
}

function NativeSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="ctl">
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SelectChip({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string; color?: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="ctl" onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", textAlign: "left" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {current?.color && <span className="dot-mini" style={{ background: current.color }} />}
          <span style={{ color: current ? "var(--color-ink-1)" : "var(--color-ink-3)" }}>{current?.label ?? placeholder}</span>
        </span>
        <ChevronDown size={14} color="#6B6B73" />
      </button>
      {open && (
        <div className="sc-menu">
          {options.map((o) => (
            <button type="button" key={o.value} className={`sc-item ${o.value === value ? "is-on" : ""}`} onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.color && <span className="dot-mini" style={{ background: o.color }} />}
              <span style={{ flex: 1, textAlign: "left" }}>{o.label}</span>
              {o.value === value && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
      <style>{`
        .sc-menu {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 30;
          background: var(--color-surface);
          border: 1px solid var(--color-line-1);
          border-radius: 8px;
          box-shadow: var(--sh-modal);
          padding: 4px;
          max-height: 260px; overflow-y: auto;
        }
        .sc-item {
          width: 100%;
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 6px;
          background: transparent; border: none;
          font-size: 13px; color: var(--color-ink-1);
          text-align: left; cursor: pointer;
        }
        .sc-item:hover { background: var(--color-bg); }
        .sc-item.is-on { background: var(--color-bg); }
      `}</style>
    </div>
  );
}

function BloggerCombobox({ value, onChange, bloggers, onCreateNew }: {
  value: string;
  onChange: (id: string, platform?: Platform, autofillBrand?: Brand) => void;
  bloggers: Blogger[];
  onCreateNew: (input: { name: string; platform: Platform; handle: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [newForm, setNewForm] = useState<{ name: string; platform: Platform; handle: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const current = bloggers.find((b) => b.id === value);
  const list = q ? bloggers.filter((b) => b.canonicalName.toLowerCase().includes(q.toLowerCase())) : bloggers;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="ctl" onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <span style={{ color: current ? "var(--color-ink-1)" : "var(--color-ink-3)" }}>{current?.canonicalName ?? "— выбрать —"}</span>
        <ChevronDown size={14} color="#6B6B73" />
      </button>
      {open && (
        <div className="sc-menu" style={{ padding: 0 }}>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-line-2)", display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={14} color="#6B6B73" />
            <input
              autoFocus
              placeholder="Поиск..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ border: "none", outline: "none", flex: 1, background: "transparent", fontSize: 14 }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto", padding: 4 }}>
            {list.slice(0, 80).map((b) => (
              <button
                type="button"
                key={b.id}
                className={`sc-item ${b.id === value ? "is-on" : ""}`}
                onClick={() => { onChange(b.id); setOpen(false); setQ(""); }}
              >
                <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--color-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "var(--color-ink-2)" }}>
                  {b.canonicalName[0]}
                </span>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.canonicalName}</span>
                <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>{b.level}</span>
              </button>
            ))}
            {list.length === 0 && (
              <div style={{ padding: 12, fontSize: 12, color: "var(--color-ink-3)", textAlign: "center" }}>Не найдено</div>
            )}
          </div>
          <button
            type="button"
            className="sc-item"
            style={{ borderTop: "1px solid var(--color-line-2)", borderRadius: 0 }}
            onClick={() => setNewForm({ name: q, platform: "TIKTOK", handle: "" })}
          >
            <Plus size={14} />
            <span>Добавить нового{q ? `: «${q}»` : ""}</span>
          </button>
        </div>
      )}

      {newForm && (
        <NewBloggerInline
          initial={newForm}
          onCancel={() => setNewForm(null)}
          onSave={async (data) => {
            await onCreateNew(data);
            setNewForm(null);
            setOpen(false);
            setQ("");
          }}
        />
      )}
    </div>
  );
}

function NewBloggerInline({ initial, onCancel, onSave }: {
  initial: { name: string; platform: Platform; handle: string };
  onCancel: () => void;
  onSave: (input: { name: string; platform: Platform; handle: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name);
  const [platform, setPlatform] = useState<Platform>(initial.platform);
  const [handle, setHandle] = useState(initial.handle);
  const [busy, setBusy] = useState(false);

  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-shell" onClick={(e) => e.stopPropagation()} style={{ width: 380 }}>
        <div className="cd-title">Новый блогер</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Каноническое имя" className="ctl" autoFocus />
          <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="ctl">
            {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
          </select>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="ник (без @)" className="ctl" />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Отмена</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!name.trim() || busy}
            onClick={async () => {
              setBusy(true);
              try { await onSave({ name: name.trim(), platform, handle: handle.trim() }); }
              finally { setBusy(false); }
            }}
          >
            {busy ? "..." : "Добавить"}
          </button>
        </div>
      </div>
      <style>{`
        .cd-overlay { position: fixed; inset: 0; z-index: 800; background: rgba(11,11,12,0.45); display: flex; align-items: center; justify-content: center; padding: 24px; }
        .cd-shell { background: var(--color-surface); border-radius: 12px; box-shadow: var(--sh-modal); padding: 22px 24px; }
        .cd-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
      `}</style>
    </div>
  );
}

function ConflictPreview({ result, loading }: { result: ConflictResult | null; loading: boolean }) {
  if (loading) return <div className="pm-preview pm-preview-neutral">Проверяем конфликты…</div>;
  if (!result) return null;
  if (!result.hasConflict) {
    return (
      <div className="pm-preview pm-preview-ok">
        <Check size={14} /> Конфликтов не найдено
        <style>{previewCss}</style>
      </div>
    );
  }
  return (
    <div className="pm-preview pm-preview-bad">
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontWeight: 600 }}>
        <AlertTriangle size={14} color="var(--color-conflict)" /> Конфликт
      </div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {result.conflicts.map((c, i) => (
          <li key={i} style={{ fontSize: 12, color: "var(--color-ink-2)" }}>{c.reason}</li>
        ))}
      </ul>
      <style>{previewCss}</style>
    </div>
  );
}

const previewCss = `
  .pm-preview {
    padding: 10px 14px; border-radius: 8px; font-size: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .pm-preview-ok {
    background: var(--ok-bg); color: var(--color-ok); font-weight: 500;
  }
  .pm-preview-bad {
    background: var(--conflict-bg); color: var(--color-ink-1); display: block;
    border: 1px solid rgba(220,38,38,0.25);
  }
  .pm-preview-neutral {
    background: var(--color-bg); color: var(--color-ink-3);
  }
`;

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="m-overlay" onClick={onClose}>
      <div className="m-shell" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="m-head">
          <div className="m-title">{title}</div>
          <button className="iconbtn" onClick={onClose} aria-label="Закрыть"><X size={16} /></button>
        </div>
        {children}
      </div>
      <style>{`
        .m-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(11,11,12,0.40);
          display: flex; align-items: center; justify-content: center;
          padding: 32px;
          animation: m-fade 140ms ease-out;
        }
        .m-shell {
          width: 560px;
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
      `}</style>
    </div>
  );
}
