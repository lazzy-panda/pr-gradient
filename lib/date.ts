// Shared date utilities — work with YYYY-MM-DD strings as the canonical wire format.
// All DB Dates are stored as UTC midnight.

export function ymdToDate(ymd: string): Date {
  return new Date(ymd + "T00:00:00.000Z");
}

export function dateToYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function todayYmd(): string {
  return dateToYmd(new Date());
}

const RU_MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

export function fmtRu(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
}

export function fmtRuShort(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}.${m}`;
}

export function fmtRuMonthYear(year: number, month: number): string {
  const name = RU_MONTHS[month - 1];
  return `${name.charAt(0).toUpperCase() + name.slice(1)} ${year}`;
}
