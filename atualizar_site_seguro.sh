#!/bin/bash

# Script para atualizar o site no servidor Hostinger
# Resolve conflitos de mudanças locais

echo "=========================================="
echo "ATUALIZAÇÃO DO SISTEMA GURURUMA VILLAGE"
echo "=========================================="
echo ""

cd /var/www/gururuma-village

echo "📋 Verificando mudanças locais..."
git status

echo ""
echo "💾 Fazendo backup das mudanças locais..."
git stash save "Backup antes de atualizar $(date +%Y-%m-%d_%H:%M:%S)"

echo ""
echo "📥 Atualizando código do GitHub..."
git pull origin main || git pull origin master

if [ $? -ne 0 ]; then
    echo "❌ Erro ao atualizar do GitHub!"
    echo "🔄 Restaurando mudanças locais..."
    git stash pop
    exit 1
fi

echo ""
echo "🔧 Aplicando mudança crítica (0.0.0.0) se necessário..."
# Garantir que o server.js está escutando em 0.0.0.0
if ! grep -q "app.listen(PORT, '0.0.0.0'" server.js; then
    echo "Aplicando correção para aceitar conexões externas..."
    sed -i "s/app\.listen(PORT, () => {/app.listen(PORT, '0.0.0.0', () => {/g" server.js
    echo "✅ Correção aplicada"
else
    echo "✅ Server já está configurado corretamente (0.0.0.0)"
fi

echo ""
echo "📦 Instalando novas dependências (se houver)..."
npm install

echo ""
echo "🔄 Reiniciando aplicação PM2..."
pm2 restart gururuma-village

echo ""
echo "⏳ Aguardando 3 segundos..."
sleep 3

echo ""
echo "📋 Verificando status..."
pm2 status | grep gururuma-village

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "🌐 Site disponível em: http://193.160.119.67:3005"
echo ""


















