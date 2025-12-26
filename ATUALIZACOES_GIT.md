# Atualizações Realizadas - Resumo para Git

## Arquivos Modificados:

1. **public/reserva.html**
   - Botão "Finalizar Reserva" movido para o topo da página (sticky)
   - Melhor visibilidade do botão de finalização

2. **public/js/reserva-nova.js**
   - Validação de limite máximo de hóspedes por casa/suíte
   - Funcionalidade de desseleção de casa/suíte (clique novamente para desmarcar)
   - Botão de incrementar hóspedes desabilitado quando atinge o limite

3. **server.js**
   - Correção: Reservas canceladas não bloqueiam mais as datas
   - Correção: Verificação de disponibilidade por quarto_id específico (não por categoria)
   - Agora cada casa é verificada individualmente
   - Múltiplas correções nas queries para excluir reservas canceladas

## Para Atualizar no GitHub:

### Se você tiver Git instalado:

```bash
# Adicionar arquivos modificados
git add public/reserva.html
git add public/js/reserva-nova.js
git add server.js

# Fazer commit
git commit -m "Correções: Botão finalizar no topo, validação de hóspedes, desseleção de suítes, disponibilidade por quarto_id específico, reservas canceladas não bloqueiam datas"

# Enviar para o GitHub
git push origin main
```

### Se não tiver Git instalado:

1. Instale o Git: https://git-scm.com/download/win
2. Execute os comandos acima

Ou use o GitHub Desktop (mais fácil):
1. Baixe: https://desktop.github.com/
2. Clone o repositório
3. Faça commit das mudanças
4. Faça push

## Depois de atualizar no GitHub, no servidor Hostinger:

```bash
cd /var/www/gururuma-village
git pull origin main
pm2 restart gururuma-village
```















