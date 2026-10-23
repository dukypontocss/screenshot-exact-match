import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Result } from "./ata";

export type Manager = { id: string; name: string; archived: boolean; created_at: string };
export type Client = {
  id: string; manager_id: string; name: string; start_date: string | null;
  notes: string | null; archived: boolean; created_at: string;
};

function check<T>(r: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (r.error) {
    if (r.error.code === "23505") throw new Error("Já existe um registro com esses dados.");
    throw new Error(r.error.message);
  }
  return r.data as T;
}

export const useManagers = () =>
  useQuery({
    queryKey: ["managers"],
    queryFn: async () => check(await supabase.from("managers").select("*").eq("archived", false).order("name")) as Manager[],
  });

export const useAllClients = () =>
  useQuery({
    queryKey: ["clients"],
    queryFn: async () => check(await supabase.from("clients").select("*").order("name")) as Client[],
  });

export const useResultsFor = (clientIds: string[]) =>
  useQuery({
    queryKey: ["results", [...clientIds].sort().join(",")],
    enabled: clientIds.length > 0,
    queryFn: async () => {
      const rows = check(await supabase.from("weekly_results").select("*").in("client_id", clientIds).order("period_start"));
      return (rows as Result[]).map((r) => ({ ...r, cpl: Number(r.cpl) }));
    },
  });

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useSaveManager() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (m: { id?: string; name: string }) => {
      if (m.id) check(await supabase.from("managers").update({ name: m.name }).eq("id", m.id).select());
      else check(await supabase.from("managers").insert({ name: m.name }).select());
    },
    onSuccess: inv,
  });
}
export function useArchiveManager() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { check(await supabase.from("managers").update({ archived: true }).eq("id", id).select()); },
    onSuccess: inv,
  });
}

export function useSaveClient() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (c: { id?: string; manager_id: string; name: string; start_date: string | null; notes: string | null; archived?: boolean }) => {
      const { id, ...rest } = c;
      if (id) check(await supabase.from("clients").update(rest).eq("id", id).select());
      else check(await supabase.from("clients").insert(rest).select());
    },
    onSuccess: inv,
  });
}

export function useSaveResult() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (r: { id?: string; client_id: string; period_start: string; period_end: string; leads: number; cpl: number; notes: string | null }) => {
      const { id, ...rest } = r;
      if (id) check(await supabase.from("weekly_results").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id).select());
      else check(await supabase.from("weekly_results").insert(rest).select());
    },
    onSuccess: inv,
  });
}
export function useDeleteResult() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => { check(await supabase.from("weekly_results").delete().eq("id", id).select()); },
    onSuccess: inv,
  });
}
