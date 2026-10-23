import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { AppHeader, Empty, WeekNav } from "@/components/ata/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllClients, useManagers, useResultsFor, useSaveResult } from "@/lib/api";
import { brl, fmtDate, parseBR, weekEndingOn } from "@/lib/ata";
import { endOr, validatePeriod } from "@/lib/search";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gestor/$managerId/preencher")({
  validateSearch: validatePeriod,
  head: () => ({
    meta: [
      { title: "Preenchimento rápido — ATA" },
      { name: "description", content: "Registre leads e CPL de vários clientes do período em uma única tela." },
      { property: "og:title", content: "Preenchimento rápido — ATA" },
      { property: "og:description", content: "Registre leads e CPL de vários clientes do período em uma única tela." },
    ],
  }),
  component: BulkFill,
});

type Row = { leads: string; cpl: string };

function BulkFill() {
  const { managerId } = Route.useParams();
  const end = endOr(Route.useSearch().end);
  const navigate = useNavigate({ from: Route.fullPath });
  const managers = useManagers();
  const all = useAllClients();
  const clients = useMemo(() => (all.data ?? []).filter((c) => c.manager_id === managerId && !c.archived), [all.data, managerId]);
  const results = useResultsFor(clients.map((c) => c.id));
  const save = useSaveResult();
  const p = weekEndingOn(end);
  const existing = (cid: string) => results.data?.find((r) => r.client_id === cid && r.period_start === p.start && r.period_end === p.end);

  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const next: Record<string, Row> = {};
    for (const c of clients) {
      const e = existing(c.id);
      next[c.id] = { leads: e ? String(e.leads) : "", cpl: e ? e.cpl.toFixed(2).replace(".", ",") : "" };
    }
    setRows(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.data, clients.length, end]);

  const dirty = clients.filter((c) => {
    const r = rows[c.id]; const e = existing(c.id);
    if (!r || (!r.leads && !r.cpl)) return false;
    return !e || parseBR(r.leads) !== e.leads || parseBR(r.cpl) !== e.cpl;
  });
  const filled = clients.filter((c) => existing(c.id)).length;

  const saveAll = async () => {
    const bad = dirty.filter((c) => { const L = parseBR(rows[c.id].leads); return L == null || !Number.isInteger(L) || parseBR(rows[c.id].cpl) == null; });
    if (bad.length) return toast.error(`Confira os valores de: ${bad.map((c) => c.name).join(", ")}`);
    setSaving(true);
    let ok = 0;
    for (const c of dirty) {
      try {
        const e = existing(c.id);
        await save.mutateAsync({ id: e?.id, client_id: c.id, period_start: p.start, period_end: p.end, leads: parseBR(rows[c.id].leads)!, cpl: parseBR(rows[c.id].cpl)!, notes: e?.notes ?? null });
        ok++;
      } catch (err) { toast.error(`${c.name}: ${(err as Error).message}`); }
    }
    setSaving(false);
    if (ok) toast.success(`${ok} resultado(s) salvo(s).`);
  };

  const manager = managers.data?.find((m) => m.id === managerId);

  return (
    <div className="min-h-screen">
      <AppHeader>
        <Button onClick={saveAll} disabled={!dirty.length || saving} size="sm"><Save className="h-4 w-4" /> {saving ? "Salvando…" : `Salvar ${dirty.length || ""} alteraç${dirty.length === 1 ? "ão" : "ões"}`}</Button>
      </AppHeader>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link to="/gestor/$managerId" params={{ managerId }} search={{ end }} className="text-sm text-muted-foreground hover:text-foreground">← Painel de {manager?.name ?? "gestor"}</Link>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Preenchimento rápido</h1>
            <p className="text-sm text-muted-foreground num">{fmtDate(p.start)} a {fmtDate(p.end, true)} · {filled}/{clients.length} preenchidos</p>
          </div>
          <WeekNav end={end} onChange={(e) => navigate({ search: { end: e } })} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Use Tab para avançar entre os campos e Enter para salvar.</p>

        {all.isLoading || results.isLoading ? <Skeleton className="mt-6 h-60" /> : clients.length === 0 ? (
          <div className="mt-6"><Empty title="Nenhum cliente ativo nesta carteira." /></div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); saveAll(); }} className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid grid-cols-[1fr_6rem_8rem_6rem] gap-3 border-b border-border bg-muted px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-[1fr_8rem_9rem_8rem]">
              <span>Cliente</span><span>Leads</span><span>CPL (R$)</span><span>Situação</span>
            </div>
            {clients.map((c) => {
              const r = rows[c.id] ?? { leads: "", cpl: "" };
              const e = existing(c.id);
              const isDirty = dirty.includes(c);
              const L = parseBR(r.leads); const C = parseBR(r.cpl);
              return (
                <div key={c.id} className={cn("grid grid-cols-[1fr_6rem_8rem_6rem] items-center gap-3 border-b border-border px-4 py-2 last:border-0 sm:grid-cols-[1fr_8rem_9rem_8rem]", isDirty && "bg-accent")}>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.name}</div>
                    {L != null && C != null && <div className="num text-xs text-muted-foreground">Invest. {brl(L * C)}</div>}
                  </div>
                  <Input inputMode="numeric" aria-label={`Leads de ${c.name}`} value={r.leads} onChange={(ev) => setRows((s) => ({ ...s, [c.id]: { ...r, leads: ev.target.value } }))} />
                  <Input inputMode="decimal" aria-label={`CPL de ${c.name}`} placeholder="0,00" value={r.cpl} onChange={(ev) => setRows((s) => ({ ...s, [c.id]: { ...r, cpl: ev.target.value } }))} />
                  <span className="text-xs">
                    {isDirty ? <span className="font-medium text-primary">Não salvo</span> : e ? <span className="inline-flex items-center gap-1 text-success"><Check className="h-3 w-3" /> Preenchido</span> : <span className="text-muted-foreground">Pendente</span>}
                  </span>
                </div>
              );
            })}
            <button type="submit" className="hidden" />
          </form>
        )}
      </main>
    </div>
  );
}
