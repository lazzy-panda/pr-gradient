// Overview roadmap data — Excel sheet "Общая"
// Static defaults for the 2026 planning matrix. The OverviewView keeps a
// mutable copy in local state so the user can add/edit/delete launches in-session.

export interface OverviewMonth {
  key: string;
  label: string;
  short: string;
}

export const OVERVIEW_MONTHS: readonly OverviewMonth[] = [
  { key: "jan", label: "Январь",   short: "Янв" },
  { key: "feb", label: "Февраль",  short: "Фев" },
  { key: "mar", label: "Март",     short: "Мар" },
  { key: "apr", label: "Апрель",   short: "Апр" },
  { key: "may", label: "Май",      short: "Май" },
  { key: "jun", label: "Июнь",     short: "Июн" },
  { key: "jul", label: "Июль",     short: "Июл" },
  { key: "aug", label: "Август",   short: "Авг" },
  { key: "sep", label: "Сентябрь", short: "Сен" },
  { key: "oct", label: "Октябрь",  short: "Окт" },
  { key: "nov", label: "Ноябрь",   short: "Ноя" },
  { key: "dec", label: "Декабрь",  short: "Дек" },
] as const;

export const OVERVIEW_YEAR = 2026;

export const OVERVIEW_MONTH_INDEX: Record<string, number> = OVERVIEW_MONTHS.reduce(
  (acc, m, i) => ({ ...acc, [m.key]: i + 1 }),
  {} as Record<string, number>,
);

export interface OverviewCategory {
  id: string;
  label: string;
  sub: string;
}

export const OVERVIEW_CATEGORIES: readonly OverviewCategory[] = [
  { id: "eyes",  label: "Глаза",     sub: "ГЛАЗА" },
  { id: "lips",  label: "Губы",      sub: "ГУБЫ" },
  { id: "face",  label: "Лицо",      sub: "ЛИЦО" },
  { id: "brows", label: "Брови",     sub: "БРОВИ" },
  { id: "coll",  label: "Коллекции", sub: "И ДРУГОЕ" },
  { id: "excl",  label: "Эксклюзив", sub: "ЗОЛОТОЕ ЯБЛОКО" },
  { id: "care",  label: "Уход",      sub: "SKINCARE" },
] as const;

export type OverviewStatus = "plan" | "priority" | "seeding";

export interface OverviewStatusMeta {
  label: string;
  hint: string;
  bg: string;
  ink: string;
  border: string;
  dot: string;
}

export const OVERVIEW_STATUSES: Record<OverviewStatus, OverviewStatusMeta> = {
  plan:     { label: "Жёлтый", hint: "плановый запуск",         bg: "#FFF2CC", ink: "#7A5A05", border: "#E8D27A", dot: "#B8860B" },
  priority: { label: "Мятный", hint: "приоритетный/выделенный", bg: "#D9EAD3", ink: "#1F5132", border: "#A6CBA0", dot: "#1F5132" },
  seeding:  { label: "Пурпур", hint: "только рассылка",         bg: "#FCD9F4", ink: "#7E1F71", border: "#E891D4", dot: "#C2229D" },
};

export interface OverviewItem {
  months: string[];     // contiguous month keys, e.g. ['may','jun']
  product: string;
  status: OverviewStatus;
}

export interface OverviewTrack {
  id: string;
  category: string;     // OVERVIEW_CATEGORIES[].id
  brandCode: string;    // Brand.code, e.g. "VIVIENNE_SABO"
  label?: string;       // override displayed name (e.g. "IB · 2-я линия")
  items: OverviewItem[];
}

