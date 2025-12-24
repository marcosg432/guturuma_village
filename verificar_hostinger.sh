#!/bin/bash

echo "=========================================="
echo "VERIFICAÇÃO DO SERVIDOR HOSTINGER"
echo "=========================================="
echo ""

# Navegar para o diretório da aplicação
cd /var/www/gururuma-village 2>/dev/null || {
    echo "❌ Diretório /var/www/gururuma-village não encontrado!"
    exit 1
}

echo "📁 Diretório atual: $(pwd)"
echo ""

# Verificar se o PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não está instalado!"
    exit 1
fi

echo "🔍 Verificando status do PM2..."
pm2 status
echo ""

echo "🔍 Verificando processo gururuma-village..."
pm2 describe gururuma-village 2>/dev/null || echo "⚠️  Processo 'gururuma-village' não encontrado no PM2"
echo ""

echo "🔍 Verificando se a porta 3005 está em uso..."
ss -tln | grep ":3005" || netstat -tln | grep ":3005" || echo "⚠️  Porta 3005 não está sendo escutada"
echo ""

echo "📋 Últimas 20 linhas dos logs de erro..."
pm2 logs gururuma-village --lines 20 --err --nostream 2>/dev/null || echo "⚠️  Não foi possível ler os logs"
echo ""

echo "📋 Últimas 20 linhas dos logs de saída..."
pm2 logs gururuma-village --lines 20 --out --nostream 2>/dev/null || echo "⚠️  Não foi possível ler os logs"
echo ""

echo "=========================================="
echo "OPÇÕES PARA CORRIGIR:"
echo "=========================================="
echo ""
echo "1. Se o processo não estiver rodando:"
echo "   pm2 start ecosystem.gururuma.config.js"
echo "   ou"
echo "   pm2 start server.js --name gururuma-village -- --PORT=3005"
echo ""
echo "2. Se o processo estiver parado:"
echo "   pm2 restart gururuma-village"
echo ""
echo "3. Se houver problemas, recarregar:"
echo "   pm2 delete gururuma-village"
echo "   cd /var/www/gururuma-village"
echo "   git pull origin main"
echo "   pm2 start ecosystem.gururuma.config.js"
echo "   pm2 save"
echo ""
echo "4. Ver logs em tempo real:"
echo "   pm2 logs gururuma-village"
echo ""








