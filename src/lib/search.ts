import { todayISO } from "./ata";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export type PeriodSearch = { end?: string | undefined };
export function validatePeriod(s: Record<string, unknown>): PeriodSearch {
  const e = s["end"];
  return typeof e === "string" && ISO.test(e) ? { end: e } : {};
}
export const endOr = (end?: string) => end ?? todayISO();
