const API_BASE = import.meta.env['VITE_API_URL'] || '/api';

// O back (MongoDB) usa _id e camelCase; o front usa id e snake_case.
// Estas funções traduzem nos dois sentidos.
const KEY_FROM_API: Record<string, string> = {
  managerId: 'manager_id', clientId: 'client_id', periodStart: 'period_start',
  periodEnd: 'period_end', startDate: 'start_date', createdAt: 'created_at', updatedAt: 'updated_at',
};
const KEY_TO_API: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_FROM_API).map(([camel, snake]) => [snake, camel]),
);
const DATE_ONLY = new Set(['period_start', 'period_end', 'start_date']);

function fromApi(value: any): any {
  if (Array.isArray(value)) return value.map(fromApi);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (key === '__v') continue;
      if (key === '_id') { out['id'] = String(val); continue; }
      const newKey = KEY_FROM_API[key] ?? key;
      out[newKey] = DATE_ONLY.has(newKey) && typeof val === 'string' ? val.slice(0, 10) : fromApi(val);
    }
    return out;
  }
  return value;
}

function toApi(value: any): any {
  if (Array.isArray(value)) return value.map(toApi);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) out[KEY_TO_API[key] ?? key] = toApi(val);
    return out;
  }
  return value;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const init: RequestInit = { ...options };
  if (typeof init.body === 'string') init.body = JSON.stringify(toApi(JSON.parse(init.body)));

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `Erro ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return fromApi(await response.json()) as T;
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
      method: 'POST',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<void>(`/results/${id}`, { method: 'DELETE' }),
  },
};

export type Manager = { id: string; name: string; archived: boolean; created_at: string; updated_at: string };
export type Client = {
  id: string; manager_id: string; name: string; start_date: string | null;
  notes: string | null; archived: boolean; dot: string; created_at: string; updated_at: string;
};
export type WeeklyResult = {
  id: string; client_id: string; period_start: string; period_end: string;
  leads: number; cpl: number; notes: string | null; created_at: string; updated_at: string;
};

export type CreateClientData = {
  manager_id: string; name: string; start_date: string | null; notes: string | null; dot?: string; archived?: boolean;
};
export type UpdateClientData = CreateClientData;
export type SaveResultData = {
  id?: string | undefined; client_id: string; period_start: string; period_end: string;
  leads: number; cpl: number; notes: string | null;
};
