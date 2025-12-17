# 🔄 Guia de Atualização na Hostinger

## Passos para Atualizar o Servidor

### 1. Conectar via SSH

```bash
ssh root@193.160.119.67
```

### 2. Navegar até o diretório do projeto

```bash
cd /var/www/gururuma-village
```

### 3. Fazer pull das atualizações

```bash
git pull origin main
```

### 4. ⚠️ IMPORTANTE: Instalar Novas Dependências

**SIM, você precisa instalar as novas dependências na Hostinger!**

As novas dependências de segurança que foram adicionadas ao `package.json` são:
- `express-rate-limit`
- `helmet`

Execute:

```bash
npm install express-rate-limit helmet
```

Ou para garantir que todas as dependências estão atualizadas:

```bash
npm install
```

### 5. Configurar Variáveis de Ambiente (Opcional mas Recomendado)

Se ainda não tiver um arquivo `.env`, crie:

```bash
nano .env
```

Adicione:

```env
PORT=3005
NODE_ENV=production
JWT_SECRET=<sua-chave-secreta-forte>
JWT_REFRESH_SECRET=<sua-chave-refresh-forte>
CORS_ORIGIN=*
```

**Para gerar chaves secretas fortes:**

```bash
openssl rand -base64 32
```

Use o resultado para `JWT_SECRET` e gere outro para `JWT_REFRESH_SECRET`.

### 6. Reiniciar a Aplicação PM2

```bash
pm2 restart gururuma-village
```

Ou se estiver usando o arquivo de configuração:

```bash
pm2 restart ecosystem.config.js
```

### 7. Verificar se está funcionando

```bash
pm2 status
pm2 logs gururuma-village --lines 50
```

Verifique se não há erros relacionados a módulos não encontrados.

## ⚠️ Comandos Completos (Copy-Paste)

```bash
# Conectar
ssh root@193.160.119.67

# Navegar e atualizar
cd /var/www/gururuma-village
git pull origin main

# Instalar dependências (IMPORTANTE!)
npm install express-rate-limit helmet

# Reiniciar
pm2 restart gururuma-village

# Verificar
pm2 status
pm2 logs gururuma-village --lines 20
```

## 📝 Notas

- As dependências são **obrigatórias** - sem elas, o servidor pode não iniciar corretamente
- O código tem fallbacks caso as dependências não estejam instaladas, mas funcionalidades de segurança não funcionarão
- Se houver erro de módulo não encontrado, execute `npm install` novamente
- O diretório `logs/security/` será criado automaticamente quando o servidor iniciar

## 🔍 Verificação Pós-Deploy

Após o deploy, teste:

1. ✅ Login no painel admin funciona
2. ✅ Rate limiting está funcionando (tente fazer login errado 6 vezes seguidas - deve bloquear)
3. ✅ Rotas administrativas estão protegidas
4. ✅ Não há erros nos logs do PM2

Se algo não funcionar, verifique os logs:

```bash
pm2 logs gururuma-village
```

