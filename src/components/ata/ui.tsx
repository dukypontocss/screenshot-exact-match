import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus, CalendarDays, Moon, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, fmtDate, todayISO, type Trend } from "@/lib/ata";

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="text-lg font-bold tracking-tight">ATA</span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{children}<ThemeToggle /></div>
      </div>
    </header>
  );
}

export function Stat({ label, value, delta, hint, big }: { label: string; value: ReactNode; delta?: ReactNode; hint?: ReactNode; big?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("num mt-1 font-semibold", big ? "text-4xl sm:text-5xl" : "text-2xl")}>{value}</div>
      {delta && <div className="mt-2">{delta}</div>}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Delta chip. `goodWhen` says whether an increase is favourable. */
export function Delta({ pct, goodWhen }: { pct: number | null; goodWhen: "up" | "down" }) {
  if (pct == null) return <span className="text-xs text-muted-foreground">Sem histórico comparável</span>;
  const stable = Math.abs(pct) < 0.5;
  const good = stable ? null : goodWhen === "up" ? pct > 0 : pct < 0;
  const Icon = stable ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium num",
        good === null && "bg-muted text-muted-foreground",
        good === true && "bg-success-soft text-success",
        good === false && "bg-danger-soft text-destructive",
      )}
    >
      <Icon className="h-3 w-3" />
      {pct > 0 ? "+" : ""}
      {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs. anterior
    </span>
  );
}

const TREND: Record<Trend, { label: string; cls: string }> = {
  melhora: { label: "Melhora", cls: "bg-success-soft text-success" },
  estavel: { label: "Estável", cls: "bg-muted text-muted-foreground" },
  piora: { label: "Piora", cls: "bg-danger-soft text-destructive" },
  sem: { label: "Sem comparação", cls: "bg-muted text-muted-foreground" },
};
export function TrendBadge({ trend }: { trend: Trend }) {
  const t = TREND[trend];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", t.cls)} title="Baseado na variação do CPL">{t.label}</span>;
}

export function WeekNav({ end, onChange }: { end: string; onChange: (end: string) => void }) {
  const start = addDays(end, -6);
  const today = todayISO();
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onChange(addDays(end, -7))} aria-label="Semana anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <label className="relative flex items-center gap-2 px-2 text-sm font-medium num">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {fmtDate(start)} – {fmtDate(end, true)}
        <input
          type="date"
          aria-label="Escolher data final"
          className="absolute inset-0 cursor-pointer opacity-0"
          value={end}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
      </label>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onChange(addDays(end, 7))} aria-label="Próxima semana">
        <ChevronRight className="h-4 w-4" />
      </Button>
      {end !== today && (
        <Button size="sm" variant="ghost" className="h-8" onClick={() => onChange(today)}>Atual</Button>
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("ata-theme", next ? "dark" : "light"); } catch { /* ignore */ }
  };
  return (
    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={toggle} aria-label={dark ? "Modo claro" : "Modo noturno"} title={dark ? "Modo claro" : "Modo noturno"}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
