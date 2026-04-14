import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'cbs.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
  } else {
    console.log('✅ Banco de dados SQLite conectado');
  }
});

export const initializeDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Tabela de usuários/clientes
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          isAdmin INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de preços dos veículos
      db.run(`
        CREATE TABLE IF NOT EXISTS vehicle_prices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vehicleType TEXT UNIQUE NOT NULL,
          pricePerKm REAL NOT NULL,
          description TEXT,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (!err) {
          // Inserir valores padrão se não existirem
          db.run(`
            INSERT OR IGNORE INTO vehicle_prices (vehicleType, pricePerKm, description)
            VALUES
              ('MUNK', 5.50, 'Guindaste/Munck'),
              ('PRANCHA', 3.50, 'Reboque/Prancha')
          `);
        }
      });

      // Tabela de orçamentos
      db.run(`
        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          vehicleType TEXT NOT NULL,
          originAddress TEXT NOT NULL,
          destinationAddress TEXT NOT NULL,
          distance REAL NOT NULL,
          basePrice REAL NOT NULL,
          tolEstimate REAL DEFAULT 0,
          totalPrice REAL NOT NULL,
          clientName TEXT,
          clientEmail TEXT,
          clientPhone TEXT,
          status TEXT DEFAULT 'pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(userId) REFERENCES users(id)
        )
      `);

      console.log('✅ Tabelas criadas/verificadas');
      resolve();
    });

    db.on('error', reject);
  });
};

export const runAsync = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const getAsync = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const allAsync = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};
