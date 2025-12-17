#!/bin/bash

echo "=========================================="
echo "VERIFICAÇÃO DO DEPLOY - GURURUMA VILLAGE"
echo "=========================================="
echo ""

echo "=== Status PM2 ==="
pm2 status

echo ""
echo "=== Verificando porta 3005 ==="
ss -tln | grep ":3005 " || netstat -tln | grep ":3005 " || echo "Porta 3005 não encontrada em LISTEN"

echo ""
echo "=== Últimas 30 linhas dos logs ==="
pm2 logs gururuma-village --lines 30 --nostream

echo ""
echo "=== Informações do processo ==="
pm2 info gururuma-village

echo ""
echo "=========================================="
echo "✅ Verificação concluída!"
echo "=========================================="



