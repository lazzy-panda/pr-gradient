"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Layers, LayoutGrid, Plus, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { usePlacements } from "@/hooks/use-placements";
import { useBloggers } from "@/hooks/use-bloggers";
import { useBrands } from "@/hooks/use-brands";
import { buildConflictMap } from "@/lib/client-conflict-map";
import { fmtRuMonthYear } from "@/lib/date";
import { CalendarView } from "@/components/views/calendar-view";
import { ScheduleView } from "@/components/views/schedule-view";
import { OverviewView } from "@/components/views/overview-view";
import { OVERVIEW_YEAR } from "@/lib/overview-data";
import { FilterBar } from "@/components/filter-bar";
import { PlacementModal } from "@/components/modals/placement-modal";
import { BloggerModal } from "@/components/modals/blogger-modal";
import { BrandsModal } from "@/components/modals/brands-modal";
import { BrandLegend } from "@/components/brand-legend";
import type { Placement } from "@/lib/types";

export default function HomePage() {
  const [view, setView] = useViewMode();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const effectiveView = isMobile ? "calendar" : view;

  const [brandFilter, setBrandFilter] = useState<Set<string>>(new Set());
  const [bloggerFilter, setBloggerFilter] = useState<string>("");
  const [onlyConflicts, setOnlyConflicts] = useState(false);

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const { data: placements = [], isLoading } = usePlacements({ from: monthStart, to: monthEnd });
  // Overview needs full-year data to populate "real placements" lists in popovers.
  const { data: yearPlacements = [] } = usePlacements(
    effectiveView === "overview"
      ? { from: `${OVERVIEW_YEAR}-01-01`, to: `${OVERVIEW_YEAR}-12-31` }
      : {},
  );
  const { data: bloggers = [] } = useBloggers();
  const { brands } = useBrands();
  const conflictMap = useMemo(() => buildConflictMap(placements), [placements]);
  const yearConflictMap = useMemo(
    () => effectiveView === "overview" ? buildConflictMap(yearPlacements) : {},
    [yearPlacements, effectiveView],
  );

  const totalConflicts = useMemo(
    () => placements.filter((p) => conflictMap[p.id]?.hasConflict).length,
    [placements, conflictMap],
  );

  const visiblePlacements = useMemo(() => {
    return placements.filter((p) => {
      if (brandFilter.size > 0 && !brandFilter.has(p.brand)) return false;
      if (bloggerFilter && p.bloggerId !== bloggerFilter) return false;
      if (onlyConflicts && !conflictMap[p.id]?.hasConflict) return false;
      return true;
    });
  }, [placements, brandFilter, bloggerFilter, onlyConflicts, conflictMap]);

  const [modal, setModal] = useState<
    | { kind: "placement-create"; prefill?: Partial<Placement> }
    | { kind: "placement-edit"; placement: Placement }
    | { kind: "blogger"; bloggerId: string }
    | { kind: "brands" }
    | null
  >(null);

  const goPrev = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 64 }}>
      <header
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-line-1)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: "conic-gradient(from 0deg, #B91C5C, #EA580C, #059669, #0891B2, #1D4ED8, #7C3AED, #EC4899, #B91C5C)",
                  boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.55)",
                }}
              />
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>PR Gradient</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-3)", paddingLeft: 12, borderLeft: "1px solid var(--color-line-1)" }}>
              {brands.length} брендов · {bloggers.length} блогеров · {placements.length} в этом месяце
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="seg seg-desktop" role="tablist" aria-label="Режим просмотра">
              <button
                className={`seg-btn ${effectiveView === "overview" ? "is-active" : ""}`}
                onClick={() => setView("overview")}
              >
                <LayoutGrid size={15} /> Общий
              </button>
              <button
                className={`seg-btn ${effectiveView === "calendar" ? "is-active" : ""}`}
                onClick={() => setView("calendar")}
              >
                <Calendar size={15} /> Календарь
              </button>
              <button
                className={`seg-btn ${effectiveView === "schedule" ? "is-active" : ""}`}
                onClick={() => setView("schedule")}
              >
                <Layers size={15} /> Расписание
              </button>
            </div>
            <button
              className="iconbtn"
              onClick={() => setModal({ kind: "brands" })}
              aria-label="Управление брендами"
              title="Бренды"
            >
              <Settings size={16} />
            </button>
            <button className="btn btn-primary" onClick={() => setModal({ kind: "placement-create" })}>
              <Plus size={15} strokeWidth={2.2} /> Размещение
            </button>
          </div>
        </div>
      </header>

      {effectiveView !== "overview" && (
        <div className="app-container">
          <FilterBar
            brandFilter={brandFilter}
            onBrandFilterChange={setBrandFilter}
            bloggerFilter={bloggerFilter}
            onBloggerFilterChange={setBloggerFilter}
            bloggers={bloggers}
            onlyConflicts={onlyConflicts}
            onOnlyConflictsChange={setOnlyConflicts}
            totalConflicts={totalConflicts}
            right={
              <div className="monthnav">
                <button className="iconbtn" onClick={goPrev} aria-label="Предыдущий месяц">
                  <ChevronLeft size={16} />
                </button>
                <span className="monthnav-label">{fmtRuMonthYear(year, month)}</span>
                <button className="iconbtn" onClick={goNext} aria-label="Следующий месяц">
                  <ChevronRight size={16} />
                </button>
              </div>
            }
          />
        </div>
      )}

      <main className="app-container" style={{ paddingBottom: 24, paddingTop: effectiveView === "overview" ? 16 : 0 }}>
        {effectiveView === "overview" ? (
          <>
            <OverviewView
              placements={yearPlacements}
              bloggers={bloggers}
              conflictMap={yearConflictMap}
              onOpenPlacement={(p) => setModal({ kind: "placement-edit", placement: p })}
              onJumpToSchedule={({ year: y, month: m }) => { setYear(y); setMonth(m); setView("schedule"); }}
              onAddPlacementWith={({ brand, date, product }) =>
                setModal({ kind: "placement-create", prefill: { brand, date, product } as Partial<Placement> })
              }
            />
            <BrandLegend />
          </>
        ) : isLoading ? (
          <div className="skeleton" style={{ height: 480 }} />
        ) : visiblePlacements.length === 0 ? (
          <EmptyState onAdd={() => setModal({ kind: "placement-create" })} />
        ) : (
          <>
            {effectiveView === "calendar" ? (
              <CalendarView
                year={year}
                month={month}
                placements={visiblePlacements}
                bloggers={bloggers}
                conflictMap={conflictMap}
                onOpenPlacement={(p) => setModal({ kind: "placement-edit", placement: p })}
                onCreateOnDay={(ymd) => setModal({ kind: "placement-create", prefill: { date: ymd } as Partial<Placement> })}
              />
            ) : (
              <ScheduleView
                year={year}
                month={month}
                placements={visiblePlacements}
                bloggers={bloggers}
                conflictMap={conflictMap}
                onOpenPlacement={(p) => setModal({ kind: "placement-edit", placement: p })}
                onOpenBlogger={(id) => setModal({ kind: "blogger", bloggerId: id })}
              />
            )}
            <BrandLegend />
          </>
        )}
      </main>

      {modal?.kind === "placement-create" && (
        <PlacementModal
          mode="create"
          prefill={modal.prefill}
          bloggers={bloggers}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "placement-edit" && (
        <PlacementModal
          mode="edit"
          placement={modal.placement}
          bloggers={bloggers}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "blogger" && (
        <BloggerModal
          bloggerId={modal.bloggerId}
          onClose={() => setModal(null)}
          onOpenPlacement={(p) => setModal({ kind: "placement-edit", placement: p })}
        />
      )}
      {modal?.kind === "brands" && (
        <BrandsModal onClose={() => setModal(null)} />
      )}

      <ComponentStyles />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.8 }}>📋</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Нет размещений в этом месяце</div>
      <div style={{ color: "var(--color-ink-3)", marginBottom: 20 }}>
        Запланируйте первое размещение, чтобы начать управлять загрузкой блогеров.
      </div>
      <button className="btn btn-primary" onClick={onAdd}>
        <Plus size={15} strokeWidth={2.2} /> Добавить первое
      </button>
    </div>
  );
}

function ComponentStyles() {
  return (
    <style>{`
      .seg {
        display: inline-flex;
        background: var(--color-bg);
        border: 1px solid var(--color-line-1);
        border-radius: 10px;
        padding: 3px;
        gap: 2px;
      }
      .seg-btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 12px;
        font-size: 13px; font-weight: 500;
        color: var(--color-ink-3);
        background: transparent; border: none; border-radius: 7px;
        cursor: pointer;
        transition: background 120ms ease, color 120ms ease;
      }
      .seg-btn:hover { color: var(--color-ink-1); }
      .seg-btn.is-active {
        background: var(--color-surface); color: var(--color-ink-1);
        box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--color-line-1);
        font-weight: 600;
      }
      .monthnav {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 4px 6px;
        background: var(--color-surface);
        border: 1px solid var(--color-line-1);
        border-radius: 999px;
      }
      .monthnav-label {
        font-size: 13px; font-weight: 600;
        padding: 0 10px; min-width: 132px; text-align: center;
        color: var(--color-ink-1);
      }
      @media (max-width: 767px) {
        .seg-desktop { display: none; }
      }
    `}</style>
  );
}
