/* global window */
// ============================================================================
// Domain data + conflict rules for PR Gradient
// ============================================================================

const BRANDS = [
  { id: 'vs', name: 'Vivienne Sabó',      short: 'VS',  color: '#B91C5C' },
  { id: 'st', name: 'Stellary',           short: 'ST',  color: '#1D4ED8' },
  { id: 'ib', name: 'Influence Beauty',   short: 'IB',  color: '#059669' },
  { id: 'bb', name: 'Beauty Bomb',        short: 'BB',  color: '#EC4899' },
  { id: 'lg', name: 'Love Generation',    short: 'LG',  color: '#EA580C' },
  { id: 'ad', name: 'ARTDECO',            short: 'AD',  color: '#374151' },
  { id: 'dm', name: 'Deborah Milano',     short: 'DM',  color: '#7C3AED' },
  { id: 'pf', name: 'Physicians Formula', short: 'PF',  color: '#0891B2' },
];

const BRAND_BY_ID = Object.fromEntries(BRANDS.map(b => [b.id, b]));

const CATEGORIES = ['Губы', 'Глаза', 'Лицо', 'Брови', 'Ногти', 'Волосы', 'Аксессуары'];
const TOOLS      = ['Крупный блогер', 'Свайп', 'Посев'];
const TOOL_SHORT = { 'Крупный блогер': 'К', 'Свайп': 'С', 'Посев': 'П' };
const PLATFORMS  = ['TikTok', 'Instagram', 'YouTube', 'VK', 'Telegram'];
const STATUSES   = ['Запланировано', 'Опубликовано', 'Отменено'];
const LEVELS     = ['Крупный', 'Средний', 'Нано'];

