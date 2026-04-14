# 🚚 CBS - Calculadora de Frete Online

Plataforma completa para cálculo de orçamentos de frete com **pré-cálculo automático**, **geração de PDF com logo** e **painel administrativo**.

![Status](https://img.shields.io/badge/status-ativo-brightgreen)
![Node](https://img.shields.io/badge/node-18+-green)
![React](https://img.shields.io/badge/react-18+-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Funcionalidades

### 👥 Para Clientes
- ✅ Calculadora intuitiva de fretes
- ✅ Suporte para 2 tipos de veículos (MUNK e PRANCHA)
- ✅ Cálculo baseado em quilometragem real (Google Maps)
- ✅ Estimativa automática de pedágio
- ✅ Preços personalizáveis em tempo real
- ✅ Download de orçamento em PDF com logo
- ✅ Histórico de orçamentos
- ✅ Dados do cliente salvos

### 🔧 Para Administradores
- ✅ Painel administrativo completo
- ✅ Gerenciamento de preços por veículo
- ✅ Visualização de histórico
- ✅ Autenticação segura

### 🛠️ Técnico
- ✅ Backend: Express.js + TypeScript
- ✅ Frontend: React + Vite + TypeScript
- ✅ Banco: SQLite (sem dependências externas)
- ✅ Autenticação: JWT
- ✅ Integração: Google Maps API
- ✅ PDF: PDFKit com logo
- ✅ Responsivo: Mobile-first

---

## 🚀 Quick Start

### 1️⃣ Instalação

```bash
# Clonar/acessar o projeto
cd c:\Users\EDUARDO\Documents\CBS

# Instalar dependências
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..
```

### 2️⃣ Iniciar Servidor

```bash
npm run dev
```

Acesse:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

### 3️⃣ Login Demo

```
Email:  admin@cbs.com
Senha:  admin123
```

---

## 📁 Estrutura do Projeto

```
CBS/
├── 📦 backend/
│   ├── src/
│   │   ├── index.ts              # 🚀 Servidor Express
│   │   ├── database.ts           # 🗄️ SQLite
│   │   ├── auth.ts               # 🔐 JWT
│   │   ├── googleMaps.ts         # 🗺️ Google Maps
│   │   ├── pdf.ts                # 📄 Geração PDF
│   │   └── types.ts              # 📋 TypeScript types
│   ├── cbs.db                    # 📊 Banco de dados
│   ├── package.json
│   └── tsconfig.json
│
├── 🎨 frontend/
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx               # 🏠 Componente raiz
│   │   ├── index.css             # 🎨 Estilos globais
│   │   └── components/
│   │       ├── Calculator.tsx    # 📱 Calculadora
│   │       ├── Login.tsx         # 🔓 Login/Signup
│   │       └── AdminPanel.tsx    # ⚙️ Painel admin
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── 📸 logo cbs.png               # Logo da empresa
├── .env                          # ⚙️ Configuração
├── package.json                  # Root
├── SETUP.md                      # 📖 Setup detalhado
└── README.md                     # Este arquivo
```

---

## 🔧 Configuração

### Variáveis de Ambiente (`.env`)

```env
# Backend
PORT=3001
JWT_SECRET=sua-chave-secreta-super-segura

# Google Maps (opcional)
GOOGLE_MAPS_API_KEY=sua-chave-api

# Frontend
VITE_API_URL=http://localhost:3001
```

### Google Maps API

Para usar cálculo de distância real:

1. Acesse: https://cloud.google.com/maps-platform
2. Crie um projeto e obtenha uma chave
3. Adicione em `backend/.env`

> **Sem a chave?** O sistema usa uma estimativa padrão (50km)

---

## 📊 API Endpoints

### 🔐 Autenticação
```
POST   /api/auth/register          Registrar novo usuário
POST   /api/auth/login             Fazer login
```

### 📱 Calculadora
```
POST   /api/calculate              Calcular frete
GET    /api/budgets/:id            Obter orçamento
GET    /api/budgets/:id/pdf        Download PDF
GET    /api/budgets                Listar orçamentos (auth)
```

### ⚙️ Admin
```
GET    /api/admin/vehicle-prices          Listar preços
PUT    /api/admin/vehicle-prices/:id      Atualizar preço (auth)
```

---

## 💾 Banco de Dados

SQLite com 3 tabelas:

```sql
-- Usuários/Clientes
users (id, email, password, name, isAdmin, createdAt)

-- Preços dos veículos
vehicle_prices (id, vehicleType, pricePerKm, description, updatedAt)

-- Histórico de orçamentos
budgets (id, userId, vehicleType, originAddress, destinationAddress, 
         distance, basePrice, tolEstimate, totalPrice, clientName, 
         clientEmail, clientPhone, status, createdAt)
```

---

## 🎨 Customização

### Mudar Cores
Edite `frontend/src/index.css`:
```css
--primary: #667eea;           /* Cor principal */
--primary-dark: #764ba2;      /* Cor secundária */
--success: #48bb78;           /* Sucesso */
--danger: #f56565;            /* Erro */
```

### Adicionar Novo Veículo
1. Edite `backend/src/database.ts` - insira na tabela `vehicle_prices`
2. Edite `frontend/src/components/Calculator.tsx` - adicione opção

### Ajustar Pedágio
Edite `backend/src/googleMaps.ts` - função `estimateToll()`:
```typescript
const tolPerKm = 0.20; // R$/km
```

---

## 🚀 Build & Deploy

### Compilar para Produção
```bash
npm run build
```

Gera:
- `backend/dist/` - Backend compilado
- `frontend/dist/` - Frontend otimizado

### Fazer Deploy

1. **Heroku:**
   ```bash
   heroku create seu-app
   git push heroku main
   ```

2. **DigitalOcean/AWS/VPS:**
   - Copie `backend/dist/` e `frontend/dist/`
   - Configure Node.js + PM2
   - Use reverse proxy (Nginx)

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Porta 3000/3001 em uso | `lsof -i :3000` + `kill -9 <PID>` |
| Logo não aparece | Verifique caminho em `backend/src/pdf.ts` |
| Google Maps erro | Verifique chave API + permissões |
| Banco corrupto | Delete `backend/cbs.db` (será recriado) |
| npm install falha | `rm -rf node_modules` + `npm install` |

---

## 🔒 Segurança

⚠️ **Antes de ir para produção:**

- [ ] Altere `JWT_SECRET` para algo seguro
- [ ] Use HTTPS
- [ ] Configure CORS para seu domínio
- [ ] Use PostgreSQL ao invés de SQLite
- [ ] Implemente rate limiting
- [ ] Adicione validação de entrada
- [ ] Configure backup automático

---

## 📦 Tecnologias

**Backend:**
- Express.js
- TypeScript
- SQLite3
- JWT
- bcryptjs
- PDFKit
- Axios (Google Maps)

**Frontend:**
- React 18
- TypeScript
- Vite
- Axios
- CSS3 (Grid/Flexbox)

---

## 📄 Licença

MIT - Livre para usar e modificar

---

## 📞 Suporte

**Documentação:** Veja `SETUP.md` para guia completo

**Dúvidas?**
1. Verifique `SETUP.md`
2. Veja logs do servidor (`backend/cbs.db`)
3. Teste API com Postman/Insomnia

---

## 🎯 Roadmap Futuro

- [ ] Integração com WhatsApp
- [ ] Suporte a múltiplos usuários admin
- [ ] Relatórios em Excel
- [ ] Notificações por email
- [ ] App mobile
- [ ] Integração com sistema de pagamento
- [ ] Dashboard com gráficos

---

**Desenvolvido com ❤️ para CBS Transportes**

⭐ Se usar, deixe uma estrela! (Se fosse GitHub 😊)
