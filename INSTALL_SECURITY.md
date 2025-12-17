# Instalação das Dependências de Segurança

Para completar a implementação de segurança, você precisa instalar as dependências necessárias:

## 1. Instalar Dependências

Execute no terminal:

```bash
npm install express-rate-limit helmet
```

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
# Configuração do Servidor
PORT=5000
NODE_ENV=production

# Segurança JWT (GERE VALORES ÚNICOS E SEGUROS!)
# Use: openssl rand -base64 32
JWT_SECRET=sua-chave-secreta-jwt-muito-forte-aqui
JWT_REFRESH_SECRET=sua-chave-secreta-refresh-muito-forte-aqui

# CORS (em produção, especifique domínios permitidos separados por vírgula)
CORS_ORIGIN=*
```

**⚠️ IMPORTANTE**: 
- NUNCA commite o arquivo `.env` no Git
- Gere chaves secretas fortes usando: `openssl rand -base64 32`
- Use valores diferentes para JWT_SECRET e JWT_REFRESH_SECRET

## 3. Verificar Instalação

Após instalar, reinicie o servidor:

```bash
npm start
```

## 4. Estrutura Criada

A implementação de segurança criou:

- `middleware/security.js` - Rate limiting, sanitização, headers
- `middleware/validation.js` - Validações de inputs
- `middleware/auth.js` - Autenticação e autorização (RBAC)
- `middleware/logger.js` - Logs de segurança
- `logs/security/` - Diretório para logs (criado automaticamente)

## Melhorias Implementadas

✅ Rate limiting em todas as rotas  
✅ Validação de inputs  
✅ Sanitização anti-XSS  
✅ Headers de segurança  
✅ Logs de segurança  
✅ RBAC (Role-Based Access Control)  
✅ Refresh tokens  
✅ Prepared statements (SQL Injection protection)  

## Notas

- O código inclui fallbacks caso as dependências não estejam instaladas
- Os logs de segurança são salvos em `logs/security/security-YYYY-MM-DD.log`
- Em produção, configure CORS_ORIGIN com seus domínios específicos

