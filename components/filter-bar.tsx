"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { BRANDS, BRAND_COLORS, BRAND_LABELS, BRAND_SHORT } from "@/lib/domain";
import type { Blogger } from "@/lib/types";

interface Props {
  brandFilter: Set<string>;
  onBrandFilterChange: (s: Set<string>) => void;
  bloggerFilter: string;
  onBloggerFilterChange: (id: string) => void;
  bloggers: Blogger[];
  onlyConflicts: boolean;
  onOnlyConflictsChange: (v: boolean) => void;
  totalConflicts: number;
  right?: React.ReactNode;
}

export function FilterBar({
  brandFilter, onBrandFilterChange, bloggerFilter, onBloggerFilterChange,
  bloggers, onlyConflicts, onOnlyConflictsChange, totalConflicts, right,
}: Props) {
  const reset = () => {
    onBrandFilterChange(new Set());
    onBloggerFilterChange("");
    onOnlyConflictsChange(false);
  };
  const dirty = brandFilter.size > 0 || bloggerFilter || onlyConflicts;
  return (
    <div className="filterbar">
      <BrandMultiSelect value={brandFilter} onChange={onBrandFilterChange} />
      <BloggerFilter value={bloggerFilter} onChange={onBloggerFilterChange} bloggers={bloggers} />
      <button
        className={`chip-toggle ${onlyConflicts ? "is-active" : ""}`}
        onClick={() => onOnlyConflictsChange(!onlyConflicts)}
      >
        <span className={`chip-mark ${onlyConflicts ? "is-on" : ""}`}>
          {onlyConflicts && <Check size={11} color="#fff" strokeWidth={2.6} />}
        </span>
        Только конфликты
        <span className="chip-counter">{totalConflicts}</span>
      </button>
      {dirty && <button className="filter-reset" onClick={reset}>Сбросить</button>}
      <div style={{ flex: 1 }} />
      {right}
      <style>{`
        .filterbar {
          display: flex; align-items: center; gap: 10px;
          padding: 16px 0 14px;
          flex-wrap: wrap;
        }
        .chip-toggle {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 11px;
          background: var(--color-surface);
          border: 1px solid var(--color-line-1);
          border-radius: 999px;
          font-size: 13px; color: var(--color-ink-1);
          cursor: pointer;
          transition: border-color 120ms ease, background 120ms ease;
        }
        .chip-toggle:hover { border-color: #C8C8C2; }
        .chip-toggle.is-active { background: #F1F1EE; border-color: #C5C5BE; }
        .chip-mark {
          width: 16px; height: 16px; border-radius: 4px;
          border: 1px solid var(--color-line-1);
          background: var(--color-surface);
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .chip-mark.is-on { background: var(--color-ink-1); border-color: var(--color-ink-1); }
        .chip-counter {
          background: var(--conflict-bg); color: var(--color-conflict);
          font-size: 11px; font-weight: 600;
          padding: 1px 7px; border-radius: 999px;
          margin-left: 2px;
        }
        .filter-reset {
          background: transparent; border: none;
          color: var(--color-ink-3); font-size: 12px;
          text-decoration: underline;
          text-decoration-color: var(--color-line-1);
          cursor: pointer;
        }
        .filter-reset:hover { color: var(--color-ink-1); text-decoration-color: var(--color-ink-3); }
      `}</style>
    </div>
  );
}

