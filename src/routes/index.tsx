import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppHeader, Empty } from "@/components/ata/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAllClients, useArchiveManager, useManagers, useSaveManager, type Manager } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATA — Selecione o gestor" },
      { name: "description", content: "Escolha um gestor para ver a carteira de clientes e os resultados semanais de tráfego." },
      { property: "og:title", content: "ATA — Acompanhamento de Tráfego e Análise" },
      { property: "og:description", content: "Centralize os resultados semanais de tráfego pago da agência." },
    ],
  }),
  component: Home,
});

function Home() {
  const managers = useManagers();
  const clients = useAllClients();
  const save = useSaveManager();
  const archive = useArchiveManager();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Manager | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [removing, setRemoving] = useState<Manager | null>(null);

  const list = useMemo(
    () => (managers.data ?? []).filter((m) => m.name.toLowerCase().includes(q.toLowerCase())),
    [managers.data, q],
  );
  const countFor = (id: string) => (clients.data ?? []).filter((c) => c.manager_id === id && !c.archived).length;

  const open = (m: Manager | null) => { setEditing(m); setName(m?.name ?? ""); };
  const submit = async () => {
    const n = name.trim();
    if (!n) return void toast.error("Informe o nome do gestor.");
    if ((managers.data ?? []).some((m) => m.id !== editing?.id && m.name.toLowerCase() === n.toLowerCase()))
      return void toast.error("Já existe um gestor com esse nome.");
    try {
      await save.mutateAsync({ id: editing?.id, name: n });
      toast.success(editing ? "Gestor atualizado." : "Gestor cadastrado.");
      setEditing(undefined);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">ATA — Acompanhamento de Tráfego e Análise</h1>
          <p className="mt-3 text-muted-foreground">
            Centralize os resultados semanais de cada cliente, consulte o histórico e apresente os números na reunião.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar gestor" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button onClick={() => open(null)}><Plus className="h-4 w-4" /> Novo gestor</Button>
        </div>

        <div className="mt-6">
          {managers.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}</div>
          ) : managers.error ? (
            <Empty title="Não foi possível carregar os gestores.">{(managers.error as Error).message}</Empty>
          ) : list.length === 0 ? (
            <Empty title={q ? "Nenhum gestor encontrado." : "Nenhum gestor cadastrado ainda."}>
              {!q && "Cadastre o primeiro gestor para começar."}
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((m) => (
                <div key={m.id} className="group flex flex-col rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent font-semibold text-accent-foreground">
                        {m.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <div className="font-semibold">{m.name}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" /> {countFor(m.id)} {countFor(m.id) === 1 ? "cliente" : "clientes"}
                        </div>
                      </div>
                    </div>
                    <div className="flex">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => open(m)} aria-label="Editar gestor"><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setRemoving(m)} aria-label="Remover gestor"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <Button asChild variant="secondary" className="mt-5">
                    <Link to="/gestor/$managerId" params={{ managerId: m.id }}>Acessar painel <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar gestor" : "Novo gestor"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid gap-4">
            <Input autoFocus placeholder="Nome do gestor" value={name} onChange={(e) => setName(e.target.value)} />
            <DialogFooter><Button type="submit" disabled={save.isPending}>Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O gestor sai da lista, mas clientes e históricos são preservados no banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!removing) return;
              try { await archive.mutateAsync(removing.id); toast.success("Gestor removido."); } catch (e) { toast.error((e as Error).message); }
            }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
