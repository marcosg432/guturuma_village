#!/bin/bash

echo "=========================================="
echo "CONFIGURAÇÃO DE FIREWALL - Porta 3005"
echo "=========================================="
echo ""

echo "🔍 Verificando qual firewall está em uso..."

# Verificar UFW
if command -v ufw &> /dev/null; then
    echo "✅ UFW encontrado"
    echo "📋 Status atual do UFW:"
    ufw status
    
    echo ""
    echo "🔧 Permitindo porta 3005 no UFW..."
    ufw allow 3005/tcp
    echo "✅ Porta 3005 liberada no UFW"
    
# Verificar firewalld
elif command -v firewall-cmd &> /dev/null; then
    echo "✅ firewalld encontrado"
    echo "📋 Status atual do firewalld:"
    firewall-cmd --list-all
    
    echo ""
    echo "🔧 Permitindo porta 3005 no firewalld..."
    firewall-cmd --permanent --add-port=3005/tcp
    firewall-cmd --reload
    echo "✅ Porta 3005 liberada no firewalld"
    
# Verificar iptables
elif command -v iptables &> /dev/null; then
    echo "✅ iptables encontrado"
    echo "📋 Regras atuais do iptables:"
    iptables -L -n | grep 3005 || echo "Nenhuma regra encontrada para porta 3005"
    
    echo ""
    echo "🔧 Adicionando regra no iptables para porta 3005..."
    iptables -I INPUT -p tcp --dport 3005 -j ACCEPT
    
    # Tentar salvar as regras (depende da distribuição)
    if command -v iptables-save &> /dev/null; then
        iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
        iptables-save > /etc/iptables.rules 2>/dev/null || \
        echo "⚠️  Atenção: Regra adicionada, mas pode ser necessário salvar manualmente"
    fi
    echo "✅ Porta 3005 liberada no iptables"
    
else
    echo "⚠️  Nenhum firewall encontrado ou gerenciado automaticamente"
    echo "📋 Verificando regras iptables diretas..."
    iptables -L -n 2>/dev/null | head -20 || echo "Não foi possível verificar iptables"
fi

echo ""
echo "=========================================="
echo "✅ Verificação de firewall concluída!"
echo "=========================================="



















