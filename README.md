# ATA — Acompanhamento de Tráfego e Análise

Sistema para centralizar resultados semanais de tráfego pago da agência. Migração do Lovable/Supabase para **MongoDB + Render** (hospedagem gratuita).

## Stack Tecnológica

- **Frontend**: React 19 + TypeScript + TanStack Router + TanStack Query + Tailwind CSS + Radix UI
- **Backend**: Node.js + Express + TypeScript + Mongoose (MongoDB ODM)
- **Database**: MongoDB Atlas (free tier)
- **Hosting**: Render (free tier)

## Estrutura do Projeto

```
├── src/                    # Frontend (TanStack Start)
│   ├── components/         # Componentes UI reutilizáveis
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitários e API client
│   ├── routes/             # Rotas (páginas)
│   └── integrations/       # (antigo Supabase - pode remover)
├── server/                 # Backend Express
│   ├── config/             # Configuração do banco
│   ├── controllers/        # Controladores da API
│   ├── models/             # Models Mongoose
│   └── routes/             # Rotas da API
├── render.yaml             # Configuração de deploy no Render
└── package.json            # Scripts raiz (frontend + backend)
```

## Desenvolvimento Local

### Pré-requisitos

- Node.js 20+
- MongoDB local ou MongoDB Atlas (free tier)
- npm ou bun

### Configuração

1. **Clone e instale dependências:**
```bash
git clone <this-repository-url>
cd screenshot-exact-match-mongo
npm run install:all
```

2. **Configure as variáveis de ambiente:**

Frontend (`.env` na raiz):
```env
VITE_API_URL=http://localhost:3001/api
```

Backend (`server/.env`):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ata?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

3. **Inicie o MongoDB** (se local):
```bash
mongod
```

4. **Execute em desenvolvimento (frontend + backend):**
```bash
npm run dev
```

Ou separadamente:
```bash
# Terminal 1 - Frontend (porta 5173)
npm run dev:frontend

# Terminal 2 - Backend (porta 3001)
npm run dev:backend
```

### Acesse

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Health check: http://localhost:3001/api/health

## Deploy no Render (Gratuito)

### 1. MongoDB Atlas (Banco de Dados Gratuito)

1. Crie conta em [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie um cluster **M0 (Free)** - Shared
3. Configure **Database Access** (usuário/senha)
4. Configure **Network Access** (0.0.0.0/0 para permitir Render)
5. Copie a **Connection String** (URI)

### 2. Render (Hospedagem Gratuita)

1. Faça fork/push deste repositório para seu GitHub
2. No [Render Dashboard](https://dashboard.render.com), clique em **New +** → **Blueprint**
3. Conecte seu repositório GitHub
4. O `render.yaml` será detectado automaticamente
5. Configure as variáveis de ambiente:
   - `MONGODB_URI`: sua connection string do Atlas
   - `FRONTEND_URL`: URL do frontend no Render (ex: `https://ata-frontend.onrender.com`)
6. Clique em **Apply** - o Render criará 2 serviços:
   - `ata-backend` (API Express)
   - `ata-frontend` (React build estático servido via `serve`)

### 3. Variáveis de Ambiente no Render

**Backend (ata-backend):**
| Variável | Valor |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://...` (do Atlas) |
| `FRONTEND_URL` | `https://ata-frontend.onrender.com` |
| `NODE_ENV` | `production` |

**Frontend (ata-frontend):**
| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | Auto-preenchido via `fromService` no render.yaml |

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Frontend + Backend juntos
npm run dev:frontend     # Apenas frontend (Vite)
npm run dev:backend      # Apenas backend (tsx watch)

# Build
npm run build            # Build completo (frontend + backend)
npm run build:frontend   # Build apenas frontend
npm run build:backend    # Build apenas backend

# Produção
npm run start            # Inicia backend compilado

# Qualidade
npm run lint             # ESLint
npm run format           # Prettier
npm run test             # Vitest
```

## Modelos de Dados

### Manager (Gestor)
```typescript
{
  id: ObjectId,
  name: string,
  archived: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Client (Cliente)
```typescript
{
  id: ObjectId,
  managerId: ObjectId (ref: Manager),
  name: string,
  startDate: Date | null,
  notes: string | null,
  archived: boolean,
  dot: string,
  createdAt: Date,
  updatedAt: Date
}
```

### WeeklyResult (Resultado Semanal)
```typescript
{
  id: ObjectId,
  clientId: ObjectId (ref: Client),
  periodStart: Date,
  periodEnd: Date,
  leads: number,
  cpl: number,
  notes: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/managers` | Lista gestores ativos |
| GET | `/api/managers/:id` | Busca gestor por ID |
| POST | `/api/managers` | Cria gestor |
| PUT | `/api/managers/:id` | Atualiza gestor |
| PATCH | `/api/managers/:id/archive` | Arquiva gestor |
| GET | `/api/clients` | Lista todos clientes |
| GET | `/api/clients/manager/:managerId` | Lista clientes do gestor |
| GET | `/api/clients/:id` | Busca cliente por ID |
| POST | `/api/clients` | Cria cliente |
| PUT | `/api/clients/:id` | Atualiza cliente |
| PATCH | `/api/clients/:id/archive` | Arquiva cliente |
| GET | `/api/results?clientIds=id1,id2` | Lista resultados dos clientes |
| GET | `/api/results/:id` | Busca resultado por ID |
| POST | `/api/results` | Cria resultado |
| PUT | `/api/results/:id` | Atualiza resultado |
| DELETE | `/api/results/:id` | Deleta resultado |

## Limitações do Plano Gratuito

- **Render Free**: Serviços "dormem" após 15min de inatividade (cold start ~30-60s)
- **MongoDB Atlas M0**: 512MB storage, shared CPU
- **Sem SSL customizado** no plano free do Render

## Migração do Lovable/Supabase

Principais mudanças realizadas:
1. ✅ Removido `@supabase/supabase-js` e `drizzle-orm`
2. ✅ Criado backend Express com Mongoose
3. ✅ Substituído hooks Supabase por chamadas REST ao backend
4. ✅ Configurado `render.yaml` para deploy gratuito
5. ✅ Adicionado proxy Vite para desenvolvimento local
6. ✅ Mantido frontend intacto (TanStack Start + React Query)

## Licença

MIT