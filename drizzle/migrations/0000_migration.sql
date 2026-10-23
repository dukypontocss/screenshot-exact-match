CREATE TABLE public.managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES public.managers(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  notes text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX clients_manager_name_uq ON public.clients (manager_id, lower(name));
CREATE TABLE public.weekly_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  leads integer NOT NULL CHECK (leads >= 0),
  cpl numeric(12,2) NOT NULL CHECK (cpl >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  UNIQUE (client_id, period_start, period_end)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.managers, public.clients, public.weekly_results TO anon, authenticated;
GRANT ALL ON public.managers, public.clients, public.weekly_results TO service_role;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared access" ON public.managers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared access" ON public.clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared access" ON public.weekly_results FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);