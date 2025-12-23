#!/bin/bash

echo "=========================================="
echo "CONFIGURAÇÃO 24/7 - GURURUMA VILLAGE"
echo "Garantindo que o site rode sempre!"
echo "=========================================="
echo ""

cd /var/www/gururuma-village

echo "📋 Status atual do PM2..."
pm2 status

echo ""
echo "💾 Verificando se o PM2 está configurado para iniciar no boot..."

# Verificar se já existe startup configurado
if pm2 startup | grep -q "PM2"; then
    echo "✅ PM2 startup já configurado"
else
    echo "🔧 Configurando PM2 para iniciar automaticamente no boot do servidor..."
    pm2 startup
    
    echo ""
    echo "⚠️  IMPORTANTE: Execute o comando mostrado acima como root!"
    echo "   (O PM2 mostrará um comando que você precisa executar)"
fi

echo ""
echo "💾 Salvando lista de processos do PM2..."
pm2 save

echo ""
echo "🔧 Atualizando configuração do ecosystem para garantir auto-restart..."
# Garantir que o ecosystem tem todas as configurações de auto-restart
cat > ecosystem.gururuma.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gururuma-village',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
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

echo ""
echo "🔄 Reiniciando com nova configuração..."
pm2 delete gururuma-village 2>/dev/null
pm2 start ecosystem.gururuma.config.js
pm2 save

echo ""
echo "📊 Verificando configurações de monitoramento..."
echo ""

echo "✅ Configurações aplicadas:"
echo "   - autorestart: true (reinicia automaticamente se cair)"
echo "   - max_memory_restart: 500M (reinicia se usar muita memória)"
echo "   - min_uptime: 10s (tempo mínimo antes de considerar crash)"
echo "   - max_restarts: 10 (máximo de reinicializações)"
echo "   - restart_delay: 4000ms (delay entre reinicializações)"

echo ""
echo "🔍 Status atual:"
pm2 status

echo ""
echo "=========================================="
echo "✅ CONFIGURAÇÃO 24/7 CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📝 PRÓXIMOS PASSOS IMPORTANTES:"
echo ""
echo "1. Execute o comando que apareceu acima (pm2 startup systemd)"
echo "   Isso garante que o PM2 inicie automaticamente quando o servidor reiniciar"
echo ""
echo "2. Para monitorar o site:"
echo "   pm2 monit          - Monitor em tempo real"
echo "   pm2 logs           - Ver logs"
echo "   pm2 status         - Ver status"
echo ""
echo "3. Para testar se reinicia automaticamente:"
echo "   pm2 restart gururuma-village"
echo ""
echo "4. Verificar se está rodando:"
echo "   ss -tln | grep :3005"
echo ""
echo "✅ O site agora está configurado para rodar 24/7!"
echo ""












