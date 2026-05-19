/* global React, ReactDOM, window */
// ============================================================================
// App — root, header + filters + view switch + modal orchestration
// ============================================================================
const { useState, useMemo, useEffect, useRef } = React;

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function App() {
  // --- Core state ----------------------------------------------------------
  const [placements, setPlacements] = useState(PLACEMENTS_SEED);
  const [bloggers, setBloggers] = useState(BLOGGERS);
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('prg.view') || 'calendar'; } catch { return 'calendar'; }
  });
  useEffect(() => { try { localStorage.setItem('prg.view', view); } catch {} }, [view]);

  // Current month
  const [year, setYear]   = useState(2026);
  const [month, setMonth] = useState(5); // May 2026 per spec
  const todayIso = isoToday();

  // Filters
  const [brandFilter, setBrandFilter] = useState(new Set()); // empty = all
  const [bloggerFilter, setBloggerFilter] = useState(''); // single id, '' = all
  const [onlyConflicts, setOnlyConflicts] = useState(false);

  // --- Conflict map (over ALL placements; not affected by filters) ---------
  const conflictMap = useMemo(() => {
    const map = {};
    placements.forEach(p => {
      map[p.id] = detectConflicts(p, placements);
    });
    return map;
  }, [placements]);

  const totalConflicts = useMemo(
    () => placements.filter(p => conflictMap[p.id]?.hasConflict).length,
    [placements, conflictMap]
  );

  // --- Visible placements (after filters + month scope) --------------------
  const visiblePlacements = useMemo(() => {
    const mPad = String(month).padStart(2,'0');
    const monthPrefix = `${year}-${mPad}`;
    return placements.filter(p => {
      if (!p.date.startsWith(monthPrefix)) return false;
      if (brandFilter.size > 0 && !brandFilter.has(p.brandId)) return false;
      if (bloggerFilter && p.bloggerId !== bloggerFilter) return false;
      if (onlyConflicts && !conflictMap[p.id]?.hasConflict) return false;
      return true;
    });
  }, [placements, year, month, brandFilter, bloggerFilter, onlyConflicts, conflictMap]);

  // --- Modal state ---------------------------------------------------------
  const [modal, setModal] = useState(null); // {kind, payload}
  const openPlacement = (p, prefill) => {
    setModal({ kind: 'placement', placement: p, prefill, mode: p ? 'edit' : 'create' });
  };
  const openBlogger = (b) => setModal({ kind: 'blogger', blogger: b });

  // Confirm dialog
  const [confirm, setConfirm] = useState(null);

  // Toast (success / error)
  const [toast, setToast] = useState(null);
  const pushToast = (msg, tone = 'ok') => {
    setToast({ msg, tone });
    clearTimeout(pushToast._t);
    pushToast._t = setTimeout(() => setToast(null), 2400);
  };

  // --- Mutations -----------------------------------------------------------
  const upsertPlacement = (form) => {
    if (form.id) {
      setPlacements(prev => prev.map(p => p.id === form.id ? { ...p, ...form } : p));
      pushToast('Размещение обновлено');
    } else {
      const id = 'p' + Math.random().toString(36).slice(2, 8);
      setPlacements(prev => [...prev, { ...form, id }]);
      pushToast('Размещение создано');
    }
  };

  const handleSave = (form) => {
    // If there's a conflict, ask before saving
    const sim = { ...form, id: form.id || '__draft__' };
    const others = placements.filter(p => p.id !== sim.id);
    const c = detectConflicts(sim, others);
    if (c.hasConflict) {
      setConfirm({
        title: 'Конфликт обнаружен',
        body: 'Размещение нарушает правила. Всё равно сохранить?',
        confirmLabel: 'Всё равно сохранить',
        tone: 'danger',
        onConfirm: () => { setConfirm(null); upsertPlacement(form); setModal(null); },
        onCancel: () => setConfirm(null),
      });
    } else {
      upsertPlacement(form);
      setModal(null);
    }
  };

  const handleDelete = () => {
    const id = modal?.placement?.id;
    if (!id) return;
    setConfirm({
      title: 'Удалить размещение?',
      body: 'Размещение получит статус «Отменено» — данные сохранятся, но из активного планирования исчезнут.',
      confirmLabel: 'Удалить',
      tone: 'danger',
      onConfirm: () => {
        setPlacements(prev => prev.map(p => p.id === id ? { ...p, status: 'Отменено' } : p)
                                  .filter(p => p.id !== id)); // hard remove for prototype clarity
        setConfirm(null); setModal(null);
        pushToast('Размещение удалено');
      },
      onCancel: () => setConfirm(null),
    });
  };

  // Move from Schedule drag
  const handleMove = (id, patch, conflictResult) => {
    return new Promise((resolve) => {
      const doIt = () => {
        setPlacements(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
        pushToast('Размещение перенесено');
        resolve(true);
      };
      if (conflictResult && conflictResult.has) {
        const target = placements.find(p => p.id === id);
        const blogger = bloggers.find(b => b.id === (patch.bloggerId || target?.bloggerId));
        const r = conflictResult.reasons[0];
        const reasonText = r
          ? (r.kind === 'same-day'
              ? `тот же день, что и ${BRAND_BY_ID[r.against.brandId].name}`
              : r.kind === 'brand'
                ? `${r.gap} дн. до размещения ${BRAND_BY_ID[r.against.brandId].name}, нужно ≥${r.required}`
                : `${r.gap} дн. до «${r.against.category}» (${BRAND_BY_ID[r.against.brandId].name}), нужно ≥${r.required}`)
          : '';
        setConfirm({
          title: 'Конфликт обнаружен',
          body: `Перенос ${blogger?.name ?? 'блогера'} на ${fmtRu(patch.date || target.date)} нарушает правило: ${reasonText}. Всё равно поставить?`,
          confirmLabel: 'Всё равно поставить',
          tone: 'danger',
          onConfirm: () => { setConfirm(null); doIt(); },
          onCancel: () => { setConfirm(null); resolve(false); },
        });
      } else {
        doIt();
      }
    });
  };

  const handleSaveBlogger = (form) => {
    setBloggers(prev => prev.map(b => b.id === form.id ? { ...b, ...form } : b));
    setModal(null);
    pushToast('Карточка блогера сохранена');
  };

  const handleCreateBlogger = ({ name, platform, handle }) => {
    const id = 'b' + Math.random().toString(36).slice(2, 6);
    const empty = { tiktok: '', instagram: '', youtube: '', vk: '', telegram: '' };
    const key = { TikTok: 'tiktok', Instagram: 'instagram', YouTube: 'youtube', VK: 'vk', Telegram: 'telegram' }[platform];
    const created = { id, name, level: 'Средний', ...empty, [key]: handle, contact: '', notes: '' };
    setBloggers(prev => [...prev, created]);
    pushToast(`Блогер «${name}» добавлен`);
    return created;
  };

  // Month navigation
  const goPrevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  };

  return (
    <div className="app">
      {/* ============= Header ============= */}
      <header className="hdr">
        <div className="container hdr-inner">
          <div className="row" style={{ gap: 12 }}>
            <div className="hdr-logo">
              <div className="hdr-logo-mark" />
              <span className="hdr-logo-text">PR Gradient</span>
            </div>
            <div className="hdr-sub">8 брендов · {bloggers.length} блогеров · {placements.length} размещений</div>
          </div>

          <div className="row" style={{ gap: 12 }}>
            {/* View toggle — segmented control */}
            <div className="seg" role="tablist" aria-label="Режим просмотра">
              <button
                role="tab"
                aria-selected={view === 'calendar'}
                className={`seg-btn ${view === 'calendar' ? 'is-active' : ''}`}
                onClick={() => setView('calendar')}
              >
                <IconCalendar size={15} /> Календарь
              </button>
              <button
                role="tab"
                aria-selected={view === 'schedule'}
                className={`seg-btn ${view === 'schedule' ? 'is-active' : ''}`}
                onClick={() => setView('schedule')}
              >
                <IconLayers size={15} /> Расписание
              </button>
            </div>

            <button className="btn btn-primary" onClick={() => openPlacement(null)}>
              <IconPlus size={15} strokeWidth={2.2} /> Размещение
            </button>
          </div>
        </div>
      </header>

      {/* ============= Filter bar ============= */}
      <div className="container">
        <div className="filterbar">
          {/* Brand multi-select */}
          <BrandMultiSelect value={brandFilter} onChange={setBrandFilter} />

          {/* Blogger search */}
          <BloggerFilter value={bloggerFilter} onChange={setBloggerFilter} bloggers={bloggers} />

          {/* Only conflicts */}
          <button
            className={`chip-toggle ${onlyConflicts ? 'is-active' : ''}`}
            onClick={() => setOnlyConflicts(v => !v)}
          >
            <span className={`chip-mark ${onlyConflicts ? 'is-on' : ''}`}>
              {onlyConflicts && <IconCheck size={11} color="#fff" strokeWidth={2.6} />}
            </span>
            Только конфликты
            <span className="chip-counter">{totalConflicts}</span>
          </button>

          {(brandFilter.size > 0 || bloggerFilter || onlyConflicts) && (
            <button className="filter-reset" onClick={() => { setBrandFilter(new Set()); setBloggerFilter(''); setOnlyConflicts(false); }}>
              Сбросить
            </button>
          )}

          <div className="grow" />

          {/* Month navigator */}
          <div className="monthnav">
            <button className="iconbtn" onClick={goPrevMonth} aria-label="Предыдущий месяц"><IconChevL size={16} /></button>
            <span className="monthnav-label">{MONTHS_RU[month - 1]} {year}</span>
            <button className="iconbtn" onClick={goNextMonth} aria-label="Следующий месяц"><IconChevR size={16} /></button>
          </div>
        </div>
      </div>

      {/* ============= Main view ============= */}
      <div className="container main">
        {visiblePlacements.length === 0 && !onlyConflicts && (brandFilter.size === 0 && !bloggerFilter) ? (
          <EmptyState onAdd={() => openPlacement(null)} />
        ) : (
          <>
            {view === 'calendar' ? (
              <CalendarView
                year={year} month={month}
                placements={visiblePlacements}
                bloggers={bloggers}
                conflictMap={conflictMap}
                todayIso={todayIso}
                onOpenPlacement={openPlacement}
              />
            ) : (
              <ScheduleView
                year={year} month={month}
                placements={visiblePlacements}
                bloggers={bloggers}
                conflictMap={conflictMap}
                todayIso={todayIso}
                onOpenPlacement={openPlacement}
                onOpenBlogger={openBlogger}
                onMovePlacement={handleMove}
              />
            )}

            {/* Brand legend */}
            <div className="legend">
              {BRANDS.map(b => (
                <span key={b.id} className="legend-item">
                  <span className="dot-mini" style={{ background: b.color }} />
                  <span>{b.name}</span>
                </span>
              ))}
              <span className="legend-sep" />
              <span className="legend-item">
                <span className="legend-conflict"><IconAlert size={10} color="#fff" strokeWidth={2.6} /></span>
                Конфликт
              </span>
            </div>
          </>
        )}
      </div>

      {/* ============= Modals ============= */}
      {modal?.kind === 'placement' && (
        <PlacementModal
          mode={modal.mode}
          placement={modal.placement}
          prefill={modal.prefill}
          bloggers={bloggers}
          placements={placements}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onCreateBlogger={handleCreateBlogger}
        />
      )}
      {modal?.kind === 'blogger' && (
        <BloggerModal
          blogger={modal.blogger}
          placements={placements}
          conflictMap={conflictMap}
          onClose={() => setModal(null)}
          onSave={handleSaveBlogger}
          onOpenPlacement={(p) => { setModal(null); setTimeout(() => openPlacement(p), 60); }}
        />
      )}
      {confirm && <ConfirmDialog {...confirm} />}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.tone}`}>
          {toast.tone === 'ok' ? <IconCheck size={14} color="#fff" strokeWidth={2.4} /> : <IconAlert size={14} color="#fff" strokeWidth={2.4} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <GlobalStyles />
    </div>
  );
}

// ============================================================================
// Brand multi-select (chip popover)
// ============================================================================
function BrandMultiSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const summary = value.size === 0 ? 'Все бренды' : `${value.size} из 8`;

  const toggle = (id) => {
    const next = new Set(value);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  };

  return (
    <div ref={ref} className="bms">
      <button className={`chip-toggle ${value.size > 0 ? 'is-active' : ''}`} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Бренд:</span>
        <span style={{ fontWeight: 600 }}>{summary}</span>
        {value.size > 0 && (
          <span style={{ display: 'inline-flex', gap: 2 }}>
            {[...value].slice(0, 4).map(id => (
              <span key={id} className="dot-mini" style={{ background: BRAND_BY_ID[id].color }} />
            ))}
          </span>
        )}
        <IconChevDown size={13} color="#6B6B73" />
      </button>
      {open && (
        <div className="bms-menu">
          {BRANDS.map(b => {
            const on = value.has(b.id);
            return (
              <button key={b.id} className={`bms-item ${on ? 'is-on' : ''}`} onClick={() => toggle(b.id)}>
                <span className={`chip-mark ${on ? 'is-on' : ''}`}>
                  {on && <IconCheck size={11} color="#fff" strokeWidth={2.6} />}
                </span>
                <span className="dot-mini" style={{ background: b.color }} />
                <span className="grow" style={{ textAlign: 'left' }}>{b.name}</span>
                <span className="bms-short">{b.short}</span>
              </button>
            );
          })}
          {value.size > 0 && (
            <button className="bms-clear" onClick={() => onChange(new Set())}>Очистить</button>
          )}
        </div>
      )}
      <style>{`
        .bms { position: relative; }
        .bms-menu {
          position: absolute; top: calc(100% + 6px); left: 0; z-index: 30;
          width: 280px; background: var(--surface);
          border: 1px solid var(--line-1); border-radius: 10px;
          box-shadow: var(--sh-modal); padding: 4px;
        }
        .bms-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 6px;
          border: none; background: transparent; font-size: 13px; color: var(--ink-1);
          text-align: left;
        }
        .bms-item:hover { background: var(--bg); }
        .bms-item.is-on { background: var(--bg); }
        .bms-short { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); }
        .bms-clear {
          width: 100%; margin-top: 4px;
          padding: 8px 10px; border-radius: 6px;
          background: transparent; border: 1px dashed var(--line-1);
          font-size: 12px; color: var(--ink-3);
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Blogger filter (search-select)
// ============================================================================
function BloggerFilter({ value, onChange, bloggers }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const selected = bloggers.find(b => b.id === value);
  const list = q ? bloggers.filter(b => b.name.toLowerCase().includes(q.toLowerCase())) : bloggers;

  return (
    <div ref={ref} className="bms">
      <button className={`chip-toggle ${value ? 'is-active' : ''}`} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Блогер:</span>
        <span style={{ fontWeight: 600 }}>{selected ? selected.name : 'Все'}</span>
        {selected && (
          <span className="iconbtn-mini" onClick={(e) => { e.stopPropagation(); onChange(''); }} aria-label="Очистить">
            <IconX size={11} />
          </span>
        )}
        <IconChevDown size={13} color="#6B6B73" />
      </button>
      {open && (
        <div className="bms-menu" style={{ width: 300, padding: 0 }}>
          <div className="bcombo-search" style={{ padding: '8px 12px', borderBottom: '1px solid var(--line-2)' }}>
            <IconSearch size={14} color="#6B6B73" />
            <input autoFocus placeholder="Поиск..." value={q} onChange={(e) => setQ(e.target.value)} style={{ border:'none', outline:'none', flex:1, background:'transparent', fontSize:14 }} />
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: 4 }}>
            <button className={`bms-item ${!value ? 'is-on' : ''}`} onClick={() => { onChange(''); setOpen(false); }}>
              <span className="bcombo-avatar" style={{ background: 'var(--line-1)', color: 'var(--ink-2)' }}>×</span>
              <span className="grow" style={{ textAlign: 'left' }}>Все блогеры</span>
            </button>
            {list.slice(0, 80).map(b => (
              <button key={b.id} className={`bms-item ${b.id === value ? 'is-on' : ''}`} onClick={() => { onChange(b.id); setOpen(false); setQ(''); }}>
                <span className="bcombo-avatar">{b.name[0]}</span>
                <span className="grow truncate" style={{ textAlign: 'left' }}>{b.name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{b.level}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="empty">
      <div className="empty-emoji">📋</div>
      <div className="empty-title">Нет размещений в этом месяце</div>
      <div className="empty-sub">Запланируйте первое размещение, чтобы начать управлять загрузкой блогеров.</div>
      <button className="btn btn-primary" onClick={onAdd}>
        <IconPlus size={15} strokeWidth={2.2} /> Добавить первое
      </button>
      <style>{`
        .empty { padding: 80px 24px; text-align: center; }
        .empty-emoji { font-size: 48px; margin-bottom: 12px; opacity: 0.8; }
        .empty-title { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
        .empty-sub { color: var(--ink-3); margin-bottom: 20px; }
      `}</style>
    </div>
  );
}

// ============================================================================
// Global styles for header / filter bar / buttons / toast / legend
// ============================================================================
function GlobalStyles() {
  return (
    <style>{`
      .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

      .app {
        min-height: 100vh;
        padding-bottom: 64px;
      }

      .hdr {
        background: var(--surface);
        border-bottom: 1px solid var(--line-1);
        position: sticky; top: 0; z-index: 50;
      }
      .hdr-inner {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 24px;
      }
      .hdr-logo { display: flex; align-items: center; gap: 10px; }
      .hdr-logo-mark {
        width: 24px; height: 24px; border-radius: 6px;
        background:
          conic-gradient(from 0deg,
            #B91C5C, #EA580C, #059669, #0891B2,
            #1D4ED8, #7C3AED, #EC4899, #B91C5C);
        box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.55);
      }
      .hdr-logo-text {
        font-size: 16px; font-weight: 700; letter-spacing: -0.01em;
        color: var(--ink-1);
      }
      .hdr-sub {
        font-size: 12px; color: var(--ink-3);
        padding-left: 12px; border-left: 1px solid var(--line-1);
        margin-left: 2px;
      }

      .seg {
        display: inline-flex;
        background: var(--bg);
        border: 1px solid var(--line-1);
        border-radius: 10px;
        padding: 3px;
        gap: 2px;
      }
      .seg-btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 12px;
        font-size: 13px; font-weight: 500;
        color: var(--ink-3);
        background: transparent; border: none; border-radius: 7px;
        cursor: pointer;
        transition: background 120ms ease, color 120ms ease;
      }
      .seg-btn:hover { color: var(--ink-1); }
      .seg-btn.is-active {
        background: var(--surface); color: var(--ink-1);
        box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--line-1);
        font-weight: 600;
      }

      .btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 9px 14px;
        font-size: 13px; font-weight: 600; line-height: 1.2;
        border-radius: 8px;
        border: 1px solid transparent;
        cursor: pointer;
        transition: background 120ms ease, color 120ms ease, border 120ms ease;
      }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-sm { padding: 7px 10px; font-size: 12px; }

      .btn-primary { background: var(--ink-1); color: #fff; }
      .btn-primary:hover:not(:disabled) { background: #232327; }

      .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--line-1); }
      .btn-ghost:hover { background: var(--bg); color: var(--ink-1); }

      .btn-danger { color: var(--conflict); border-color: rgba(220,38,38,0.25); }
      .btn-danger:hover { background: var(--conflict-bg); }

      .btn-danger-solid { background: var(--conflict); color: #fff; border-color: var(--conflict); }
      .btn-danger-solid:hover { background: #B91C1C; border-color: #B91C1C; }

      .iconbtn {
        width: 28px; height: 28px; border-radius: 6px;
        background: transparent; border: 1px solid transparent;
        display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; color: var(--ink-2);
      }
      .iconbtn:hover { background: var(--bg); color: var(--ink-1); }

      .iconbtn-mini {
        width: 16px; height: 16px; border-radius: 4px;
        background: rgba(0,0,0,0.08);
        display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; color: var(--ink-2);
      }
      .iconbtn-mini:hover { background: rgba(0,0,0,0.16); }

      .filterbar {
        display: flex; align-items: center; gap: 10px;
        padding: 16px 0 14px;
        flex-wrap: wrap;
      }
      .filter-reset {
        background: transparent; border: none;
        color: var(--ink-3); font-size: 12px;
        text-decoration: underline;
        text-decoration-color: var(--line-1);
        cursor: pointer;
      }
      .filter-reset:hover { color: var(--ink-1); text-decoration-color: var(--ink-3); }

      .chip-toggle {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 7px 11px 7px 11px;
        background: var(--surface);
        border: 1px solid var(--line-1);
        border-radius: 999px;
        font-size: 13px; color: var(--ink-1);
        cursor: pointer;
        transition: border-color 120ms ease, background 120ms ease;
      }
      .chip-toggle:hover { border-color: #C8C8C2; }
      .chip-toggle.is-active {
        background: #F1F1EE; border-color: #C5C5BE;
      }
      .chip-mark {
        width: 16px; height: 16px; border-radius: 4px;
        border: 1px solid var(--line-1);
        background: var(--surface);
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .chip-mark.is-on { background: var(--ink-1); border-color: var(--ink-1); }
      .chip-counter {
        background: var(--conflict-bg); color: var(--conflict);
        font-size: 11px; font-weight: 600;
        padding: 1px 7px; border-radius: 999px;
        margin-left: 2px;
      }

      .monthnav {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 4px 6px;
        background: var(--surface);
        border: 1px solid var(--line-1);
        border-radius: 999px;
      }
      .monthnav-label {
        font-size: 13px; font-weight: 600;
        padding: 0 10px; min-width: 132px; text-align: center;
        color: var(--ink-1);
      }

      .main { padding-bottom: 24px; }

      .legend {
        display: flex; flex-wrap: wrap; align-items: center; gap: 12px 18px;
        padding: 18px 4px 4px;
        font-size: 12px; color: var(--ink-3);
      }
      .legend-item { display: inline-flex; align-items: center; gap: 6px; }
      .legend-sep {
        width: 1px; height: 16px; background: var(--line-1);
      }
      .legend-conflict {
        width: 14px; height: 14px; border-radius: 999px; background: var(--conflict);
        display: inline-flex; align-items: center; justify-content: center;
      }

      .toast {
        position: fixed; bottom: 24px; right: 24px; z-index: 700;
        padding: 10px 14px;
        background: var(--ink-1); color: #fff;
        border-radius: 10px;
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 13px; font-weight: 500;
        box-shadow: var(--sh-3);
        animation: tIn 180ms ease-out;
      }
      .toast-error { background: var(--conflict); }
      @keyframes tIn {
        from { transform: translateY(8px); opacity: 0; }
        to { transform: none; opacity: 1; }
      }

      /* Shared utility classes (used across views) */
      .dot-mini {
        width: 8px; height: 8px; border-radius: 999px;
        display: inline-block; flex-shrink: 0;
      }
      .badge-conflict-sm {
        display: inline-flex; align-items: center; gap: 3px;
        background: var(--conflict-bg); color: var(--conflict);
        padding: 2px 6px; border-radius: 4px;
        font-size: 11px; font-weight: 500;
        flex-shrink: 0;
      }
    `}</style>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
