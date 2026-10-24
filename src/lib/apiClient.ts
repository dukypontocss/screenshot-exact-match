const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `Erro ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  managers: {
    list: () => fetchApi<Manager[]>('/managers'),
    get: (id: string) => fetchApi<Manager>(`/managers/${id}`),
    create: (name: string) => fetchApi<Manager>('/managers', { method: 'POST', body: JSON.stringify({ name }) }),
    update: (id: string, name: string) => fetchApi<Manager>(`/managers/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
    archive: (id: string) => fetchApi<Manager>(`/managers/${id}/archive`, { method: 'PATCH' }),
  },
  clients: {
    list: () => fetchApi<Client[]>('/clients'),
    listByManager: (managerId: string) => fetchApi<Client[]>(`/clients/manager/${managerId}`),
    get: (id: string) => fetchApi<Client>(`/clients/${id}`),
    create: (data: CreateClientData) => fetchApi<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateClientData) => fetchApi<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    archive: (id: string) => fetchApi<Client>(`/clients/${id}/archive`, { method: 'PATCH' }),
  },
  results: {
    listForClients: (clientIds: string[]) => fetchApi<WeeklyResult[]>(`/results?clientIds=${clientIds.join(',')}`),
    get: (id: string) => fetchApi<WeeklyResult>(`/results/${id}`),
    save: (data: SaveResultData) => fetchApi<WeeklyResult>('/results', {
      method: data.id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<void>(`/results/${id}`, { method: 'DELETE' }),
  },
};

export type Manager = { id: string; name: string; archived: boolean; createdAt: string; updatedAt: string };
export type Client = {
  id: string; managerId: string; name: string; startDate: string | null;
  notes: string | null; archived: boolean; dot: string; createdAt: string; updatedAt: string;
};
export type WeeklyResult = {
  id: string; clientId: string; periodStart: string; periodEnd: string;
  leads: number; cpl: number; notes: string | null; createdAt: string; updatedAt: string;
};

export type CreateClientData = {
  managerId: string; name: string; startDate: string | null; notes: string | null; dot?: string; archived?: boolean;
};
export type UpdateClientData = CreateClientData;
export type SaveResultData = {
  id?: string; clientId: string; periodStart: string; periodEnd: string;
  leads: number; cpl: number; notes: string | null;
};