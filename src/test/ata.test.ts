import { describe, it, expect } from "vitest";
import { weekEndingOn, daysInPeriod, monthOfPeriod, parseBR, consolidate, pctChange, trendFromCpl } from "@/lib/ata";

describe("ATA rules", () => {
  it("week of 23/10 is 17/10 to 23/10, 7 calendar days", () => {
    const w = weekEndingOn("2026-10-23");
    expect(w.start).toBe("2026-10-17");
    expect(daysInPeriod(w.start, w.end)).toBe(7);
  });
  it("week 27/10–02/11 belongs to October (majority of days)", () => {
    expect(monthOfPeriod("2026-10-27", "2026-11-02")).toBe("2026-10");
    expect(monthOfPeriod("2026-10-29", "2026-11-04")).toBe("2026-11");
  });
  it("parses Brazilian currency", () => {
    expect(parseBR("R$ 20,25")).toBe(20.25);
    expect(parseBR("1.234,56")).toBe(1234.56);
    expect(parseBR("15")).toBe(15);
    expect(parseBR("abc")).toBeNull();
  });
  it("consolidated CPL is weighted by leads, not a simple average", () => {
    const t = consolidate([{ leads: 10, cpl: 10 }, { leads: 30, cpl: 20 }]);
    expect(t.investment).toBe(700);
    expect(t.cpl).toBe(17.5);
  });
  it("no comparable history returns null", () => {
    expect(pctChange(10, null)).toBeNull();
    expect(trendFromCpl(15, 20)).toBe("melhora");
    expect(trendFromCpl(25, 20)).toBe("piora");
  });
});

import { previousPeriod, rowsInPeriod, periodSummary } from "@/lib/ata";
describe("períodos livres", () => {
  const r = (s: string, e: string, leads = 10, cpl = 2) => ({ id: s, client_id: "c", period_start: s, period_end: e, leads, cpl, notes: null });
  it("período anterior tem o mesmo tamanho", () => {
    expect(previousPeriod({ start: "2026-10-10", end: "2026-10-19" })).toEqual({ start: "2026-09-30", end: "2026-10-09" });
  });
  it("resultado conta quando a maioria dos dias cai no período", () => {
    const rows = [r("2026-10-13", "2026-10-19"), r("2026-10-18", "2026-10-24")];
    expect(rowsInPeriod(rows, { start: "2026-10-12", end: "2026-10-20" }).map((x) => x.id)).toEqual(["2026-10-13"]);
  });
  it("consolida vários resultados no período", () => {
    const s = periodSummary([r("2026-10-01", "2026-10-07", 10, 2), r("2026-10-08", "2026-10-14", 30, 4)], { start: "2026-10-01", end: "2026-10-14" });
    expect(s?.leads).toBe(40);
    expect(s?.cpl).toBe(3.5);
  });
});
