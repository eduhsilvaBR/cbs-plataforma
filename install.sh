#!/bin/bash

echo "🚀 Instalando CBS Calculadora de Frete..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "Instale em: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detectado: $(node --version)"
echo ""

# Instalar dependências
echo "📦 Instalando dependências do projeto raiz..."
npm install

echo ""
echo "📦 Instalando dependências do backend..."
cd backend
npm install
cd ..

echo ""
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "Para começar:"
echo "  npm run dev"
echo ""
echo "Credenciais de demo:"
echo "  Email: admin@cbs.com"
echo "  Senha: admin123"
echo ""
