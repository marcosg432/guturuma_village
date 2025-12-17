#!/bin/bash

# Script de Deploy - Sistema Gururuma Village
# Porta escolhida: 3005
# Diretório: /var/www/gururuma-village

set -e  # Parar em caso de erro

echo "=========================================="
echo "DEPLOY DO SISTEMA GURURUMA VILLAGE"
echo "Porta: 3005"
echo "=========================================="
echo ""

# Verificar se o diretório já existe
if [ -d "/var/www/gururuma-village" ]; then
    echo "⚠️  AVISO: O diretório /var/www/gururuma-village já existe!"
    echo "Deseja continuar? (isso irá atualizar o conteúdo existente)"
    read -p "Digite 'sim' para continuar: " resposta
    if [ "$resposta" != "sim" ]; then
        echo "Operação cancelada."
        exit 1
    fi
fi

# Criar diretório se não existir
echo "📁 Criando/verificando diretório..."
mkdir -p /var/www/gururuma-village
cd /var/www/gururuma-village

# Verificar se já é um repositório git
if [ -d ".git" ]; then
    echo "🔄 Atualizando repositório existente..."
    git pull origin main || git pull origin master
else
    echo "📥 Clonando repositório..."
    git clone https://github.com/marcosg432/guturuma_village.git .
fi

echo ""
echo "📦 Instalando dependências..."
npm install

echo ""
echo "🔧 Criando arquivo de configuração PM2 com PORT=3005..."
cat > ecosystem.gururuma.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gururuma-village',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3005
    }
  }]
};
EOF
mkdir -p logs

echo ""
echo "🛑 Parando processo PM2 existente (se houver)..."
pm2 delete gururuma-village 2>/dev/null || echo "Nenhum processo PM2 'gururuma-village' encontrado para parar."

echo ""
echo "🚀 Iniciando aplicação com PM2 na porta 3005..."
pm2 start ecosystem.gururuma.config.js

echo ""
echo "💾 Salvando configuração PM2..."
pm2 save

echo ""
echo "=========================================="
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=========================================="
echo ""
echo "🌐 Aplicação rodando em: http://193.160.119.67:3005"
echo "📊 Status PM2: pm2 status"
echo "📋 Logs: pm2 logs gururuma-village"
echo "🛑 Parar: pm2 stop gururuma-village"
echo "▶️  Iniciar: pm2 start gururuma-village"
echo ""
echo "✅ Sistema configurado sem afetar outros sistemas existentes!"
echo ""

