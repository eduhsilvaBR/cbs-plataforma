import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, getAsync, allAsync, runAsync } from './src/database.js';
import { calculateDistance, estimateToll } from './src/googleMaps.js';
import { generateBudgetPDF } from './src/pdf.js';
import { hashPassword, comparePassword, generateToken, verifyToken, extractTokenFromHeader } from './src/auth.js';
import { CalculateRequest, Budget } from './src/types.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware de autenticação
const authMiddleware = (req: any, res: any, next: any) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// ============= ROTAS DE AUTENTICAÇÃO =============

// Registrar novo usuário/cliente
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    const hashedPassword = await hashPassword(password);
    await runAsync(
      'INSERT INTO users (email, password, name, isAdmin) VALUES (?, ?, ?, 0)',
      [email, hashedPassword, name]
    );

    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email já existe' });
    } else {
      res.status(500).json({ error: 'Erro ao registrar' });
    }
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user.id, user.email, user.isAdmin);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ============= ROTAS DE CÁLCULO =============

// Calcular frete
app.post('/api/calculate', async (req, res) => {
  try {
    const { vehicleType, pricePerKm, originAddress, destinationAddress, clientName, clientEmail, clientPhone } = req.body as CalculateRequest;

    if (!vehicleType || !pricePerKm || !originAddress || !destinationAddress) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Calcular distância usando Google Maps
    const distanceResult = await calculateDistance(originAddress, destinationAddress);
    const distance = distanceResult.distance;

    // Calcular valor base
    const basePrice = distance * pricePerKm;

    // Estimar pedágio
    const tolEstimate = estimateToll(distance);

    // Total
    const totalPrice = basePrice + tolEstimate;

    // Salvar no banco
    const result = await runAsync(
      `INSERT INTO budgets (vehicleType, originAddress, destinationAddress, distance, basePrice, tolEstimate, totalPrice, clientName, clientEmail, clientPhone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicleType, originAddress, destinationAddress, distance, basePrice, tolEstimate, totalPrice, clientName, clientEmail, clientPhone]
    );

    const budget = await getAsync('SELECT * FROM budgets WHERE id = ?', [result.lastID]);

    res.json({
      id: budget.id,
      vehicleType,
      distance,
      basePrice: basePrice,
      tolEstimate,
      totalPrice,
      duration: distanceResult.duration,
      createdAt: budget.createdAt
    });
  } catch (error: any) {
    console.error('Erro ao calcular:', error);
    res.status(500).json({ error: 'Erro ao calcular frete' });
  }
});

// ============= ROTAS DE ORÇAMENTO =============

// Obter orçamento por ID
app.get('/api/budgets/:id', async (req, res) => {
  try {
    const budget = await getAsync('SELECT * FROM budgets WHERE id = ?', [req.params.id]);
    if (!budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar orçamento' });
  }
});

// Listar orçamentos do usuário autenticado
app.get('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const budgets = await allAsync('SELECT * FROM budgets WHERE userId = ? ORDER BY createdAt DESC', [req.user.userId]);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar orçamentos' });
  }
});

// Gerar PDF do orçamento
app.get('/api/budgets/:id/pdf', async (req, res) => {
  try {
    const budget = await getAsync('SELECT * FROM budgets WHERE id = ?', [req.params.id]);
    if (!budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    const pdfBuffer = await generateBudgetPDF(budget);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="orcamento-${budget.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

// ============= ROTAS ADMIN =============

// Obter preços dos veículos (público)
app.get('/api/admin/vehicle-prices', async (req, res) => {
  try {
    const prices = await allAsync('SELECT * FROM vehicle_prices');
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar preços' });
  }
});

// Atualizar preços (requer autenticação admin)
app.put('/api/admin/vehicle-prices/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { pricePerKm } = req.body;
    if (pricePerKm === undefined) {
      return res.status(400).json({ error: 'pricePerKm é obrigatório' });
    }

    await runAsync('UPDATE vehicle_prices SET pricePerKm = ? WHERE id = ?', [pricePerKm, req.params.id]);
    const updated = await getAsync('SELECT * FROM vehicle_prices WHERE id = ?', [req.params.id]);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar preço' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
