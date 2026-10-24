import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import managersRouter from './routes/managers.js';
import clientsRouter from './routes/clients.js';
import resultsRouter from './routes/results.js';
import { connectDB } from './config/database.js';

const app: Application = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/managers', managersRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/results', resultsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

let isDbConnected = false;

export async function startServer(): Promise<Application> {
  if (!isDbConnected) {
    await connectDB();
    isDbConnected = true;
  }
  return app;
}

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  startServer().then(app => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;