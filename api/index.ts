import { VercelRequest, VercelResponse } from '@vercel/node';
import app from './handler';
import { initializeDatabase } from './src/database';

// Inicializar banco de dados uma única vez
let dbInitialized = false;

const initDb = async () => {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar banco:', error);
    }
  }
};

export default async (req: VercelRequest, res: VercelResponse) => {
  await initDb();
  return app(req, res);
};
