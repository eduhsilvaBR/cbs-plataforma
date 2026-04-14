# 🚀 Guia Completo de Deploy - CBS Frete Calculator

Deploy da plataforma em **Vercel (Frontend) + Backend em outra plataforma**.

---

## 📋 Checklist Pré-Deploy

- [ ] Código commitado no GitHub
- [ ] `.env` configurado com variáveis de produção
- [ ] Banco de dados testado localmente
- [ ] Frontend buildando sem erros
- [ ] Contas criadas nas plataformas de deploy

---

## 🎨 FRONTEND - Vercel

### 1️⃣ Conectar ao Vercel

```bash
# Opção A: Via CLI
npm i -g vercel
vercel login
vercel --prod

# Opção B: Via GitHub (recomendado)
# 1. Acesse https://vercel.com
# 2. Clique "New Project"
# 3. Selecione repositório GitHub: internauticayachts/cbs
# 4. Vercel detecta automaticamente React + Vite
```

### 2️⃣ Configurar Variáveis de Ambiente

No painel Vercel → Project Settings → Environment Variables:

```
VITE_API_URL = https://seu-backend-url.com
```

### 3️⃣ Configuração Automática

Vercel automaticamente:
- ✅ Executa `npm run build` (frontend)
- ✅ Serve arquivos em `frontend/dist`
- ✅ Cria URL pública

**URL Final:** `https://cbs-seu-nome.vercel.app`

---

## 🔧 BACKEND - Escolha uma Opção

### Opção 1: Railway (Recomendado)

**Vantagens:**
- Setup super simples
- PostgreSQL/MongoDB inclusos
- Paga apenas o que usa
- Integração com GitHub

#### Passo a Passo:

1. **Criar conta em Railway:**
   ```
   https://railway.app
   ```

2. **Conectar GitHub:**
   - Login com GitHub
   - Autorizar Railway

3. **Criar novo projeto:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Selecione `internauticayachts/cbs`

4. **Configurar:**
   ```
   Root Directory: backend
   Build Command: npm run build
   Start Command: npm start
   ```

5. **Variáveis de Ambiente:**
   Na aba "Variables":
   ```
   PORT=3001
   JWT_SECRET=sua-chave-super-segura-aqui
   GOOGLE_MAPS_API_KEY=sua-chave-opcional
   DATABASE_URL=postgres://... (Railway gera)
   NODE_ENV=production
   ```

6. **Pronto!**
   - Railway fornece URL: `https://seu-app-abc123.railway.app`

---

### Opção 2: Render

1. Acesse: https://render.com
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub
5. Selecione `internauticayachts/cbs`

**Configuração:**
```
Name: cbs-backend
Root Directory: backend
Build Command: npm run build
Start Command: npm start
```

**Variáveis de Ambiente:**
```
PORT=3001
JWT_SECRET=...
GOOGLE_MAPS_API_KEY=...
NODE_ENV=production
```

---

### Opção 3: Fly.io

1. Criar conta: https://fly.io
2. Instalar CLI: `npm install -g @flydotio/cli`
3. Na pasta backend:
   ```bash
   fly launch
   fly deploy
   ```

---

## 📊 Migrando de SQLite para PostgreSQL

Se escolher **Railway** ou **Render**, use **PostgreSQL** (melhor para produção).

### Atualizar `backend/src/database.ts`:

```typescript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const runAsync = (sql: string, params: any[] = []): Promise<any> => {
  return pool.query(sql, params);
};
```

### Instalar driver PostgreSQL:
```bash
cd backend
npm install pg
```

### Criar tabelas em produção:

```bash
# Via psql CLI ou interface web do Railway/Render
psql $DATABASE_URL < schema.sql
```

---

## 🔗 Conectar Frontend ao Backend

### No Vercel (Environment Variables):

```
VITE_API_URL=https://seu-backend-url.com
```

### No `frontend/src/components/Calculator.tsx`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const response = await axios.post(`${API_URL}/api/calculate`, {
  // ...
});
```

---

## ✅ Checklist Final

### Backend:
- [ ] Rodando em produção (Railway/Render/Fly)
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e migrado
- [ ] CORS configurado para Vercel URL
- [ ] JWT_SECRET alterado
- [ ] Logs funcionando

### Frontend:
- [ ] Buildando sem erros
- [ ] Variável VITE_API_URL apontando para backend
- [ ] Logo aparecendo corretamente
- [ ] Login funcionando
- [ ] Calculadora consumindo API real
- [ ] PDF sendo gerado

### DNS (opcional):
- [ ] Domínio customizado configurado
- [ ] SSL automático ativado

---

## 🧪 Testar Deploy

1. **Frontend:**
   ```bash
   https://seu-app.vercel.app
   ```

2. **Abra DevTools (F12) → Console** e veja:
   - Nenhum erro de CORS
   - API_URL correto
   - Requisições para backend funcionando

3. **Teste a calculadora:**
   - Digite endereços
   - Clique "Calcular"
   - Veja se recebe resposta da API

4. **Teste o PDF:**
   - Calcule um orçamento
   - Click "Baixar PDF"
   - Verifique se tem logo e dados corretos

---

## 🐛 Troubleshooting

### "CORS error"
```typescript
// backend/src/index.ts - Adicione:
app.use(cors({
  origin: 'https://seu-app.vercel.app',
  credentials: true
}));
```

### "API_URL is undefined"
```bash
# Vercel → Settings → Environment Variables
# Adicione: VITE_API_URL=https://seu-backend.com
```

### "Banco não funciona"
1. Verifique conexão DATABASE_URL
2. Execute migrations
3. Verifique logs no Railway/Render

### "Logo não aparece no PDF"
- Adicione a imagem no Railway/Render (copie para backend)
- Ou use URL absoluta: `https://seu-site.com/logo.png`

---

## 🔐 Segurança em Produção

### ✅ Checklist de Segurança

- [ ] JWT_SECRET é aleatório e seguro
- [ ] CORS restrito ao domínio correto
- [ ] Senhas hasheadas no banco
- [ ] HTTPS ativado (automático em Vercel/Railway)
- [ ] Rate limiting implementado
- [ ] Logs habilitados
- [ ] Backups do banco automáticos
- [ ] Environment secrets não commitados

---

## 📞 URLs Finais

Após deploy:

```
Frontend: https://cbs-seu-nome.vercel.app
Backend:  https://seu-backend-xxxxx.railway.app
GitHub:   https://github.com/internauticayachts/cbs
```

---

## 🎯 Próximos Passos

1. Configure domínio customizado
2. Implemente CI/CD (GitHub Actions)
3. Configure monitoramento (Sentry, LogRocket)
4. Crie política de backup
5. Implemente rate limiting
6. Adicione testes automatizados

---

**Pronto para produção!** 🚀