function BrandMultiSelect({ value, onChange }: { value: Set<string>; onChange: (s: Set<string>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const toggle = (id: string) => {
    const next = new Set(value);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  };
  const summary = value.size === 0 ? "Все бренды" : `${value.size} из 8`;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className={`chip-toggle ${value.size > 0 ? "is-active" : ""}`} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 12, color: "var(--color-ink-3)", fontWeight: 500 }}>Бренд:</span>
        <span style={{ fontWeight: 600 }}>{summary}</span>
        {value.size > 0 && (
          <span style={{ display: "inline-flex", gap: 2 }}>
            {[...value].slice(0, 4).map((id) => (
              <span key={id} className="dot-mini" style={{ background: BRAND_COLORS[id as keyof typeof BRAND_COLORS] }} />
            ))}
          </span>
        )}
        <ChevronDown size={13} color="#6B6B73" />
      </button>
      {open && (
        <div className="bms-menu">
          {BRANDS.map((b) => {
            const on = value.has(b);
            return (
              <button key={b} className={`bms-item ${on ? "is-on" : ""}`} onClick={() => toggle(b)}>
                <span className={`chip-mark ${on ? "is-on" : ""}`}>
                  {on && <Check size={11} color="#fff" strokeWidth={2.6} />}
                </span>
                <span className="dot-mini" style={{ background: BRAND_COLORS[b] }} />
                <span style={{ flex: 1, textAlign: "left" }}>{BRAND_LABELS[b]}</span>
                <span className="bms-short">{BRAND_SHORT[b]}</span>
              </button>
            );
          })}
          {value.size > 0 && (
            <button className="bms-clear" onClick={() => onChange(new Set())}>Очистить</button>
          )}
        </div>
      )}
      <style>{`
        .bms-menu {
          position: absolute; top: calc(100% + 6px); left: 0; z-index: 30;
          width: 280px; background: var(--color-surface);
          border: 1px solid var(--color-line-1); border-radius: 10px;
          box-shadow: var(--sh-modal); padding: 4px;
        }
        .bms-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 6px;
          border: none; background: transparent; font-size: 13px; color: var(--color-ink-1);
          text-align: left;
        }
        .bms-item:hover { background: var(--color-bg); }
        .bms-item.is-on { background: var(--color-bg); }
        .bms-short { font-family: var(--font-mono); font-size: 11px; color: var(--color-ink-3); }
        .bms-clear {
          width: 100%; margin-top: 4px;
          padding: 8px 10px; border-radius: 6px;
          background: transparent; border: 1px dashed var(--color-line-1);
          font-size: 12px; color: var(--color-ink-3);
        }
      `}</style>
    </div>
  );
}

function BloggerFilter({ value, onChange, bloggers }: { value: string; onChange: (id: string) => void; bloggers: Blogger[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const selected = bloggers.find((b) => b.id === value);
  const list = q ? bloggers.filter((b) => b.canonicalName.toLowerCase().includes(q.toLowerCase())) : bloggers;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className={`chip-toggle ${value ? "is-active" : ""}`} onClick={() => setOpen((o) => !o)}>
        <span style={{ fontSize: 12, color: "var(--color-ink-3)", fontWeight: 500 }}>Блогер:</span>
        <span style={{ fontWeight: 600 }}>{selected ? selected.canonicalName : "Все"}</span>
        {selected && (
          <span
            className="iconbtn-mini"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            aria-label="Очистить"
          >
            <X size={11} />
          </span>
        )}
        <ChevronDown size={13} color="#6B6B73" />
      </button>
      {open && (
        <div className="bms-menu" style={{ width: 300, padding: 0 }}>
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--color-line-2)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Search size={14} color="#6B6B73" />
            <input
              autoFocus
              placeholder="Поиск..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ border: "none", outline: "none", flex: 1, background: "transparent", fontSize: 14 }}
            />
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto", padding: 4 }}>
            <button className={`bms-item ${!value ? "is-on" : ""}`} onClick={() => { onChange(""); setOpen(false); }}>
              <span className="bcombo-avatar" style={{ background: "var(--color-line-1)", color: "var(--color-ink-2)" }}>×</span>
              <span style={{ flex: 1, textAlign: "left" }}>Все блогеры</span>
            </button>
            {list.slice(0, 80).map((b) => (
              <button
                key={b.id}
                className={`bms-item ${b.id === value ? "is-on" : ""}`}
                onClick={() => { onChange(b.id); setOpen(false); setQ(""); }}
              >
                <span className="bcombo-avatar">{b.canonicalName[0]}</span>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.canonicalName}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>{b.level}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <style>{`
        .iconbtn-mini {
          width: 16px; height: 16px; border-radius: 4px;
          background: rgba(0,0,0,0.08);
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--color-ink-2);
        }
        .iconbtn-mini:hover { background: rgba(0,0,0,0.16); }
        .bcombo-avatar {
          width: 24px; height: 24px; border-radius: 999px;
          background: var(--color-bg);
          font-size: 11px; font-weight: 600;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--color-ink-2);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
