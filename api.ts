import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, getAsync, allAsync, runAsync } from './api/src/database.js';
import { calculateDistance, estimateToll } from './api/src/googleMaps.js';
import { generateBudgetPDF } from './api/src/pdf.js';
import { hashPassword, comparePassword, generateToken, verifyToken, extractTokenFromHeader } from './api/src/auth.js';
import { CalculateRequest, Budget } from './api/src/types.js';

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
    res.status(400).json({ error: error.message });
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
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin === 1
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ROTAS DE CÁLCULO =============

// Calcular frete
app.post('/api/calculate', async (req, res) => {
  try {
    const { vehicleType, pricePerKm, originAddress, destinationAddress, clientName, clientEmail, clientPhone }: CalculateRequest = req.body;

    if (!vehicleType || !pricePerKm || !originAddress || !destinationAddress) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    // Obter distância e estimar pedágio
    const { distance } = await calculateDistance(originAddress, destinationAddress);
    const tolEstimate = estimateToll(distance);

    // Calcular preço base e total
    const basePrice = distance * pricePerKm;
    const totalPrice = basePrice + tolEstimate;
    const duration = `${Math.ceil(distance / 100)}h`;

    // Criar orçamento no banco de dados
    const budget: Budget = {
      id: 0,
      vehicleType,
      distance: parseFloat(distance.toFixed(2)),
      basePrice: parseFloat(basePrice.toFixed(2)),
      tolEstimate: parseFloat(tolEstimate.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      duration,
      clientName,
      clientEmail,
      clientPhone,
      createdAt: new Date().toISOString()
    } as any;

    const result = await runAsync(
      'INSERT INTO budgets (vehicleType, distance, basePrice, tolEstimate, totalPrice, duration, clientName, clientEmail, clientPhone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [budget.vehicleType, budget.distance, budget.basePrice, budget.tolEstimate, budget.totalPrice, budget.duration, budget.clientName, budget.clientEmail, budget.clientPhone]
    );

    budget.id = (result as any).lastID || 0;

    res.json(budget);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ROTAS DE ORÇAMENTOS =============

// Obter orçamento
app.get('/api/budgets/:id', async (req, res) => {
  try {
    const budget = await getAsync('SELECT * FROM budgets WHERE id = ?', [req.params.id]);

    if (!budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    res.json(budget);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ROTAS DE ADMINISTRAÇÃO =============

// Atualizar preço de veículo
app.put('/api/admin/vehicle-prices/:vehicleType', authMiddleware, async (req, res) => {
  try {
    const { vehicleType } = req.params;
    const { pricePerKm, description } = req.body;

    if (!pricePerKm) {
      return res.status(400).json({ error: 'Preço por km é obrigatório' });
    }

    await runAsync(
      'UPDATE vehicle_prices SET pricePerKm = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE vehicleType = ?',
      [pricePerKm, description || '', vehicleType]
    );

    res.json({ message: 'Preço atualizado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize database on startup
await initializeDatabase();

export default app;
