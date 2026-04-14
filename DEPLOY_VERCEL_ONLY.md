# 🚀 Deploy 100% Vercel - Guia Rápido

**Arquitetura:**
- Frontend React → Vercel (Static)
- Backend Express → Vercel (Serverless Functions)
- GitHub → Controle de versão

---

## ✅ Passo 1: GitHub (Já Feito!)

```
✅ Código no GitHub
✅ Email do Git correto
✅ Pronto para Vercel
```

---

## 🎨 Passo 2: Deploy no Vercel

### Opção A: Via Vercel Dashboard (Mais Fácil)

1. **Acesse:** https://vercel.com
2. **Click:** "Add New Project"
3. **Selecione:** `internauticayachts/cbs` (do GitHub)
4. **Configure:**
   - Framework: Vite
   - Build Command: `npm install && cd api && npm install && cd ../frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
5. **Environment Variables:**
   ```
   JWT_SECRET = cbs-secret-production-change-this
   GOOGLE_MAPS_API_KEY = (opcional)
   ```
6. **Click:** "Deploy"
7. **Aguarde:** ~3-5 minutos

### Opção B: Via CLI (Se Preferir)

```bash
npm i -g vercel
cd c:\Users\EDUARDO\Documents\CBS
vercel --prod
```

---

## 🎯 Resultado Final

```
✅ Frontend: https://cbs-seu-nome.vercel.app
✅ Backend: https://cbs-seu-nome.vercel.app/api
✅ Tudo na mesma URL!
```

---

## 🧪 Testar

1. **Acesse:** `https://seu-vercel-url.vercel.app`
2. **Teste calculadora:**
   - Clique em "Calcular"
   - Deve processar no `/api` do Vercel
3. **Teste PDF:**
   - Click "Baixar PDF"
   - Deve funcionar!
4. **Teste Login:**
   - Faça cadastro
   - Faça login

**Se tudo funcionar:** ✅ SUCESSO!

---

## ⚠️ Se Houver Erro

### Erro: "Cannot GET /api/calculate"
- Aguarde mais um tempo (Vercel pode estar compilando)
- Recarregue a página

### Erro: "CORS error"
- Já está configurado no backend
- Se persistir, aguarde deployment completar

### Erro: "Cannot find module"
- Vercel está recompilando
- Aguarde ~1-2 minutos

### Banco não funciona
- Vercel roda em `/tmp`, não persiste dados
- Para dados persistentes, use Vercel KV ou Supabase (opcional futuramente)

---

## 🔄 Auto-Deploy

Quando você faz push no GitHub:

```bash
git add .
git commit -m "Nova feature"
git push origin master
```

**Vercel automaticamente:**
1. ✅ Detecta push
2. ✅ Faz build
3. ✅ Deploy em minutos

---

## 📦 Estrutura do Projeto (Novo!)

```
cbs/
├── api/                 ← Backend Express (Serverless no Vercel)
│   ├── src/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── auth.ts
│   │   ├── googleMaps.ts
│   │   ├── pdf.ts
│   │   └── types.ts
│   ├── handler.ts
│   ├── index.ts        ← Entry point Vercel
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/            ← Frontend React/Vite
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── logo cbs.png
├── vercel.json         ← Config Vercel
├── package.json        ← Root
└── README.md
```

---

## 💾 Persistência de Dados

**Importante:** Vercel serverless functions rodam em `/tmp` que é efêmero.

Para dados **persistentes**, você tem opções:

### Opção 1: Vercel KV (Recomendado)
```
- Redis serverless da Vercel
- Grátis até 1000 operações/dia
- Setup em 2 minutos
```

### Opção 2: Supabase
```
- PostgreSQL serverless
- Grátis até 500MB
- Melhor para dados estruturados
```

### Opção 3: MongoDB Atlas
```
- NoSQL cloud
- Grátis até 5GB
- Fácil integração
```

**Por enquanto:** SQLite funciona, mas dados serão perdidos entre deployments.

---

## 🚀 Status Final

```
┌──────────────────────────────────┐
│     🎉 LIVE NO AR COM VERCEL! 🎉 │
├──────────────────────────────────┤
│ URL: seu-vercel-url.vercel.app   │
│ Frontend: ✅ React               │
│ Backend: ✅ Express serverless   │
│ Auto-deploy: ✅ GitHub           │
│ Custom domain: Configurável      │
└──────────────────────────────────┘
```

---

## 🎓 Próximos Passos (Opcionais)

1. **Domínio customizado**
   - Vercel → Settings → Domains
   
2. **Banco de dados persistente**
   - Integrar Vercel KV ou Supabase
   
3. **Variáveis de produção**
   - Alterar JWT_SECRET para algo seguro
   
4. **Monitoramento**
   - Sentry (erros)
   - LogRocket (performance)

---

**Pronto para produção!** 🎉
