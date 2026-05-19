/* global React, window */
// ============================================================================
// View B — Schedule (resource timeline with drag-n-drop, "пасьянс")
// ============================================================================
const { useMemo: useMemoS, useState: useStateS, useRef: useRefS, useEffect: useEffectS, useCallback: useCallbackS } = React;

function ScheduleView({
  year, month,
  placements, bloggers,
  conflictMap,
  onOpenPlacement,
  onOpenBlogger,
  onMovePlacement, // (id, {date?, bloggerId?}) → confirmRequired? returns Promise
  todayIso,
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = useMemoS(() => {
    const arr = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const iso = `${year}-${String(month).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const dow = (new Date(iso + 'T00:00:00').getDay() + 6) % 7;
      arr.push({ day: i, iso, dow, isWeekend: dow >= 5 });
    }
    return arr;
  }, [year, month, daysInMonth]);

  // Sort bloggers: most placements this month first, then alpha
  const sortedBloggers = useMemoS(() => {
    const counts = {};
    placements.forEach(p => { counts[p.bloggerId] = (counts[p.bloggerId] || 0) + 1; });
    return [...bloggers].sort((a,b) => (counts[b.id] || 0) - (counts[a.id] || 0) || a.name.localeCompare(b.name, 'ru'));
  }, [bloggers, placements]);

  const [showAll, setShowAll] = useStateS(false);
  const visibleBloggers = showAll ? sortedBloggers : sortedBloggers.slice(0, 12);
  const hiddenCount = sortedBloggers.length - visibleBloggers.length;

  // Build cell index: bloggerId -> iso -> [placements]
  const cellIndex = useMemoS(() => {
    const idx = {};
    placements.forEach(p => {
      if (!idx[p.bloggerId]) idx[p.bloggerId] = {};
      if (!idx[p.bloggerId][p.date]) idx[p.bloggerId][p.date] = [];
      idx[p.bloggerId][p.date].push(p);
    });
    return idx;
  }, [placements]);

  // Drag state (using pointer events for full control)
  const [drag, setDrag] = useStateS(null);
  // drag = { placement, originX, originY, pointerX, pointerY, hover: {bloggerId, iso} | null, hoverConflict: {has:bool, reasons:[]} }
  const cellRefs = useRefS(new Map()); // key=`${bloggerId}|${iso}` → el
  const setCellRef = (k, el) => {
    if (el) cellRefs.current.set(k, el); else cellRefs.current.delete(k);
  };

  // Recently dropped (for pulse animation)
  const [recentlyDropped, setRecentlyDropped] = useStateS(null);

  useEffectS(() => {
    if (!drag) return;
    const onMove = (e) => {
      const px = e.clientX, py = e.clientY;
      // Find cell under pointer
      let hoverKey = null;
      for (const [k, el] of cellRefs.current.entries()) {
        const r = el.getBoundingClientRect();
        if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
          hoverKey = k; break;
        }
      }
      let hover = null, hoverConflict = { has: false, reasons: [] };
      if (hoverKey) {
        const [bloggerId, iso] = hoverKey.split('|');
        hover = { bloggerId, iso };
        // Simulate move and check conflict
        const simulated = { ...drag.placement, bloggerId, date: iso };
        const others = placements.filter(p => p.id !== drag.placement.id);
        hoverConflict = detectConflicts(simulated, others);
      }
      setDrag(prev => prev ? { ...prev, pointerX: px, pointerY: py, hover, hoverConflict } : prev);
    };
    const onUp = async (e) => {
      const cur = drag;
      setDrag(null);
      if (!cur || !cur.hover) return;
      const { bloggerId, iso } = cur.hover;
      if (bloggerId === cur.placement.bloggerId && iso === cur.placement.date) return; // no-op
      const ok = await onMovePlacement(cur.placement.id, { bloggerId, date: iso }, cur.hoverConflict);
      if (ok) {
        setRecentlyDropped(cur.placement.id);
        setTimeout(() => setRecentlyDropped(null), 600);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, placements, onMovePlacement]);

  const startDrag = (e, placement) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDrag({
      placement,
      originX: e.clientX, originY: e.clientY,
      pointerX: e.clientX, pointerY: e.clientY,
      hover: null,
      hoverConflict: { has: false, reasons: [] },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  const COL_W = 44; // px
  const ROW_H = 56;
  const NAME_W = 200;

  return (
    <div className="sch-wrap" style={{ userSelect: drag ? 'none' : 'auto' }}>
      <div className="sch-scroll">
        <div className="sch-inner" style={{ minWidth: NAME_W + COL_W * days.length + 12 }}>

          {/* Header row — days */}
          <div className="sch-head-row" style={{ gridTemplateColumns: `${NAME_W}px repeat(${days.length}, ${COL_W}px)` }}>
            <div className="sch-head-corner">
              Блогер · {sortedBloggers.length} всего
            </div>
            {days.map(d => (
              <div key={d.iso} className={`sch-head-cell ${d.isWeekend ? 'is-weekend' : ''} ${d.iso === todayIso ? 'is-today' : ''}`}>
                <div className="sch-head-day">{d.day}</div>
                <div className="sch-head-dow">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][d.dow]}</div>
              </div>
            ))}
          </div>

          {/* Body rows */}
          {visibleBloggers.map((blogger, rowIdx) => {
            const isStripe = rowIdx % 2 === 1;
            return (
              <div
                key={blogger.id}
                className={`sch-row ${isStripe ? 'is-stripe' : ''}`}
                style={{ gridTemplateColumns: `${NAME_W}px repeat(${days.length}, ${COL_W}px)`, minHeight: ROW_H }}
              >
                <button className="sch-name" onClick={() => onOpenBlogger(blogger)}>
                  <span className="truncate" style={{ maxWidth: NAME_W - 60 }}>{blogger.name}</span>
                  <span className="sch-name-lvl">{blogger.level[0]}</span>
                </button>
                {days.map(d => {
                  const key = `${blogger.id}|${d.iso}`;
                  const cellPs = cellIndex[blogger.id]?.[d.iso] || [];
                  const hovered = drag && drag.hover && drag.hover.bloggerId === blogger.id && drag.hover.iso === d.iso;
                  const conflictHere = hovered && drag.hoverConflict.has;
                  const isToday = d.iso === todayIso;
                  return (
                    <div
                      key={d.iso}
                      ref={(el) => setCellRef(key, el)}
                      className={[
                        'sch-cell',
                        d.isWeekend ? 'is-weekend' : '',
                        isToday ? 'is-today-col' : '',
                        hovered ? (conflictHere ? 'drop-invalid' : 'drop-valid') : '',
                      ].join(' ')}
                    >
                      {cellPs.map((p, i) => {
                        const brand = BRAND_BY_ID[p.brandId];
                        const conf = conflictMap[p.id]?.hasConflict;
                        const isDragging = drag && drag.placement.id === p.id;
                        if (isDragging) return <div key={p.id} className="sch-card sch-card-ghost" />;
                        const pulse = recentlyDropped === p.id;
                        return (
                          <div
                            key={p.id}
                            className={`sch-card ${conf ? 'has-conflict' : ''}`}
                            style={{
                              background: brand.color,
                              animation: pulse ? 'dropPulse 600ms ease-out, snapIn 200ms ease-out' : 'snapIn 200ms ease-out',
                            }}
                            onPointerDown={(e) => startDrag(e, p)}
                            onClick={(e) => {
                              if (Math.abs(e.clientX - (drag?.originX ?? e.clientX)) < 4) {
                                onOpenPlacement(p);
                              }
                            }}
                            title={`${brand.name} · ${p.category} · ${p.tool}`}
                          >
                            <span className="sch-card-tool">{TOOL_SHORT[p.tool]}</span>
                            <span className="sch-card-text truncate">{brand.short}</span>
                            {conf && <span className="sch-card-bang"><IconAlert size={10} color="#fff" strokeWidth={2.6} /></span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {hiddenCount > 0 && !showAll && (
            <button className="sch-show-more" onClick={() => setShowAll(true)}>
              <IconChevDown size={14} /> Показать ещё блогеров: {hiddenCount}
            </button>
          )}
          {showAll && sortedBloggers.length > 12 && (
            <button className="sch-show-more" onClick={() => setShowAll(false)}>
              Свернуть до 12
            </button>
          )}
        </div>
      </div>

      {/* Floating drag card */}
      {drag && (() => {
        const p = drag.placement;
        const brand = BRAND_BY_ID[p.brandId];
        return (
          <>
            <div
              className="sch-card sch-card-floating"
              style={{
                left: drag.pointerX, top: drag.pointerY,
                background: brand.color,
              }}
            >
              <span className="sch-card-tool">{TOOL_SHORT[p.tool]}</span>
              <span className="sch-card-text">{brand.short}</span>
            </div>
            {drag.hover && drag.hoverConflict.has && (
              <div
                className="sch-drag-tooltip"
                style={{ left: drag.pointerX + 16, top: drag.pointerY + 16 }}
              >
                <IconAlert size={12} color="#fff" strokeWidth={2.4} />
                <span>
                  Конфликт: {(() => {
                    const r = drag.hoverConflict.reasons[0];
                    if (!r) return 'правило нарушено';
                    if (r.kind === 'same-day') return `тот же день, ${BRAND_BY_ID[r.against.brandId].short}`;
                    if (r.kind === 'brand')    return `${r.gap} дн. до ${BRAND_BY_ID[r.against.brandId].short}, нужно ≥${r.required}`;
                    if (r.kind === 'category') return `${r.gap} дн. до «${r.against.category}», нужно ≥${r.required}`;
                    return 'правило нарушено';
                  })()}
                </span>
              </div>
            )}
          </>
        );
      })()}

      <style>{`
        .sch-wrap { position: relative; }
        .sch-scroll {
          border: 1px solid var(--line-1);
          border-radius: 12px;
          background: var(--surface);
          overflow: auto;
          max-height: calc(100vh - 240px);
        }
        .sch-inner { display: flex; flex-direction: column; }
        .sch-head-row {
          display: grid;
          position: sticky; top: 0; z-index: 4;
          background: var(--surface);
          border-bottom: 1px solid var(--line-1);
        }
        .sch-head-corner {
          padding: 12px 16px;
          font-size: 12px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.04em;
          border-right: 1px solid var(--line-1);
          position: sticky; left: 0; z-index: 5; background: var(--surface);
        }
        .sch-head-cell {
          padding: 8px 0 10px;
          text-align: center;
          border-right: 1px solid var(--line-2);
          display: flex; flex-direction: column; align-items: center;
          gap: 2px;
        }
        .sch-head-cell.is-weekend { background: #FAFAF7; }
        .sch-head-cell.is-today { background: rgba(11,11,12,0.04); }
        .sch-head-day {
          font-size: 14px; font-weight: 700; color: var(--ink-1);
        }
        .sch-head-cell.is-today .sch-head-day {
          background: var(--ink-1); color: #fff;
          width: 22px; height: 22px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          line-height: 1;
        }
        .sch-head-dow {
          font-size: 10px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.04em;
        }

        .sch-row {
          display: grid;
          border-bottom: 1px solid var(--line-2);
        }
        .sch-row.is-stripe { background: #FCFCF9; }
        .sch-name {
          padding: 0 12px 0 16px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; font-weight: 500; color: var(--ink-1);
          background: inherit; border: none; text-align: left;
          border-right: 1px solid var(--line-1);
          position: sticky; left: 0; z-index: 2;
          background: var(--surface);
        }
        .sch-row.is-stripe .sch-name { background: #FCFCF9; }
        .sch-name:hover { background: #F1F1EE; }
        .sch-name-lvl {
          font-family: var(--font-mono);
          width: 20px; height: 20px; border-radius: 4px;
          background: var(--line-2); color: var(--ink-2);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600;
          flex-shrink: 0;
        }
        .sch-cell {
          border-right: 1px solid var(--line-2);
          padding: 8px 4px;
          display: flex; align-items: center; justify-content: center; gap: 3px;
          flex-wrap: wrap;
          transition: background 90ms ease, outline 90ms ease;
          outline: 0px solid transparent;
          outline-offset: -2px;
          position: relative;
        }
        .sch-cell.is-weekend { background: rgba(0,0,0,0.018); }
        .sch-cell.is-today-col { background: rgba(11,11,12,0.025); }
        .sch-cell.drop-valid {
          background: rgba(34, 197, 94, 0.15) !important;
          outline: 1.5px dashed #16A34A !important;
        }
        .sch-cell.drop-invalid {
          background: rgba(239, 68, 68, 0.18) !important;
          outline: 1.5px dashed #DC2626 !important;
        }

        .sch-card {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 7px;
          border-radius: 6px;
          color: #fff;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.01em;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          cursor: grab;
          user-select: none;
          transition: transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
          touch-action: none;
          max-width: 100%;
        }
        .sch-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.12);
        }
        .sch-card.has-conflict {
          box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px var(--conflict), 0 1px 2px rgba(0,0,0,0.08);
        }
        .sch-card.has-conflict:hover {
          box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px var(--conflict), 0 4px 8px rgba(0,0,0,0.16);
        }
        .sch-card-ghost {
          opacity: 0; pointer-events: none;
        }
        .sch-card-floating {
          position: fixed; z-index: 200;
          transform: translate(-50%, -50%) rotate(2.4deg) scale(1.06);
          opacity: 0.97;
          box-shadow: 0 12px 24px rgba(0,0,0,0.22);
          cursor: grabbing;
          pointer-events: none;
        }
        .sch-card-tool {
          width: 14px; height: 14px; border-radius: 999px;
          background: rgba(255,255,255,0.28);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
          flex-shrink: 0;
        }
        .sch-card-text { display: inline-block; max-width: 36px; }
        .sch-card-bang {
          margin-left: 2px;
          width: 14px; height: 14px; border-radius: 999px;
          background: var(--conflict);
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .sch-show-more {
          margin: 12px;
          padding: 10px 14px;
          background: var(--bg); border: 1px dashed var(--line-1);
          border-radius: 8px;
          font-size: 13px; font-weight: 500; color: var(--ink-2);
          display: inline-flex; align-items: center; gap: 6px;
          align-self: flex-start;
        }
        .sch-show-more:hover { background: #EEEEEA; }

        .sch-drag-tooltip {
          position: fixed; z-index: 250;
          background: var(--conflict); color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px; font-weight: 500;
          display: inline-flex; align-items: center; gap: 6px;
          pointer-events: none;
          box-shadow: 0 6px 12px rgba(0,0,0,0.18);
          max-width: 280px;
        }
      `}</style>
    </div>
  );
}

window.ScheduleView = ScheduleView;
