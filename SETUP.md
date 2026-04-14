# 🚀 Instalação e Configuração - CBS Calculadora de Frete

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Git (opcional)

## 📦 Instalação Rápida

### 1. Instalar dependências

```bash
# Instalar dependências do projeto raiz
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..

# Instalar dependências do frontend
cd frontend
npm install
cd ..
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Configure as variáveis:

```env
PORT=3001
JWT_SECRET=sua-chave-secreta-super-segura
GOOGLE_MAPS_API_KEY=sua-chave-api-google-maps (opcional)
```

**Nota sobre Google Maps API:**
- Se não configurar a chave, o sistema fará uma estimativa simples
- Para usar a API real, obtenha uma chave em: https://cloud.google.com/maps-platform

### 3. Executar em desenvolvimento

```bash
# Na raiz do projeto
npm run dev
```

Isso iniciará simultaneamente:
- **Backend** em http://localhost:3001
- **Frontend** em http://localhost:3000

## 🔑 Credenciais Padrão

Ao iniciar o servidor, um usuário admin é criado automaticamente:

- **Email:** admin@cbs.com
- **Senha:** admin123

⚠️ **Altere a senha após o primeiro login!**

## 📋 Funcionalidades Principais

### Para Clientes:
✅ Calculadora de frete por km  
✅ Suporte para 2 tipos de veículos (MUNK e PRANCHA)  
✅ Integração com Google Maps (opcional)  
✅ Estimativa automática de pedágio  
✅ Download de orçamento em PDF com logo  
✅ Criação de conta e login  

### Para Admin:
✅ Painel de administração  
✅ Gerenciamento de preços por veículo  
✅ Visualização de histórico de orçamentos  

## 🏗️ Estrutura do Projeto

```
CBS/
├── backend/                    # API Express
│   ├── src/
│   │   ├── index.ts           # Servidor principal
│   │   ├── database.ts        # SQLite
│   │   ├── auth.ts            # Autenticação JWT
│   │   ├── googleMaps.ts      # Integração Google Maps
│   │   ├── pdf.ts             # Geração de PDF
│   │   └── types.ts           # Tipos TypeScript
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Componente raiz
│   │   ├── index.css          # Estilos globais
│   │   └── components/
│   │       ├── Calculator.tsx # Calculadora
│   │       ├── Login.tsx      # Login/Registro
│   │       └── AdminPanel.tsx # Painel admin
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── logo cbs.png               # Logo da empresa
├── package.json               # Root package
├── .env.example               # Exemplo de variáveis
└── SETUP.md                   # Este arquivo
```

## 🛠️ Comandos Úteis

```bash
# Desenvolver com hot reload
npm run dev

# Compilar para produção
npm run build

# Iniciar servidor em produção
npm start

# Apenas backend
npm run dev:backend

# Apenas frontend
npm run dev:frontend
```

## 📊 Banco de Dados

O projeto usa SQLite com as seguintes tabelas:

- **users** - Clientes e admins
- **vehicle_prices** - Preços dos veículos
- **budgets** - Histórico de orçamentos

O banco é criado automaticamente na primeira execução: `backend/cbs.db`

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login

### Cálculo
- `POST /api/calculate` - Calcular frete
- `GET /api/budgets/:id` - Obter orçamento
- `GET /api/budgets/:id/pdf` - Baixar PDF

### Admin
- `GET /api/admin/vehicle-prices` - Listar preços
- `PUT /api/admin/vehicle-prices/:id` - Atualizar preço

## 🚀 Deploy

Para fazer deploy:

1. Compilar o projeto:
   ```bash
   npm run build
   ```

2. Mover `frontend/dist` para servir estaticamente no backend

3. Usar um servidor Node.js em produção (Heroku, AWS, DigitalOcean, etc.)

## 🐛 Troubleshooting

### Porta 3000/3001 já em uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Erro ao conectar Google Maps
- Verifique se a chave API está correta
- Verifique se a API Distance Matrix está ativada

### Logo não aparece
- Certifique-se de que "logo cbs.png" está na raiz do projeto
- Verifique o caminho no arquivo PDF (backend/src/pdf.ts)

## 📝 Customização

### Adicionar novo veículo
1. Atualize `backend/src/database.ts` - adicione na tabela `vehicle_prices`
2. Atualize `frontend/src/components/Calculator.tsx` - adicione opção no seletor

### Mudar cores
- Edite `frontend/src/index.css` - ajuste as variáveis CSS

### Ajustar estimativa de pedágio
- Edite `backend/src/googleMaps.ts` - função `estimateToll()`

## 🔒 Segurança

⚠️ **Para Produção:**
1. Altere `JWT_SECRET` para algo muito seguro
2. Use HTTPS
3. Configure CORS adequadamente
4. Use variáveis de ambiente seguras
5. Adicione rate limiting
6. Use banco de dados produção (PostgreSQL recomendado)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se Node.js está instalado corretamente
2. Limpe node_modules e reinstale: `rm -rf node_modules && npm install`
3. Verifique os logs do servidor

---

✨ **Plataforma pronta para uso!** Personalize conforme necessário.
