import { addDays, todayISO, type Period } from "./ata";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export type PeriodSearch = { start?: string | undefined; end?: string | undefined };
export function validatePeriod(s: Record<string, unknown>): PeriodSearch {
  const out: PeriodSearch = {};
  const e = s["end"], st = s["start"];
  if (typeof e === "string" && ISO.test(e)) out.end = e;
  if (typeof st === "string" && ISO.test(st)) out.start = st;
  return out;
}
export const endOr = (end?: string) => end ?? todayISO();
/** Period from URL: free start/end; defaults to the 7 days ending on `end` (or today). */
export function periodOr(s: PeriodSearch): Period {
  const end = endOr(s.end);
  const start = s.start && s.start <= end ? s.start : addDays(end, -6);
  return { start, end };
}
