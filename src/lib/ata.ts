// Pure ATA business rules: periods, money parsing, consolidation.
export type Result = {
  id: string;
  client_id: string;
  period_start: string; // YYYY-MM-DD
  period_end: string;
  leads: number;
  cpl: number;
  notes: string | null;
};

const DAY = 86400000;

export function toISO(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function addDays(iso: string, n: number): string {
  return toISO(new Date(fromISO(iso).getTime() + n * DAY));
}
export function todayISO(): string {
  const now = new Date();
  return toISO(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** Weekly period = 7 consecutive calendar days ending on `end` (both inclusive). */
export function weekEndingOn(end: string): { start: string; end: string } {
  return { start: addDays(end, -6), end };
}
export function daysInPeriod(start: string, end: string): number {
  return Math.round((fromISO(end).getTime() - fromISO(start).getTime()) / DAY) + 1;
}

/**
 * Month attribution rule: a period belongs entirely to the month that contains
 * most of its days (ties go to the month of the end date). No daily split is invented.
 */
export function monthOfPeriod(start: string, end: string): string {
  const counts = new Map<string, number>();
  let d = start;
  while (d <= end) {
    const k = d.slice(0, 7);
    counts.set(k, (counts.get(k) ?? 0) + 1);
    d = addDays(d, 1);
  }
  let best = end.slice(0, 7);
  let bestN = counts.get(best) ?? 0;
  for (const [k, n] of counts) if (n > bestN) { best = k; bestN = n; }
  return best;
}
export function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return toISO(d).slice(0, 7);
}

/** Parse Brazilian-formatted numbers: "20,25", "1.234,56", "R$ 20,25", "15". */
export function parseBR(input: string): number | null {
  const s = input.replace(/R\$|\s/g, "").trim();
  if (!s) return null;
  let norm = s;
  if (s.includes(",")) norm = s.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(norm)) return null;
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const int = (n: number) => n.toLocaleString("pt-BR");
export function fmtDate(iso: string, withYear = false) {
  const [y, m, d] = iso.split("-");
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}
const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
export function fmtMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} de ${y}`;
}

export const investment = (r: Pick<Result, "leads" | "cpl">) => r.leads * r.cpl;

export type Totals = { leads: number; investment: number; cpl: number | null; count: number };
/** Consolidated CPL = sum of estimated investment / sum of leads (never a simple CPL average). */
export function consolidate(rows: Pick<Result, "leads" | "cpl">[]): Totals {
  const leads = rows.reduce((a, r) => a + r.leads, 0);
  const inv = rows.reduce((a, r) => a + investment(r), 0);
  return { leads, investment: inv, cpl: leads > 0 ? inv / leads : null, count: rows.length };
}

/** Percent change; null when there is no comparable history. */
export function pctChange(cur: number | null | undefined, prev: number | null | undefined): number | null {
  if (cur == null || prev == null || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

export type Trend = "melhora" | "estavel" | "piora" | "sem";
/** Performance trend is driven by CPL (lower = better), ±5% is considered stable. */
export function trendFromCpl(cur: number | null, prev: number | null): Trend {
  const p = pctChange(cur, prev);
  if (p == null) return "sem";
  if (p <= -5) return "melhora";
  if (p >= 5) return "piora";
  return "estavel";
}

export function findPeriod<T extends Pick<Result, "period_start" | "period_end">>(rows: T[], start: string, end: string) {
  return rows.find((r) => r.period_start === start && r.period_end === end);
}
