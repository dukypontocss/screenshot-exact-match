import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Manager, type Client, type WeeklyResult, type CreateClientData, type SaveResultData } from './apiClient';

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export const useManagers = () =>
  useQuery({
    queryKey: ['managers'],
    queryFn: api.managers.list,
  });

export const useAllClients = () =>
  useQuery({
    queryKey: ['clients'],
    queryFn: api.clients.list,
  });

export const useClientsByManager = (managerId: string) =>
  useQuery({
    queryKey: ['clients', managerId],
    queryFn: () => api.clients.listByManager(managerId),
    enabled: !!managerId,
  });

export const useResultsFor = (clientIds: string[]) =>
  useQuery({
    queryKey: ['results', [...clientIds].sort().join(',')],
    enabled: clientIds.length > 0,
    queryFn: () => api.results.listForClients(clientIds),
    select: (data) => data.map((r) => ({ ...r, cpl: Number(r.cpl) })),
  });

export function useSaveManager() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (m: { id?: string | undefined; name: string }) => {
      if (m.id) return api.managers.update(m.id, m.name);
      return api.managers.create(m.name);
    },
    onSuccess: inv,
  });
}

export function useArchiveManager() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.managers.archive(id),
    onSuccess: inv,
  });
}

export function useSaveClient() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (c: CreateClientData & { id?: string | undefined }) => {
      const { id, ...rest } = c;
      if (id) return api.clients.update(id, rest);
      return api.clients.create(rest);
    },
    onSuccess: inv,
  });
}

export function useSaveResult() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (r: SaveResultData) => api.results.save(r),
    onSuccess: inv,
  });
}

export function useDeleteResult() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.results.delete(id),
    onSuccess: inv,
  });
}

export type { Manager, Client, WeeklyResult };