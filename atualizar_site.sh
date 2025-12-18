#!/bin/bash

# Script para atualizar o site no servidor Hostinger
# Uso: Execute este script no terminal da Hostinger após fazer push no GitHub

echo "=========================================="
echo "ATUALIZAÇÃO DO SISTEMA GURURUMA VILLAGE"
echo "=========================================="
echo ""

cd /var/www/gururuma-village

echo "📥 Atualizando código do GitHub..."
git pull origin main || git pull origin master

if [ $? -ne 0 ]; then
    echo "❌ Erro ao atualizar do GitHub!"
    echo "Verifique se há conflitos ou problemas de conexão."
    exit 1
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



