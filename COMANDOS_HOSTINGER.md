# Comandos para Corrigir o Servidor Hostinger

## 1. Conectar ao servidor Hostinger via SSH

Acesse o servidor usando SSH com suas credenciais.

## 2. Verificar o status do servidor

Execute estes comandos no servidor Hostinger:

```bash
# Ir para o diretório da aplicação
cd /var/www/gururuma-village

# Verificar status do PM2
pm2 status

# Verificar se o processo está rodando
pm2 describe gururuma-village

# Verificar se a porta 3005 está ativa
ss -tln | grep ":3005"
```

## 3. Se o processo não estiver rodando, reiniciar:

```bash
cd /var/www/gururuma-village

# Opção 1: Reiniciar usando o arquivo de configuração
pm2 restart gururuma-village

# Se não funcionar, tentar iniciar novamente:
pm2 delete gururuma-village
pm2 start ecosystem.gururuma.config.js
pm2 save
```

## 4. Se ainda não funcionar, atualizar e reiniciar:

```bash
cd /var/www/gururuma-village

# Atualizar código do Git
git pull origin main

# Reinstalar dependências (se necessário)
npm install

# Deletar processo antigo
pm2 delete gururuma-village

# Iniciar novamente
pm2 start ecosystem.gururuma.config.js

# Salvar configuração PM2
pm2 save

# Verificar se está funcionando
pm2 status
pm2 logs gururuma-village --lines 50
```

## 5. Verificar logs para diagnóstico:

```bash
# Ver logs em tempo real
pm2 logs gururuma-village

# Ver apenas erros
pm2 logs gururuma-village --err

# Ver últimas 50 linhas
pm2 logs gururuma-village --lines 50 --nostream
```

