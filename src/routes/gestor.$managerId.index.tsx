import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, ClipboardList, Eye, Pencil, Plus, Search, TableProperties } from "lucide-react";
import { toast } from "sonner";
import { AppHeader, Delta, Empty, Stat, TrendBadge, WeekNav } from "@/components/ata/ui";
import { ClientDialog, ResultDialog } from "@/components/ata/dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAllClients, useManagers, useResultsFor, useSaveClient, type Client } from "@/lib/api";
import { brl, consolidate, daysInPeriod, fmtDate, int, pctChange, periodSummary, previousPeriod, trendFromCpl } from "@/lib/ata";
import { periodOr, validatePeriod } from "@/lib/search";

export const Route = createFileRoute("/gestor/$managerId/")({
  validateSearch: validatePeriod,
  head: () => ({
    meta: [
      { title: "Painel do gestor — ATA" },
      { name: "description", content: "Carteira de clientes, leads e CPL da semana selecionada." },
      { property: "og:title", content: "Painel do gestor — ATA" },
      { property: "og:description", content: "Carteira de clientes, leads e CPL da semana selecionada." },
    ],
  }),
  component: ManagerPage,
});

function ManagerPage() {
  const { managerId } = Route.useParams();
  const search = Route.useSearch();
  const cur = periodOr(search);
  const { start, end } = cur;
  const navigate = useNavigate({ from: Route.fullPath });
  const managers = useManagers();
  const allClients = useAllClients();
  const manager = managers.data?.find((m) => m.id === managerId);
  const mine = useMemo(() => (allClients.data ?? []).filter((c) => c.manager_id === managerId), [allClients.data, managerId]);
  const results = useResultsFor(mine.map((c) => c.id));
  const saveClient = useSaveClient();

  const [q, setQ] = useState("");
  const [fill, setFill] = useState<"todos" | "preenchido" | "pendente">("todos");
  const [perf, setPerf] = useState<"todos" | "melhora" | "estavel" | "piora" | "sem">("todos");
  const [showArchived, setShowArchived] = useState(false);
  const [clientDlg, setClientDlg] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [resultDlg, setResultDlg] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });

  const prev = previousPeriod(cur);
  const rows = results.data ?? [];
  const pick = (cid: string, p: { start: string; end: string }) =>
    periodSummary(rows.filter((r) => r.client_id === cid), p);

  const active = mine.filter((c) => !c.archived);
  const enriched = (showArchived ? mine : active).map((c) => {
    const a = pick(c.id, cur);
    const b = pick(c.id, prev);
    return { c, a, b, trend: trendFromCpl(a?.cpl ?? null, b?.cpl ?? null) };
  });
  const curRows = active.flatMap((c) => pick(c.id, cur)?.rows ?? []);
  const prevRows = active.flatMap((c) => pick(c.id, prev)?.rows ?? []);
  const T = consolidate(curRows);
  const P = consolidate(prevRows);
  const filledCount = active.filter((c) => pick(c.id, cur)).length;

  const visible = enriched.filter(({ c, a, trend }) =>
    c.name.toLowerCase().includes(q.toLowerCase()) &&
    (fill === "todos" || (fill === "preenchido" ? !!a : !a)) &&
    (perf === "todos" || trend === perf));

  const setPeriod = (p: { start: string; end: string }) => navigate({ search: p });

  if (managers.isLoading || allClients.isLoading) return <div className="min-h-screen"><AppHeader /><div className="mx-auto max-w-7xl p-6"><Skeleton className="h-40" /></div></div>;
  if (!manager) return <div className="min-h-screen"><AppHeader /><div className="mx-auto max-w-7xl p-6"><Empty title="Gestor não encontrado."><Link to="/" className="text-primary underline">Voltar ao início</Link></Empty></div></div>;

  return (
    <div className="min-h-screen">
      <AppHeader>
        <Button asChild variant="outline" size="sm">
          <Link to="/gestor/$managerId/preencher" params={{ managerId }} search={{ start, end }}><TableProperties className="h-4 w-4" /> Preenchimento rápido</Link>
        </Button>
        <Button size="sm" onClick={() => setClientDlg({ open: true, client: null })}><Plus className="h-4 w-4" /> Novo cliente</Button>
      </AppHeader>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Gestores</Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{manager.name}</h1>
            <p className="text-sm text-muted-foreground num">Período {fmtDate(cur.start)} a {fmtDate(cur.end, true)} · {daysInPeriod(cur.start, cur.end)} dias corridos</p>
          </div>
          <WeekNav start={start} end={end} onChange={setPeriod} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Clientes ativos" value={active.length} />
          <Stat label="Preenchidos" value={`${filledCount}/${active.length}`} hint={active.length - filledCount > 0 ? `${active.length - filledCount} pendente(s)` : "Tudo preenchido"} />
          <Stat label="Leads / mensagens" value={curRows.length ? int(T.leads) : "—"} delta={curRows.length ? <Delta pct={pctChange(T.leads, prevRows.length ? P.leads : null)} goodWhen="up" /> : undefined} hint={!curRows.length ? "Sem dados no período" : undefined} />
          <Stat label="CPL consolidado" value={T.cpl != null ? brl(T.cpl) : "—"} delta={T.cpl != null ? <Delta pct={pctChange(T.cpl, P.cpl)} goodWhen="down" /> : undefined} hint="Investimento ÷ leads" />
        </div>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={fill} onValueChange={(v) => setFill(v as typeof fill)}>
            <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todo preenchimento</SelectItem><SelectItem value="preenchido">Preenchidos</SelectItem><SelectItem value="pendente">Pendentes</SelectItem></SelectContent>
          </Select>
          <Select value={perf} onValueChange={(v) => setPerf(v as typeof perf)}>
            <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todo desempenho</SelectItem><SelectItem value="melhora">Melhora</SelectItem><SelectItem value="estavel">Estável</SelectItem><SelectItem value="piora">Piora</SelectItem><SelectItem value="sem">Sem comparação</SelectItem></SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><Switch checked={showArchived} onCheckedChange={setShowArchived} /> Mostrar arquivados</label>
        </div>

        <div className="mt-4">
          {results.isLoading ? <Skeleton className="h-40" /> : visible.length === 0 ? (
            <Empty title={mine.length ? "Nenhum cliente corresponde aos filtros." : "Nenhum cliente nesta carteira."}>
              {!mine.length && <Button className="mt-3" onClick={() => setClientDlg({ open: true, client: null })}><Plus className="h-4 w-4" /> Cadastrar cliente</Button>}
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map(({ c, a, b, trend }) => (
                <div key={c.id} className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{c.dot} {c.name}</div>
                      {c.archived && <span className="text-xs text-muted-foreground">Arquivado</span>}
                    </div>
                    {a ? <TrendBadge trend={trend} /> : <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-foreground">Pendente</span>}
                  </div>
                  {a ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div><div className="text-xs text-muted-foreground">Lead</div><div className="num text-xl font-semibold">{int(a.leads)}</div><Delta pct={pctChange(a.leads, b?.leads)} goodWhen="up" /></div>
                      <div><div className="text-xs text-muted-foreground">CPL</div><div className="num text-xl font-semibold">{brl(a.cpl)}</div><Delta pct={pctChange(a.cpl, b?.cpl)} goodWhen="down" /></div>
                    </div>
                  ) : <p className="mt-3 text-sm text-muted-foreground">Sem dados para este período.</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="secondary"><Link to="/cliente/$clientId" params={{ clientId: c.id }} search={{ start, end }}><Eye className="h-4 w-4" /> Dashboard</Link></Button>
                    <Button size="sm" variant={a ? "outline" : "default"} onClick={() => setResultDlg({ open: true, client: c })}><ClipboardList className="h-4 w-4" /> {a ? "Editar" : "Preencher"}</Button>
                    <Button size="icon" variant="ghost" className="ml-auto h-8 w-8" aria-label="Editar cliente" onClick={() => setClientDlg({ open: true, client: c })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={c.archived ? "Reativar" : "Arquivar"} onClick={async () => {
                      if (!c.archived && !confirm(`Arquivar ${c.name}? O histórico será mantido.`)) return;
                      try { await saveClient.mutateAsync({ id: c.id, manager_id: c.manager_id, name: c.name, start_date: c.start_date, notes: c.notes, archived: !c.archived }); toast.success(c.archived ? "Cliente reativado." : "Cliente arquivado."); } catch (e) { toast.error((e as Error).message); }
                    }}>{c.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <ClientDialog open={clientDlg.open} onOpenChange={(o) => setClientDlg((s) => ({ ...s, open: o }))} managerId={managerId} client={clientDlg.client} existing={allClients.data ?? []} />
      <ResultDialog open={resultDlg.open} onOpenChange={(o) => setResultDlg((s) => ({ ...s, open: o }))} client={resultDlg.client} results={rows} defaultEnd={end} />
    </div>
  );
}