// Default 2026 roadmap, extracted from the Excel sheet "Общая".
export const OVERVIEW_TRACKS_DEFAULT: readonly OverviewTrack[] = [
  // ─── ГЛАЗА ───────────────────────────────────────────────────────
  { id: "t01", category: "eyes", brandCode: "VIVIENNE_SABO", items: [
    { months: ["jul","aug"], product: "Туши Feerique",    status: "plan" },
    { months: ["nov"],       product: "Туши Fantastique", status: "priority" },
  ]},
  { id: "t02", category: "eyes", brandCode: "STELLARY", items: [
    { months: ["jun","jul"], product: "Туши Lash Totem",  status: "plan" },
  ]},
  { id: "t03", category: "eyes", brandCode: "INFLUENCE_BEAUTY", items: [
    { months: ["may"], product: "Гель для бровей экскл ЗЯ",            status: "plan" },
    { months: ["jul"], product: "Карандаши Neochrome",                 status: "plan" },
    { months: ["nov"], product: "Тушь с необычной щёточкой Lashtrix",  status: "plan" },
  ]},
  { id: "t04", category: "eyes", brandCode: "BEAUTY_BOMB", items: [
    { months: ["apr"], product: "Палетки двушки", status: "plan" },
  ]},
  { id: "t05", category: "eyes", brandCode: "LOVE_GENERATION", items: [
    { months: ["apr"], product: "Туши Tentacle", status: "seeding" },
  ]},

  // ─── ГУБЫ ────────────────────────────────────────────────────────
  { id: "t06", category: "lips", brandCode: "VIVIENNE_SABO", items: [
    { months: ["may","jun"], product: "Муссовые помады MUSE", status: "priority" },
    { months: ["jul"],       product: "Блески Jam",           status: "plan" },
  ]},
  { id: "t07", category: "lips", brandCode: "STELLARY", items: [
    { months: ["may","jun"], product: "Блески Big Lips и Масла", status: "plan" },
  ]},
  { id: "t08", category: "lips", brandCode: "INFLUENCE_BEAUTY", items: [
    { months: ["may","jun"], product: "Блеск для губ Metamorphix", status: "priority" },
    { months: ["jul","aug"], product: "Бальзам Glow Injection",    status: "plan" },
    { months: ["oct"],       product: "Бальзам для губ (6 СКЮ)",   status: "plan" },
  ]},
  { id: "t09", category: "lips", brandCode: "BEAUTY_BOMB", items: [
    { months: ["apr"], product: "Блеск для губ Glow up", status: "plan" },
  ]},
  { id: "t10", category: "lips", brandCode: "LOVE_GENERATION", items: [
    { months: ["apr"], product: "Блески Gimme More (просто рассылка)", status: "seeding" },
  ]},

  // ─── ЛИЦО ────────────────────────────────────────────────────────
  { id: "t11", category: "face", brandCode: "VIVIENNE_SABO", items: [
    { months: ["apr"], product: "Тон Coverture", status: "plan" },
  ]},
  { id: "t12", category: "face", brandCode: "STELLARY", items: [
    { months: ["apr"], product: "СС-крем", status: "priority" },
  ]},
  { id: "t13", category: "face", brandCode: "INFLUENCE_BEAUTY", items: [
    { months: ["may"], product: "Хайлайтер экскл ЗЯ",                          status: "plan" },
    { months: ["sep"], product: "Спрей-фиксатор Matte / Hydra / HYPERFIX",     status: "plan" },
    { months: ["oct"], product: "Консилер кремовый Ultra Eraser + 2 новых СКЮ", status: "plan" },
  ]},
  { id: "t14", category: "face", brandCode: "INFLUENCE_BEAUTY", label: "IB · 2-я линия", items: [
    { months: ["oct"], product: "Тональный крем Skinnovation Hydra", status: "priority" },
  ]},
  { id: "t15", category: "face", brandCode: "LOVE_GENERATION", items: [
    { months: ["apr"], product: "Тон Not Just Baby Face (просто рассылка)", status: "seeding" },
  ]},

  // ─── БРОВИ ───────────────────────────────────────────────────────
  { id: "t16", category: "brows", brandCode: "LOVE_GENERATION", items: [
    { months: ["apr"], product: "Гель для бровей Busy Love", status: "seeding" },
  ]},

  // ─── КОЛЛЕКЦИИ ───────────────────────────────────────────────────
  { id: "t17", category: "coll", brandCode: "VIVIENNE_SABO", items: [
    { months: ["may"], product: "Коллекция Riviera", status: "plan" },
    { months: ["nov"], product: "Коллекция",         status: "plan" },
    { months: ["dec"], product: "Коллекция",         status: "plan" },
  ]},
  { id: "t18", category: "coll", brandCode: "INFLUENCE_BEAUTY", items: [
    { months: ["nov"], product: "КОЛЛЕКЦИЯ 2026 Юбилейная Coherence", status: "priority" },
  ]},
  { id: "t19", category: "coll", brandCode: "INFLUENCE_BEAUTY", label: "IB · Hydrogenesis", items: [
    { months: ["may","jun"], product: "Hydrogenesis", status: "plan" },
  ]},
  { id: "t20", category: "coll", brandCode: "BEAUTY_BOMB", items: [
    { months: ["may"], product: "BBLand",     status: "plan" },
    { months: ["aug"], product: "Смешарики",  status: "priority" },
  ]},

  // ─── ЭКСКЛЮЗИВ (ЗЯ) ─────────────────────────────────────────────
  { id: "t21", category: "excl", brandCode: "ARTDECO", items: [
    { months: ["apr"], product: "Мозаика: футляр + тени · румяна · помады · тушь", status: "plan" },
  ]},
  { id: "t22", category: "excl", brandCode: "DEBORAH_MILANO", items: [
    { months: ["apr"], product: "Помада Milano Red + автоматический карандаш", status: "plan" },
  ]},
  { id: "t23", category: "excl", brandCode: "PHYSICIANS_FORMULA", items: [
    { months: ["apr"],       product: "Мультистик для лица Glow & Go",          status: "plan" },
    { months: ["may","jun"], product: "Glow & Go + Healthy тональная основа",   status: "plan" },
  ]},

  // ─── УХОД ────────────────────────────────────────────────────────
  { id: "t24", category: "care", brandCode: "VIVIENNE_SABO", label: "Vivienne Sabó Skincare", items: [] },
  { id: "t25", category: "care", brandCode: "STELLARY", label: "Stellary Skincare", items: [
    { months: ["jun"], product: "УР: мицеллярный тоник и пенка", status: "plan" },
  ]},
] as const;

export interface OverviewSupportRule {
  id: string;
  label: string;
  detail: string;
  status: OverviewStatus;
}

export const OVERVIEW_SUPPORT_RULES: readonly OverviewSupportRule[] = [
  { id: "big",  label: "Крупная поддержка",   detail: "2 ролика между разноплановыми категориями", status: "priority" },
  { id: "sm",   label: "Маленькая поддержка", detail: "5–7 роликов между смежными категориями",     status: "plan" },
] as const;

// Build contiguous month keys starting at `startKey`, length `span`, clamped to the year.
export function spanMonths(startKey: string, span: number): string[] {
  const startIdx = OVERVIEW_MONTHS.findIndex((m) => m.key === startKey);
  if (startIdx < 0) return [startKey];
  const out: string[] = [];
  for (let i = 0; i < span; i++) {
    const m = OVERVIEW_MONTHS[startIdx + i];
    if (m) out.push(m.key);
  }
  return out;
}
