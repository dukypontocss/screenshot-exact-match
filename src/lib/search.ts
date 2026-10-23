import { todayISO } from "./ata";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export type PeriodSearch = { end?: string };
export function validatePeriod(s: Record<string, unknown>): PeriodSearch {
  return typeof s.end === "string" && ISO.test(s.end) ? { end: s.end } : {};
}
export const endOr = (end?: string) => end ?? todayISO();
