/* global React, window */
// ============================================================================
// View A — Calendar (monthly grid with colored dots)
// ============================================================================
const { useMemo, useState, useRef, useEffect } = React;

function buildMonthGrid(year, month /* 1-12 */) {
  // Returns 6×7 grid of {date|null, iso, day, inMonth}
  const first = new Date(year, month - 1, 1);
  const startDow = (first.getDay() + 6) % 7; // monday=0
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  // Leading blanks
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    cells.push({ day, iso });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const DOW_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function CalendarView({ year, month, placements, bloggers, onOpenPlacement, conflictMap, todayIso }) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const placementsByDay = useMemo(() => {
    const map = {};
    placements.forEach(p => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    });
    return map;
  }, [placements]);

  // popover state — for click on empty cell space
  const [popover, setPopover] = useState(null); // {iso, anchor:{x,y}}

  // tooltip state — for hover on a dot
  const [tip, setTip] = useState(null); // {placement, x, y}

  return (
    <div className="cal-wrap" onClick={() => setPopover(null)}>
      {/* DOW row */}
      <div className="cal-dow">
        {DOW_RU.map((d, i) => (
          <div key={d} className="cal-dow-cell" style={{ color: i >= 5 ? '#9A9AA3' : '#6B6B73' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="cal-grid">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={'b'+idx} className="cal-cell cal-cell-empty" />;
          }
          const dayPs = placementsByDay[cell.iso] || [];
          const hasConflict = dayPs.some(p => conflictMap[p.id]?.hasConflict);
          const isToday = cell.iso === todayIso;
          const dow = (new Date(cell.iso + 'T00:00:00').getDay() + 6) % 7;
          const isWeekend = dow >= 5;

          // Render up to 4 dots; rest = +N
          const visible = dayPs.slice(0, 4);
          const extra = dayPs.length - visible.length;

          return (
            <div
              key={cell.iso}
              className={`cal-cell ${hasConflict ? 'has-conflict' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (dayPs.length > 0) {
                  setPopover({ iso: cell.iso, x: e.clientX, y: e.clientY });
                } else {
                  // empty day → quick create flow
                  onOpenPlacement(null, { date: cell.iso });
                }
              }}
            >
              <div className="cal-cell-head">
                <div className={`cal-daynum ${isToday ? 'is-today' : ''}`} style={{ color: isWeekend ? '#9A9AA3' : undefined }}>
                  {cell.day}
                </div>
                {hasConflict && (
                  <div className="cal-conflict-mark" title="Конфликт в этот день">
                    <IconAlert size={13} color="#fff" strokeWidth={2.2} />
                  </div>
                )}
              </div>

              <div className="cal-dots">
                {visible.map(p => {
                  const brand = BRAND_BY_ID[p.brandId];
                  const conf = conflictMap[p.id]?.hasConflict;
                  return (
                    <button
                      key={p.id}
                      className="cal-dot"
                      style={{ background: brand.color, boxShadow: conf ? `0 0 0 2px #fff, 0 0 0 3.5px ${'#DC2626'}` : undefined }}
                      onMouseEnter={(e) => setTip({ placement: p, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) => setTip({ placement: p, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTip(null)}
                      onClick={(e) => { e.stopPropagation(); setTip(null); onOpenPlacement(p); }}
                      aria-label={brand.name}
                    />
                  );
                })}
                {extra > 0 && (
                  <span className="cal-more">+{extra}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tip && (() => {
        const p = tip.placement;
        const b = bloggers.find(x => x.id === p.bloggerId);
        const brand = BRAND_BY_ID[p.brandId];
        return (
          <div className="cal-tip" style={{ left: tip.x + 14, top: tip.y + 14 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="dot-mini" style={{ background: brand.color }} />
              <span style={{ fontWeight: 600 }}>{brand.name}</span>
            </div>
            <div className="cal-tip-row">{b?.name ?? '—'}</div>
            <div className="cal-tip-row">{p.tool} · {p.category}</div>
            {conflictMap[p.id]?.hasConflict && (
              <div className="cal-tip-conflict">
                <IconAlert size={12} color="#DC2626" strokeWidth={2.4} />
                <span>Конфликт</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Day popover */}
      {popover && (() => {
        const list = placementsByDay[popover.iso] || [];
        // Clamp position so popover stays inside viewport
        const pw = 320;
        let px = popover.x;
        if (px + pw > window.innerWidth - 16) px = window.innerWidth - pw - 16;
        return (
          <div className="cal-pop" style={{ left: px, top: popover.y + 8 }} onClick={(e) => e.stopPropagation()}>
            <div className="cal-pop-head">
              <div style={{ fontSize: 13, color: '#6B6B73' }}>{fmtRu(popover.iso)} · {list.length} размещений</div>
              <button className="iconbtn" onClick={() => setPopover(null)}><IconX size={14} /></button>
            </div>
            <div className="cal-pop-list">
              {list.map(p => {
                const b = bloggers.find(x => x.id === p.bloggerId);
                const brand = BRAND_BY_ID[p.brandId];
                const conf = conflictMap[p.id]?.hasConflict;
                return (
                  <button key={p.id} className="cal-pop-item" onClick={() => { setPopover(null); onOpenPlacement(p); }}>
                    <span className="dot-mini" style={{ background: brand.color }} />
                    <span className="grow truncate" style={{ textAlign: 'left' }}>
                      <span style={{ fontWeight: 600 }}>{b?.name ?? '—'}</span>
                      <span style={{ color: '#6B6B73' }}> · {brand.short} · {p.category}</span>
                    </span>
                    {conf && <span className="badge-conflict-sm"><IconAlert size={11} color="#DC2626" strokeWidth={2.4} />Конфликт</span>}
                  </button>
                );
              })}
            </div>
            <button className="cal-pop-add" onClick={() => { setPopover(null); onOpenPlacement(null, { date: popover.iso }); }}>
              <IconPlus size={14} /> Добавить в этот день
            </button>
          </div>
        );
      })()}

      {/* Inline styles for the calendar */}
      <style>{`
        .cal-wrap { position: relative; }
        .cal-dow { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
        .cal-dow-cell {
          padding: 8px 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em;
          text-transform: uppercase; color: #6B6B73;
        }
        .cal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          background: var(--line-2);
          gap: 1px;
          border: 1px solid var(--line-1);
          border-radius: 12px;
          overflow: hidden;
        }
        .cal-cell {
          background: var(--surface);
          min-height: 116px;
          padding: 10px 10px 8px;
          display: flex; flex-direction: column; gap: 10px;
          cursor: pointer;
          position: relative;
          transition: background 120ms ease;
        }
        .cal-cell:hover { background: #FBFBF8; }
        .cal-cell-empty { background: #FAFAF7; cursor: default; }
        .cal-cell-empty:hover { background: #FAFAF7; }
        .cal-cell-head { display: flex; align-items: center; justify-content: space-between; }
        .cal-daynum {
          font-size: 13px; font-weight: 600; color: var(--ink-2);
          line-height: 1;
        }
        .cal-daynum.is-today {
          background: var(--ink-1); color: #fff;
          width: 24px; height: 24px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .cal-conflict-mark {
          width: 20px; height: 20px; border-radius: 999px;
          background: var(--conflict);
          display: inline-flex; align-items: center; justify-content: center;
        }
        .cal-dots {
          display: flex; flex-wrap: wrap; gap: 4px;
        }
        .cal-dot {
          width: 10px; height: 10px; border-radius: 999px; border: none;
          padding: 0; cursor: pointer;
          transition: transform 120ms ease;
        }
        .cal-dot:hover { transform: scale(1.35); }
        .cal-more {
          font-size: 11px; font-weight: 600; color: var(--ink-3);
          margin-left: 2px;
        }

        .cal-tip {
          position: fixed; z-index: 100;
          background: #161618; color: #fff; border-radius: 8px;
          padding: 8px 10px; font-size: 12px; line-height: 1.45;
          box-shadow: var(--sh-3);
          pointer-events: none;
          min-width: 180px;
        }
        .cal-tip-row { color: rgba(255,255,255,0.85); }
        .cal-tip-conflict {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 4px;
          color: #FCA5A5;
        }

        .cal-pop {
          position: fixed; z-index: 90;
          background: var(--surface); border: 1px solid var(--line-1);
          border-radius: 12px; box-shadow: var(--sh-modal);
          width: 320px; max-height: 380px;
          display: flex; flex-direction: column;
        }
        .cal-pop-head {
          padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid var(--line-2);
        }
        .cal-pop-list { flex: 1; overflow-y: auto; padding: 4px; }
        .cal-pop-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 8px;
          background: transparent; border: none; text-align: left; font-size: 13px;
          color: var(--ink-1);
        }
        .cal-pop-item:hover { background: var(--bg); }
        .cal-pop-add {
          border-top: 1px solid var(--line-2); padding: 10px 14px;
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 500; color: var(--ink-1);
          background: transparent; border-left: none; border-right: none; border-bottom: none;
        }
        .cal-pop-add:hover { background: var(--bg); }
      `}</style>
    </div>
  );
}

window.CalendarView = CalendarView;
