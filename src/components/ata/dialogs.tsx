import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSaveClient, useSaveResult, type Client } from "@/lib/api";
import { brl, daysInPeriod, findPeriod, int, parseBR, weekEndingOn, todayISO, type Result } from "@/lib/ata";

export const DOTS = ["🔵", "🟠", "⚪", "🟢", "🔴", "🟡", "🟣", "🟤", "⚫"];

export function ClientDialog({
  open, onOpenChange, managerId, client, existing,
}: { open: boolean; onOpenChange: (o: boolean) => void; managerId: string; client?: Client | null; existing: Client[] }) {
  const save = useSaveClient();
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [dot, setDot] = useState("🔵");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (open) { setDot(client?.dot ?? "🔵"); setName(client?.name ?? ""); setStart(client?.start_date ?? ""); setNotes(client?.notes ?? ""); }
  }, [open, client]);

  const submit = async () => {
    const n = name.trim();
    if (!n) return void toast.error("Informe o nome do cliente.");
    const dup = existing.find((c) => c.manager_id === managerId && c.id !== client?.id && c.name.trim().toLowerCase() === n.toLowerCase());
    if (dup) return void toast.error(`Já existe um cliente "${dup.name}" nesta carteira${dup.archived ? " (arquivado)" : ""}.`);
    try {
      await save.mutateAsync({ id: client?.id, manager_id: managerId, name: n, start_date: start || null, notes: notes.trim() || null, dot });
      toast.success(client ? "Cliente atualizado." : "Cliente cadastrado.");
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5"><Label htmlFor="cn">Nome do cliente</Label><Input id="cn" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
          <div className="grid gap-1.5"><Label>Cor da bolinha</Label><div className="flex flex-wrap gap-1">{DOTS.map((d) => <button key={d} type="button" onClick={() => setDot(d)} aria-label={`Cor ${d}`} className={`grid h-9 w-9 place-items-center rounded-md border text-lg ${dot === d ? "border-primary ring-2 ring-ring" : "border-border"}`}>{d}</button>)}</div></div>
          <div className="grid gap-1.5"><Label htmlFor="cs">Início do acompanhamento (opcional)</Label><Input id="cs" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label htmlFor="co">Observações (opcional)</Label><Textarea id="co" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ResultDialog({
  open, onOpenChange, client, results, defaultEnd, initial,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; client: Client | null; results: Result[];
  defaultEnd: string; initial?: Result | null;
}) {
  const save = useSaveResult();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [leads, setLeads] = useState("");
  const [cpl, setCpl] = useState("");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<Result | null>(null);

  const loadFor = (s: string, e: string) => {
    const ex = client ? findPeriod(results.filter((r) => r.client_id === client.id), s, e) : undefined;
    setEditing(ex ?? null);
    setLeads(ex ? String(ex.leads) : "");
    setCpl(ex ? ex.cpl.toFixed(2).replace(".", ",") : "");
    setNotes(ex?.notes ?? "");
  };

  useEffect(() => {
    if (!open) return;
    const p = initial ? { start: initial.period_start, end: initial.period_end } : weekEndingOn(defaultEnd || todayISO());
    setStart(p.start); setEnd(p.end); loadFor(p.start, p.end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id, initial?.id, defaultEnd]);

  const conflict = client && start && end ? findPeriod(results.filter((r) => r.client_id === client.id), start, end) : undefined;
  const isConflict = conflict && conflict.id !== editing?.id;
  const L = parseBR(leads);
  const C = parseBR(cpl);
  const days = start && end && end >= start ? daysInPeriod(start, end) : 0;

  const submit = async () => {
    if (!client) return;
    if (!start || !end || end < start) return void toast.error("Período inválido.");
    if (L == null || !Number.isInteger(L)) return void toast.error("Leads deve ser um número inteiro.");
    if (C == null) return void toast.error("CPL inválido. Use o formato 20,25.");
    if (isConflict) return void toast.error("Já existe um registro para esse período.");
    try {
      await save.mutateAsync({ id: editing?.id, client_id: client.id, period_start: start, period_end: end, leads: L, cpl: C, notes: notes.trim() || null });
      toast.success(editing ? "Resultado atualizado." : "Resultado registrado.");
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar resultado" : "Registrar resultado"}</DialogTitle>
          <DialogDescription>{client?.name}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="ps">Início</Label>
              <Input id="ps" type="date" value={start} onChange={(e) => { setStart(e.target.value); loadFor(e.target.value, end); }} /></div>
            <div className="grid gap-1.5"><Label htmlFor="pe">Fim</Label>
              <Input id="pe" type="date" value={end} onChange={(e) => {
                const v = e.target.value; if (!v) return; const w = weekEndingOn(v); setEnd(v); setStart(w.start); loadFor(w.start, v);
              }} /></div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            {days} {days === 1 ? "dia corrido" : "dias corridos"}{days !== 7 && days > 0 ? " — atenção: o padrão é 7 dias" : ""}. Alterar o fim recalcula o início para 7 dias.
          </p>
          {isConflict && (
            <div className="flex items-center justify-between gap-2 rounded-md bg-warning-soft p-3 text-sm">
              <span>Já existe um registro neste período.</span>
              <Button type="button" size="sm" variant="outline" onClick={() => loadFor(start, end)}>Editar existente</Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="ld">Leads / mensagens</Label>
              <Input id="ld" inputMode="numeric" value={leads} onChange={(e) => setLeads(e.target.value)} placeholder="15" autoFocus /></div>
            <div className="grid gap-1.5"><Label htmlFor="cp">CPL (R$)</Label>
              <Input id="cp" inputMode="decimal" value={cpl} onChange={(e) => setCpl(e.target.value)} placeholder="20,25" /></div>
          </div>
          {L != null && C != null && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="font-semibold">{client?.dot ?? "🔵"} {client?.name}</div>
              <div className="num">Lead: {int(L)}</div>
              <div className="num">CPL: {brl(C)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Investimento estimado: <span className="num">{brl(L * C)}</span></div>
            </div>
          )}
          <div className="grid gap-1.5"><Label htmlFor="nt">Observações (opcional)</Label><Textarea id="nt" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          <DialogFooter><Button type="submit" disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
