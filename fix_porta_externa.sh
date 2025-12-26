#!/bin/bash

echo "=========================================="
echo "CORREÇÃO: Permitir acesso externo porta 3005"
echo "=========================================="
echo ""

cd /var/www/gururuma-village

echo "📝 Fazendo backup do server.js..."
cp server.js server.js.backup

echo "🔧 Alterando app.listen para aceitar conexões externas..."
# Substituir app.listen(PORT, ...) por app.listen(PORT, '0.0.0.0', ...)
sed -i "s/app\.listen(PORT, () => {/app.listen(PORT, '0.0.0.0', () => {/g" server.js

echo "✅ Alteração aplicada!"
echo ""
echo "🛑 Reiniciando aplicação PM2..."
pm2 restart gururuma-village

echo ""
echo "⏳ Aguardando 3 segundos..."
sleep 3

echo ""
echo "🔍 Verificando se está escutando em 0.0.0.0:3005..."
ss -tln | grep ":3005" || netstat -tln | grep ":3005"

echo ""
echo "📋 Últimas linhas dos logs..."
pm2 logs gururuma-village --lines 10 --nostream

echo ""
echo "=========================================="
echo "✅ Correção aplicada!"
echo "Tente acessar: http://193.160.119.67:3005"
echo "=========================================="

















