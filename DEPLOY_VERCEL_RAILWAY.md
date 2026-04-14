# 🚀 Deploy Automático via GitHub - Guia Passo-a-Passo

**Tempo total: ~5 minutos**

> ⭐ Vantagem: Vercel e Railway acessam seu GitHub automaticamente. Zero necessidade de tokens!

---

## 🎨 VERCEL - Frontend (2 minutos)

### ✅ Passo 1: Acessar Vercel

1. Abra: https://vercel.com
2. Click **"Sign Up"** (ou "Log In" se já tiver conta)
3. Escolha **"Continue with GitHub"**

![vercel-signin](https://imgur.com/placeholder)

### ✅ Passo 2: Autorizar Vercel no GitHub

Vercel vai pedir permissão para acessar seu GitHub:

- ✅ Click **"Authorize Vercel"**
- ✅ Confirme sua senha GitHub se pedido

### ✅ Passo 3: Criar New Project

1. Na dashboard Vercel, click **"Add New"** → **"Project"**
2. Em "Select a Git Repository", procure por: `cbs`
3. Click no repositório: **internauticayachts/cbs**

![vercel-select-repo](https://imgur.com/placeholder)

### ✅ Passo 4: Configurar Build

Vercel vai auto-detectar React + Vite. Confirme:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: frontend/dist
Install Command: npm install
```

Se não detectar automaticamente, coloque esses valores manualmente.

### ✅ Passo 5: Environment Variables

**IMPORTANTE:** Adicione a variável de ambiente:

1. Click em **"Environment Variables"**
2. Adicione:
   ```
   Name: VITE_API_URL
   Value: https://seu-backend-railway.app
   ```
   (Railway URL será gerada no próximo passo)

3. Click **"Deploy"**

### ✅ Resultado Vercel

Aguarde ~2-3 minutos. Quando terminar:

```
✅ Deployed to: https://cbs-seu-nome.vercel.app
✅ GitHub integration ativada
✅ Auto-deployment ao fazer push
```

**Copie a URL:** `https://cbs-seu-nome.vercel.app`

---

## 🔧 RAILWAY - Backend (2 minutos)

### ✅ Passo 1: Acessar Railway

1. Abra: https://railway.app
2. Click **"Start Project"** (canto superior)
3. Escolha **"Deploy from GitHub Repo"**

![railway-signin](https://imgur.com/placeholder)

### ✅ Passo 2: Autorizar Railway no GitHub

1. Click **"Authorize Railway"**
2. GitHub vai pedir permissão
3. Click **"Authorize railway-app"**

### ✅ Passo 3: Selecionar Repositório

1. Em "Select Repository", procure: `cbs`
2. Click: **internauticayachts/cbs**

### ✅ Passo 4: Configurar Deployment

Na próxima tela, Railway vai pedir:

```
Root Directory: backend
Build Command: npm run build
Start Command: npm start
```

Preencha esses valores e click **"Deploy"**

### ✅ Passo 5: Adicionar Variáveis de Ambiente

1. No painel Railway, click na aba **"Variables"**
2. Click **"Add Variable"** e adicione:

```
PORT = 3001
JWT_SECRET = cbs-secret-key-production-12345-change-this
NODE_ENV = production
GOOGLE_MAPS_API_KEY = (deixe em branco, opcional)
```

3. Click **"Save"** (Railway vai fazer redeploy automaticamente)

### ✅ Passo 6: Obter URL do Backend

1. No painel Railway, click na aba **"Deployments"**
2. Procure pela URL pública (ex: `https://cbs-backend-xxxxx.railway.app`)
3. **Copie essa URL**

---

## 🔗 Conectar Frontend ao Backend

Agora que tem as URLs de ambos:

### Atualizar Vercel com URL do Railway

1. Volte para **Vercel Dashboard**
2. Selecione seu projeto `cbs`
3. Click **"Settings"** → **"Environment Variables"**
4. Clique na variável **`VITE_API_URL`**
5. Atualize o valor com a URL do Railway:
   ```
   VITE_API_URL = https://seu-backend-xxxxx.railway.app
   ```
6. Click **"Save"**
7. Vercel vai fazer auto-redeploy (~1 min)

---

## ✅ Testar o Deploy

### 1️⃣ Acessar Frontend

```
https://cbs-seu-nome.vercel.app
```

Você deve ver:
- ✅ Logo CBS carregando
- ✅ Calculadora aparecendo
- ✅ Sem erros no console

### 2️⃣ Abrir DevTools (F12)

Console deve estar LIMPO. Se houver erro:

```
CORS error: Cannot access...
↓
Solução: URL do VITE_API_URL está errada
```

### 3️⃣ Testar Calculadora

1. Preencha:
   ```
   Tipo: MUNK
   Valor/km: 5.50
   Origem: São Paulo, SP
   Destino: Rio de Janeiro, RJ
   Nome: João Silva
   Email: joao@email.com
   Telefone: 11 99999-9999
   ```

2. Click **"Calcular Frete"**

3. Se funcionar:
   ```
   ✅ Distância calculada
   ✅ Valor total exibido
   ✅ Orçamento salvo
   ```

4. Click **"Baixar PDF"**
   - PDF deve aparecer com logo
   - Todos os dados preenchidos

### 4️⃣ Testar Login

1. Click **"Login"** no menu
2. Clique em **"Cadastre-se"**
3. Preencha:
   ```
   Nome: Seu Nome
   Email: seu@email.com
   Senha: abc123
   ```
4. Click **"Criar Conta"**
5. Volte para **"Faça login"**
6. Use as credenciais que criou

**Se funcionar:** Backend está rodando! 🎉

---

## 🚨 Se Algo Não Funcionar

### ❌ "API is not responding"

**Solução 1:** URL do Railway incorreta
```
Vercel → Settings → Environment Variables
Atualize VITE_API_URL com a URL correta do Railway
```

**Solução 2:** Backend não respondendo
```
Railway Dashboard → Deployments
Verifique se há erros nos logs
```

**Solução 3:** CORS error
```
Aguarde ~2 min para Railway fazer redeploy após variáveis
```

### ❌ "CORS error"

Adicione ao `backend/src/index.ts`:
```typescript
app.use(cors({
  origin: ['https://cbs-seu-nome.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

Depois:
```bash
git add backend/src/index.ts
git commit -m "Fix CORS for Vercel domain"
git push
```

Railway fará redeploy automaticamente.

### ❌ "Logo não aparece no PDF"

1. Crie pasta no Railway (ou use URL absoluta)
2. Edite `backend/src/pdf.ts`:
```typescript
const logoUrl = 'https://seu-site.com/logo cbs.png';
doc.image(logoUrl, 50, 50, { width: 100 });
```

---

## 🎯 URLs Finais

Depois de tudo pronto:

```
┌─────────────────────────────────────────────────────────────┐
│ 🎨 FRONTEND (Vercel)                                        │
│ https://cbs-seu-nome.vercel.app                             │
├─────────────────────────────────────────────────────────────┤
│ 🔧 BACKEND (Railway)                                        │
│ https://cbs-backend-xxxxx.railway.app                       │
├─────────────────────────────────────────────────────────────┤
│ 📚 GitHub                                                    │
│ https://github.com/internauticayachts/cbs                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Auto-Deployment Habilitado

Agora, **toda vez que você faz push no GitHub**:

1. ✅ Vercel detecta e faz rebuild do frontend
2. ✅ Railway detecta e faz rebuild do backend
3. ✅ Tudo fica live automaticamente em ~2-3 minutos

Exemplo:
```bash
git add .
git commit -m "New feature XYZ"
git push origin master
# → Vercel e Railway fazem deploy automaticamente
```

---

## 📝 Checklist Final

- [ ] Vercel criado e conectado ao GitHub
- [ ] Railway criado e conectado ao GitHub
- [ ] VITE_API_URL configurado no Vercel
- [ ] JWT_SECRET configurado no Railway
- [ ] Frontend acessível em: `https://cbs-seu-nome.vercel.app`
- [ ] Backend acessível em: `https://seu-backend.railway.app`
- [ ] Calculadora funcionando
- [ ] PDF sendo gerado com logo
- [ ] Login funcionando
- [ ] Painel Admin acessível (com credenciais)

---

## 🎓 Próximos Passos

1. **Domínio Customizado** (opcional)
   - Vercel: Settings → Domains
   - Railway: Networking

2. **Monitoramento**
   - Sentry (erros)
   - LogRocket (performance)
   - Datadog (logs)

3. **Banco de Dados**
   - Migrar de SQLite para PostgreSQL
   - Railway oferece PostgreSQL grátis

4. **CI/CD**
   - GitHub Actions para testes
   - Auto-tests antes de deploy

---

**Pronto para ir ao vivo!** 🚀

Qualquer dúvida, me chama!