// ----------------------------------------------------------------------------
// Bloggers
// ----------------------------------------------------------------------------
const BLOGGERS = [
  { id: 'b01', name: 'Полина Петухова',  level: 'Крупный', tiktok: 'pollinasha_', instagram: 'polinapt',  telegram: 'polina_p',  vk: '',          youtube: '',          contact: 't.me/polina_p',    notes: 'Снимает быстро, не любит дедлайны.' },
  { id: 'b02', name: 'Леля Зимина',      level: 'Крупный', tiktok: 'lelya.z',      instagram: 'lelya.z',   telegram: 'lelya_z',   vk: '',          youtube: '',          contact: 't.me/lelya_z',     notes: '' },
  { id: 'b03', name: 'Маша Городилова',  level: 'Средний', tiktok: 'mashagrd',     instagram: 'masha.grd', telegram: 'mashagrd',  vk: '',          youtube: '',          contact: '@mashagrd',        notes: 'Запросы дороже среднего, но качество стабильное.' },
  { id: 'b04', name: 'Дарина Эрвье',     level: 'Крупный', tiktok: '',             instagram: 'darina.e',  telegram: 'd_ervje',   vk: '',          youtube: 'darinaervje', contact: 't.me/d_ervje',     notes: '' },
  { id: 'b05', name: 'Ясмин Юсупова',    level: 'Средний', tiktok: 'yasminyu',     instagram: 'yasminyu',  telegram: '',          vk: '',          youtube: '',          contact: '@yasminyu',        notes: '' },
  { id: 'b06', name: 'Аня Покров',       level: 'Нано',    tiktok: 'an.pokrov',    instagram: 'an.pokrov', telegram: '',          vk: 'anpokrov',  youtube: '',          contact: 'vk/anpokrov',      notes: '' },
  { id: 'b07', name: 'Соня Морошкина',   level: 'Средний', tiktok: 'sonya.m',      instagram: 'sonya.m',   telegram: 'sonyam',    vk: '',          youtube: '',          contact: 't.me/sonyam',      notes: 'Хорошо работает с beauty-инструментами.' },
  { id: 'b08', name: 'Алина Карташова',  level: 'Крупный', tiktok: 'alinakart',    instagram: 'alinakart', telegram: 'alinakart', vk: '',          youtube: 'alinakart',  contact: 't.me/alinakart',   notes: '' },
  { id: 'b09', name: 'Вика Степанюк',    level: 'Средний', tiktok: 'vstepanyuk',   instagram: 'vstep',     telegram: '',          vk: '',          youtube: '',          contact: '@vstep',           notes: '' },
  { id: 'b10', name: 'Лиза Багрова',     level: 'Нано',    tiktok: 'lizabag',      instagram: 'lizabag',   telegram: '',          vk: '',          youtube: '',          contact: '@lizabag',         notes: '' },
  { id: 'b11', name: 'Катя Самбурская',  level: 'Крупный', tiktok: 'katyasmb',     instagram: 'katyasmb',  telegram: 'katyasmb',  vk: '',          youtube: '',          contact: 't.me/katyasmb',    notes: '' },
  { id: 'b12', name: 'Настя Ивлеева',    level: 'Крупный', tiktok: '',             instagram: 'ivleeva',   telegram: 'ivleeva',   vk: '',          youtube: 'ivleeva',   contact: 't.me/ivleeva',     notes: '' },
  { id: 'b13', name: 'Юля Топольницкая', level: 'Средний', tiktok: 'yulia.top',    instagram: 'yulia.top', telegram: '',          vk: '',          youtube: '',          contact: '@yulia.top',       notes: '' },
  { id: 'b14', name: 'Рита Дакота',      level: 'Крупный', tiktok: 'ritadakota',   instagram: 'ritadakota',telegram: '',          vk: '',          youtube: 'ritadakota',contact: 't.me/ritadakota',  notes: '' },
  { id: 'b15', name: 'Зоя Бербер',       level: 'Средний', tiktok: 'zoya.b',       instagram: 'zoya.b',    telegram: 'zoya_b',    vk: '',          youtube: '',          contact: 't.me/zoya_b',      notes: '' },
  { id: 'b16', name: 'Аглая Шиловская',  level: 'Средний', tiktok: 'aglaya.sh',    instagram: 'aglayash',  telegram: '',          vk: '',          youtube: '',          contact: '@aglayash',        notes: '' },
  { id: 'b17', name: 'Ника Бачева',      level: 'Нано',    tiktok: 'nika.bachi',   instagram: 'nika.bachi',telegram: '',          vk: '',          youtube: '',          contact: '@nika.bachi',      notes: '' },
  { id: 'b18', name: 'Олеся Малинская',  level: 'Средний', tiktok: 'olesya.m',     instagram: 'olesya.m',  telegram: '',          vk: 'olesyam',   youtube: '',          contact: 'vk/olesyam',       notes: '' },
  { id: 'b19', name: 'Тася Соломатина',  level: 'Нано',    tiktok: 'tasya.s',      instagram: 'tasya.s',   telegram: '',          vk: '',          youtube: '',          contact: '@tasya.s',         notes: '' },
  { id: 'b20', name: 'Маргарита Мокшина',level: 'Нано',    tiktok: 'rita.mk',      instagram: 'rita.mk',   telegram: '',          vk: '',          youtube: '',          contact: '@rita.mk',         notes: '' },
  { id: 'b21', name: 'Влада Жукова',     level: 'Средний', tiktok: 'vladaz',       instagram: 'vladaz',    telegram: '',          vk: '',          youtube: '',          contact: '@vladaz',          notes: '' },
  { id: 'b22', name: 'Ника Сухоруких',   level: 'Крупный', tiktok: 'nika.suh',     instagram: 'nika.suh',  telegram: 'nikasuh',   vk: '',          youtube: '',          contact: 't.me/nikasuh',     notes: '' },
  { id: 'b23', name: 'Эвелина Янко',     level: 'Нано',    tiktok: 'evelinay',     instagram: 'evelinay',  telegram: '',          vk: '',          youtube: '',          contact: '@evelinay',        notes: '' },
  { id: 'b24', name: 'Анфиса Дю',        level: 'Средний', tiktok: 'anfisa.du',    instagram: 'anfisa.du', telegram: '',          vk: '',          youtube: '',          contact: '@anfisa.du',       notes: '' },
  { id: 'b25', name: 'Стася Милославская',level:'Крупный', tiktok: '',             instagram: 'stasiamilo',telegram: 'stasiamilo',vk: '',          youtube: '',          contact: 't.me/stasiamilo',  notes: '' },
];

