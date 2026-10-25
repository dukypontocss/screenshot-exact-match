import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, Maximize2, Minimize2, Pencil, Trash2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { toast } from "sonner";
import { AppHeader, Delta, Empty, Stat, TrendBadge, WeekNav } from "@/components/ata/ui";
import { ResultDialog } from "@/components/ata/dialogs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAllClients, useDeleteResult, useManagers, useResultsFor, useSaveResult } from "@/lib/api";
import {
  addDays, brl, consolidate, fmtDate, fmtMonth, int, investment, monthOfPeriod, pctChange, shiftMonth,
  trendFromCpl, previousPeriod, periodSummary, type Result,
} from "@/lib/ata";
import { periodOr } from "@/lib/search";
import { cn } from "@/lib/utils";

type S = { start?: string | undefined; end?: string | undefined; view?: "semana" | "mes" | undefined; month?: string | undefined; present?: boolean | undefined };

export const Route = createFileRoute("/cliente/$clientId")({
  validateSearch: (q: Record<string, unknown>): S => { const s = q as { end?: unknown; view?: unknown; month?: unknown; present?: unknown }; return {
    start: typeof (q as { start?: unknown }).start === "string" && /^\d{4}-\d{2}-\d{2}$/.test((q as { start: string }).start) ? (q as { start: string }).start : undefined,
    end: typeof s.end === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.end) ? s.end : undefined,
    view: s.view === "mes" ? "mes" : undefined,
    month: typeof s.month === "string" && /^\d{4}-\d{2}$/.test(s.month) ? s.month : undefined,
    present: s.present === true || s.present === "true" ? true : undefined,
  }; },
  head: () => ({
    meta: [
      { title: "Dashboard do cliente — ATA" },
      { name: "description", content: "Leads, CPL, histórico semanal e consolidado mensal do cliente." },
      { property: "og:title", content: "Dashboard do cliente — ATA" },
      { property: "og:description", content: "Leads, CPL, histórico semanal e consolidado mensal do cliente." },
    ],
  }),
  component: ClientPage,
});

const axisTick = { fontSize: 12, fill: "var(--muted-foreground)" };
const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 };