// ----------------------------------------------------------------------------
// Placements (May 2026). dateStr is YYYY-MM-DD.
// ----------------------------------------------------------------------------
const Y = 2026, M = 5;
const d = (day) => `${Y}-${String(M).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

const PLACEMENTS_SEED = [
  // intentional conflict: b01 same day, two holding brands
  { id: 'p001', date: d(18), bloggerId: 'b01', brandId: 'ib', category: 'Губы',  product: 'Glossy Lip Volume',         tool: 'Крупный блогер', platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p002', date: d(18), bloggerId: 'b01', brandId: 'vs', category: 'Губы',  product: 'Муссовые помады MUSE',      tool: 'Крупный блогер', platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p003', date: d(10), bloggerId: 'b01', brandId: 'st', category: 'Лицо',  product: 'Skin Glow база',            tool: 'Свайп',          platform: 'Instagram', link: '', status: 'Опубликовано' },
  { id: 'p004', date: d(3),  bloggerId: 'b01', brandId: 'bb', category: 'Глаза', product: 'Eye Bomb палетка',          tool: 'Посев',          platform: 'Instagram', link: '', status: 'Опубликовано' },

  // b02
  { id: 'p005', date: d(7),  bloggerId: 'b02', brandId: 'st', category: 'Лицо',  product: 'Stellary тон-флюид',        tool: 'Свайп',          platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p006', date: d(15), bloggerId: 'b02', brandId: 'vs', category: 'Глаза', product: 'Тушь Cabaret',              tool: 'Крупный блогер', platform: 'TikTok',    link: '', status: 'Запланировано' },

  // b03 — close-spaced conflict (BB same brand twice in 4 days)
  { id: 'p007', date: d(6),  bloggerId: 'b03', brandId: 'bb', category: 'Глаза', product: 'Eye Bomb палетка',          tool: 'Свайп',          platform: 'Instagram', link: '', status: 'Запланировано' },
  { id: 'p008', date: d(10), bloggerId: 'b03', brandId: 'bb', category: 'Глаза', product: 'Bomb Mascara',              tool: 'Свайп',          platform: 'Instagram', link: '', status: 'Запланировано' },

  // b04
  { id: 'p009', date: d(8),  bloggerId: 'b04', brandId: 'ib', category: 'Лицо',  product: 'IB Glow Base',              tool: 'Крупный блогер', platform: 'YouTube',   link: '', status: 'Запланировано' },
  { id: 'p010', date: d(14), bloggerId: 'b04', brandId: 'lg', category: 'Брови', product: 'LG Brow Sculptor',          tool: 'Крупный блогер', platform: 'YouTube',   link: '', status: 'Запланировано' },

  // b05
  { id: 'p011', date: d(11), bloggerId: 'b05', brandId: 'bb', category: 'Губы',  product: 'Glow Lips',                  tool: 'Посев',          platform: 'TikTok',    link: '', status: 'Запланировано' },

  // b07
  { id: 'p012', date: d(4),  bloggerId: 'b07', brandId: 'pf', category: 'Лицо',  product: 'Healthy Wear SPF',          tool: 'Свайп',          platform: 'Instagram', link: '', status: 'Опубликовано' },
  { id: 'p013', date: d(13), bloggerId: 'b07', brandId: 'dm', category: 'Губы',  product: 'Milano Lipstick',           tool: 'Свайп',          platform: 'Instagram', link: '', status: 'Запланировано' },
  { id: 'p014', date: d(22), bloggerId: 'b07', brandId: 'ad', category: 'Глаза', product: 'AD Eyeliner',               tool: 'Крупный блогер', platform: 'Instagram', link: '', status: 'Запланировано' },

  // b08
  { id: 'p015', date: d(5),  bloggerId: 'b08', brandId: 'vs', category: 'Лицо',  product: 'VS Tonalité',               tool: 'Крупный блогер', platform: 'YouTube',   link: '', status: 'Опубликовано' },
  { id: 'p016', date: d(20), bloggerId: 'b08', brandId: 'dm', category: 'Глаза', product: 'Milano Smoky',              tool: 'Крупный блогер', platform: 'YouTube',   link: '', status: 'Запланировано' },

  // b09
  { id: 'p017', date: d(2),  bloggerId: 'b09', brandId: 'lg', category: 'Губы',  product: 'LG Velvet Matte',           tool: 'Посев',          platform: 'TikTok',    link: '', status: 'Опубликовано' },
  { id: 'p018', date: d(9),  bloggerId: 'b09', brandId: 'pf', category: 'Глаза', product: 'PF Mineral Wear',           tool: 'Свайп',          platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p019', date: d(24), bloggerId: 'b09', brandId: 'ib', category: 'Брови', product: 'IB Brow Pencil',            tool: 'Свайп',          platform: 'TikTok',    link: '', status: 'Запланировано' },

  // b10, b11
  { id: 'p020', date: d(12), bloggerId: 'b10', brandId: 'bb', category: 'Ногти', product: 'BB Nail Polish',            tool: 'Посев',          platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p021', date: d(6),  bloggerId: 'b11', brandId: 'ad', category: 'Лицо',  product: 'AD Hydra Base',             tool: 'Крупный блогер', platform: 'Instagram', link: '', status: 'Опубликовано' },
  { id: 'p022', date: d(19), bloggerId: 'b11', brandId: 'st', category: 'Глаза', product: 'Stellary Eyeshadow',        tool: 'Крупный блогер', platform: 'Instagram', link: '', status: 'Запланировано' },

  // b12 conflict — same blogger, same category Губы across two brands within 3 days
  { id: 'p023', date: d(16), bloggerId: 'b12', brandId: 'vs', category: 'Губы',  product: 'VS Cabaret Lips',           tool: 'Крупный блогер', platform: 'Instagram', link: '', status: 'Запланировано' },
  { id: 'p024', date: d(19), bloggerId: 'b12', brandId: 'dm', category: 'Губы',  product: 'DM Milano Lip',             tool: 'Крупный блогер', platform: 'Instagram', link: '', status: 'Запланировано' },

  // b13..b18 — fillers
  { id: 'p025', date: d(8),  bloggerId: 'b13', brandId: 'lg', category: 'Лицо',  product: 'LG Skin Tint',              tool: 'Посев',          platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p026', date: d(21), bloggerId: 'b13', brandId: 'ib', category: 'Глаза', product: 'IB Lash Plumper',           tool: 'Посев',          platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p027', date: d(3),  bloggerId: 'b14', brandId: 'pf', category: 'Лицо',  product: 'PF Powder',                 tool: 'Крупный блогер', platform: 'YouTube',   link: '', status: 'Опубликовано' },
  { id: 'p028', date: d(17), bloggerId: 'b14', brandId: 'bb', category: 'Глаза', product: 'BB Liner',                  tool: 'Крупный блогер', platform: 'YouTube',   link: '', status: 'Запланировано' },
  { id: 'p029', date: d(11), bloggerId: 'b15', brandId: 'dm', category: 'Брови', product: 'DM Brow Fix',               tool: 'Свайп',          platform: 'Instagram', link: '', status: 'Запланировано' },
  { id: 'p030', date: d(25), bloggerId: 'b15', brandId: 'st', category: 'Лицо',  product: 'Stellary Foundation',       tool: 'Свайп',          platform: 'Instagram', link: '', status: 'Запланировано' },
  { id: 'p031', date: d(13), bloggerId: 'b16', brandId: 'vs', category: 'Глаза', product: 'VS Liner Cabaret',          tool: 'Посев',          platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p032', date: d(27), bloggerId: 'b16', brandId: 'lg', category: 'Губы',  product: 'LG Lip Gloss',              tool: 'Свайп',          platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p033', date: d(5),  bloggerId: 'b17', brandId: 'ad', category: 'Брови', product: 'AD Brow Kit',               tool: 'Посев',          platform: 'Instagram', link: '', status: 'Опубликовано' },
  { id: 'p034', date: d(14), bloggerId: 'b18', brandId: 'pf', category: 'Ногти', product: 'PF Nail Strengthener',      tool: 'Посев',          platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p035', date: d(7),  bloggerId: 'b19', brandId: 'ib', category: 'Лицо',  product: 'IB Bronzer',                tool: 'Посев',          platform: 'TikTok',    link: '', status: 'Запланировано' },
  { id: 'p036', date: d(20), bloggerId: 'b21', brandId: 'bb', category: 'Глаза', product: 'BB Mascara',                tool: 'Свайп',          platform: 'Instagram', link: '', status: 'Запланировано' },
  { id: 'p037', date: d(28), bloggerId: 'b22', brandId: 'vs', category: 'Лицо',  product: 'VS Foundation',             tool: 'Крупный блогер', platform: 'YouTube',   link: '', status: 'Запланировано' },
  { id: 'p038', date: d(26), bloggerId: 'b24', brandId: 'st', category: 'Брови', product: 'Stellary Brow Wax',         tool: 'Свайп',          platform: 'TikTok',    link: '', status: 'Запланировано' },
];

// ----------------------------------------------------------------------------
// Conflict detector
// Rules (derived from spec examples):
//   1. Same blogger + same day        → CONFLICT (any brand)
//   2. Same blogger + same category   → требуется ≥5 дней между размещениями
//   3. Same blogger + same brand      → требуется ≥7 дней
// Cancelled placements are ignored.
// Returns: { hasConflict: bool, reasons: [{against: placement, gap: int, required: int, kind: 'same-day'|'category'|'brand'}] }
// ----------------------------------------------------------------------------
const DAY_MS = 86400000;

function detectConflicts(target, allPlacements) {
  if (!target || target.status === 'Отменено') return { hasConflict: false, reasons: [] };
  const reasons = [];
  const tDate = Date.parse(target.date);
  for (const p of allPlacements) {
    if (!p || p.id === target.id) continue;
    if (p.bloggerId !== target.bloggerId) continue;
    if (p.status === 'Отменено') continue;
    const pDate = Date.parse(p.date);
    const gap = Math.abs(Math.round((tDate - pDate) / DAY_MS));

    if (gap === 0) {
      reasons.push({ against: p, gap, required: 1, kind: 'same-day' });
      continue;
    }
    if (p.brandId === target.brandId && gap < 7) {
      reasons.push({ against: p, gap, required: 7, kind: 'brand' });
      continue;
    }
    if (p.category === target.category && gap < 5) {
      reasons.push({ against: p, gap, required: 5, kind: 'category' });
      continue;
    }
  }
  return { hasConflict: reasons.length > 0, reasons };
}

function describeReason(reason, placements, bloggers) {
  const p = reason.against;
  const brand = BRAND_BY_ID[p.brandId];
  if (reason.kind === 'same-day') {
    return `В тот же день уже есть размещение для ${brand.name} (${p.category}, ${p.tool}).`;
  }
  if (reason.kind === 'brand') {
    return `${reason.gap} дн. назад уже было размещение для ${brand.name} — нужно ≥${reason.required} дней между размещениями одного бренда.`;
  }
  if (reason.kind === 'category') {
    return `${reason.gap} дн. назад уже снимал «${p.category}» для ${brand.name} — нужно ≥${reason.required} дней между размещениями одной категории.`;
  }
  return 'Конфликт';
}

// Quick shape helpers
function isoToday() { return d(13); } // pretend "today" is 13 May 2026 inside the prototype

// Date helpers
function parseISO(s) { return new Date(s + 'T00:00:00'); }
function fmtRu(s) {
  const dt = parseISO(s);
  return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`;
}
function fmtRuShort(s) {
  const dt = parseISO(s);
  return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}`;
}

// Expose
Object.assign(window, {
  BRANDS, BRAND_BY_ID, CATEGORIES, TOOLS, TOOL_SHORT, PLATFORMS, STATUSES, LEVELS,
  BLOGGERS, PLACEMENTS_SEED,
  detectConflicts, describeReason,
  parseISO, fmtRu, fmtRuShort, isoToday,
});