function ClientPage() {
  const { clientId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const cur = periodOr(search);
  const { start, end } = cur;
  const view = search.view ?? "semana";
  const present = !!search.present;
  const all = useAllClients();
  const managers = useManagers();
  const client = all.data?.find((c) => c.id === clientId);
  const manager = managers.data?.find((m) => m.id === client?.manager_id);
  const siblings = useMemo(() => (all.data ?? []).filter((c) => c.manager_id === client?.manager_id && !c.archived), [all.data, client?.manager_id]);
  const results = useResultsFor(client ? [client.id] : []);
  const rows = useMemo(() => [...(results.data ?? [])].sort((a, b) => a.period_start.localeCompare(b.period_start)), [results.data]);
  const [dlg, setDlg] = useState<{ open: boolean; initial: Result | null }>({ open: false, initial: null });
  const del = useDeleteResult();

  const prevP = previousPeriod(cur);
  const A = periodSummary(rows, cur);
  const B = periodSummary(rows, prevP);
  const a = A?.rows.length === 1 ? A.rows[0] : rows.find((r) => r.period_start === cur.start && r.period_end === cur.end);
  const month = search.month ?? monthOfPeriod(cur.start, cur.end);
  const inMonth = rows.filter((r) => monthOfPeriod(r.period_start, r.period_end) === month);
  const inPrevMonth = rows.filter((r) => monthOfPeriod(r.period_start, r.period_end) === shiftMonth(month, -1));
  const M = consolidate(inMonth);
  const PM = consolidate(inPrevMonth);

  const idx = siblings.findIndex((c) => c.id === clientId);
  const prevClient = idx > 0 ? siblings[idx - 1] : null;
  const nextClient = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const go = (patch: Partial<S>) => navigate({ search: (s: S) => ({ ...s, ...patch }) });

  const chartData = (view === "mes" ? inMonth : rows.slice(-12)).map((r) => ({
    label: fmtDate(r.period_end), leads: r.leads, cpl: Number(r.cpl.toFixed(2)),
  }));

  useEffect(() => {
    if (!present) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      if (e.key === "Escape") go({ present: undefined });
      if (e.key === "ArrowRight" && nextClient) navigate({ to: "/cliente/$clientId", params: { clientId: nextClient.id }, search: (s: S) => s });
      if (e.key === "ArrowLeft" && prevClient) navigate({ to: "/cliente/$clientId", params: { clientId: prevClient.id }, search: (s: S) => s });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (all.isLoading) return <div className="min-h-screen"><AppHeader /><div className="mx-auto max-w-7xl p-6"><Skeleton className="h-60" /></div></div>;
  if (!client) return <div className="min-h-screen"><AppHeader /><div className="mx-auto max-w-7xl p-6"><Empty title="Cliente não encontrado."><Link to="/" className="text-primary underline">Voltar ao início</Link></Empty></div></div>;

  const clientNav = (
    <div className="flex items-center gap-1">
      <Button asChild={!!prevClient} variant="outline" size="sm" disabled={!prevClient}>
        {prevClient ? <Link to="/cliente/$clientId" params={{ clientId: prevClient.id }} search={(s: S) => s}><ChevronLeft className="h-4 w-4" /> <span className="hidden max-w-28 truncate sm:inline">{prevClient.name}</span></Link> : <span><ChevronLeft className="h-4 w-4" /></span>}
      </Button>
      <span className="px-1 text-xs text-muted-foreground num">{idx + 1}/{siblings.length}</span>
      <Button asChild={!!nextClient} variant="outline" size="sm" disabled={!nextClient}>
        {nextClient ? <Link to="/cliente/$clientId" params={{ clientId: nextClient.id }} search={(s: S) => s}><span className="hidden max-w-28 truncate sm:inline">{nextClient.name}</span> <ChevronRight className="h-4 w-4" /></Link> : <span><ChevronRight className="h-4 w-4" /></span>}
      </Button>
    </div>
  );

  const periodControls = (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs value={view} onValueChange={(v) => go({ view: v === "mes" ? "mes" : undefined, month: undefined })}>
        <TabsList><TabsTrigger value="semana">Semanal</TabsTrigger><TabsTrigger value="mes">Mensal</TabsTrigger></TabsList>
      </Tabs>
      {view === "semana" ? <WeekNav start={start} end={end} onChange={(np) => go({ ...np, month: undefined })} /> : (
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Mês anterior" onClick={() => go({ month: shiftMonth(month, -1) })}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-2 text-sm font-medium">{fmtMonth(month)}</span>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Próximo mês" onClick={() => go({ month: shiftMonth(month, 1) })}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );

  const trend = trendFromCpl(A?.cpl ?? null, B?.cpl ?? null);

  return (
    <div className={cn("min-h-screen", present && "bg-card")}>
      {present ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-8">
          <span className="text-sm font-bold tracking-tight text-primary">ATA</span>
          <div className="flex flex-wrap items-center gap-2">{periodControls}{clientNav}
            <Button size="sm" variant="ghost" onClick={() => go({ present: undefined })}><Minimize2 className="h-4 w-4" /> Sair</Button>
          </div>
        </div>
      ) : (
        <AppHeader>
          {clientNav}
          <Button size="sm" variant="outline" onClick={() => go({ present: true })}><Maximize2 className="h-4 w-4" /> Apresentar</Button>
          <Button size="sm" onClick={() => setDlg({ open: true, initial: a ?? null })}><ClipboardList className="h-4 w-4" /> {a ? "Editar semana" : "Preencher semana"}</Button>
        </AppHeader>
      )}

      <main className={cn("mx-auto px-4 py-8 sm:px-6", present ? "max-w-6xl sm:px-8" : "max-w-7xl")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {!present && manager && <Link to="/gestor/$managerId" params={{ managerId: manager.id }} search={{ start, end }} className="text-sm text-muted-foreground hover:text-foreground">← {manager.name}</Link>}
            <h1 className={cn("mt-1 font-bold tracking-tight", present ? "text-4xl sm:text-5xl" : "text-3xl")}>{client.dot} {client.name}</h1>
            <p className="mt-1 text-muted-foreground num">
              {manager?.name} · {view === "semana" ? `${fmtDate(cur.start)} a ${fmtDate(cur.end, true)}` : fmtMonth(month)}
            </p>
          </div>
          {!present && periodControls}
        </div>

        {results.isLoading ? <Skeleton className="mt-6 h-40" /> : view === "semana" ? (
          <>
            {A ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat big={present} label="Lead" value={int(A.leads)} delta={<Delta pct={pctChange(A.leads, B?.leads)} goodWhen="up" />} />
                <Stat big={present} label="CPL" value={brl(A.cpl)} delta={<Delta pct={pctChange(A.cpl, B?.cpl)} goodWhen="down" />} />
                <Stat big={present} label="Investimento estimado" value={brl(A.leads * A.cpl)} hint={<span className="flex items-center gap-2">Leads × CPL <TrendBadge trend={trend} /></span>} />
              </div>
            ) : (
              <div className="mt-6"><Empty title="Sem dados registrados para este período.">
                A ausência é sinalizada e não é contada como zero.
                {!present && <div><Button className="mt-3" onClick={() => setDlg({ open: true, initial: null })}>Preencher agora</Button></div>}
              </Empty></div>
            )}
          </>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat big={present} label="Leads no mês" value={inMonth.length ? int(M.leads) : "—"} delta={inMonth.length ? <Delta pct={pctChange(M.leads, inPrevMonth.length ? PM.leads : null)} goodWhen="up" /> : undefined} />
              <Stat big={present} label="CPL consolidado" value={M.cpl != null ? brl(M.cpl) : "—"} delta={M.cpl != null ? <Delta pct={pctChange(M.cpl, PM.cpl)} goodWhen="down" /> : undefined} />
              <Stat big={present} label="Investimento estimado" value={inMonth.length ? brl(M.investment) : "—"} hint={`${inMonth.length} semana(s) registrada(s)`} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Regra: cada semana é atribuída por inteiro ao mês que contém a maioria dos seus dias. Não há divisão diária, pois os registros são semanais. CPL consolidado = investimento estimado ÷ leads.
            </p>
          </>
        )}

        {chartData.length > 0 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Evolução dos leads">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [int(v), "Leads"]} />
                <Bar dataKey="leads" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="Evolução do CPL">
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [brl(v), "CPL"]} />
                <Line dataKey="cpl" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ChartCard>
          </div>
        )}

        {view === "semana" && a && <NotesCard result={a} key={a.id} />}

        {!present && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Histórico semanal</h2>
            {rows.length === 0 ? <div className="mt-3"><Empty title="Nenhum registro ainda." /></div> : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr><th className="px-4 py-2">Período</th><th className="px-4 py-2">Mês</th><th className="px-4 py-2 text-right">Leads</th><th className="px-4 py-2 text-right">CPL</th><th className="px-4 py-2 text-right">Investimento</th><th className="px-4 py-2" /></tr>
                  </thead>
                  <tbody>
                    {[...rows].reverse().map((r) => (
                      <tr key={r.id} className={cn("border-t border-border", A?.rows.some((x) => x.id === r.id) && "bg-accent")}>
                        <td className="px-4 py-2 num"><button className="hover:underline" onClick={() => go({ end: r.period_end, view: undefined, month: undefined })}>{fmtDate(r.period_start)} – {fmtDate(r.period_end, true)}</button></td>
                        <td className="px-4 py-2 text-muted-foreground">{fmtMonth(monthOfPeriod(r.period_start, r.period_end))}</td>
                        <td className="px-4 py-2 text-right num">{int(r.leads)}</td>
                        <td className="px-4 py-2 text-right num">{brl(r.cpl)}</td>
                        <td className="px-4 py-2 text-right num">{brl(investment(r))}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Editar" onClick={() => setDlg({ open: true, initial: r })}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Excluir" onClick={async () => {
                            if (!confirm(`Excluir o registro de ${fmtDate(r.period_start)} a ${fmtDate(r.period_end)}?`)) return;
                            try { await del.mutateAsync(r.id); toast.success("Registro excluído."); } catch (e) { toast.error((e as Error).message); }
                          }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
      <ResultDialog open={dlg.open} onOpenChange={(o) => setDlg((s) => ({ ...s, open: o }))} client={client} results={rows} defaultEnd={end} defaultStart={start} initial={dlg.initial} />
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 text-sm font-medium">{title}</div>
      <div className="h-56"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>
    </div>
  );
}

function NotesCard({ result }: { result: Result }) {
  const save = useSaveResult();
  const [v, setV] = useState(result.notes ?? "");
  const changed = v !== (result.notes ?? "");
  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-4">
      <div className="mb-2 text-sm font-medium">Observações da reunião</div>
      <Textarea value={v} onChange={(e) => setV(e.target.value)} placeholder="Pontos importantes desta semana" rows={3} />
      {changed && (
        <Button size="sm" className="mt-2" disabled={save.isPending} onClick={async () => {
          try { await save.mutateAsync({ ...result, notes: v.trim() || null }); toast.success("Observações salvas."); } catch (e) { toast.error((e as Error).message); }
        }}>Salvar observações</Button>
      )}
    </div>
  );
}
