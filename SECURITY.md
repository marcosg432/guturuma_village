# Documentação de Segurança

Este documento descreve as medidas de segurança implementadas no sistema.

## Resumo das Implementações

### 1. Autenticação e Autorização

- **JWT Tokens**: Autenticação baseada em tokens JWT
- **Refresh Tokens**: Suporte a refresh tokens para renovação de sessão
- **RBAC (Role-Based Access Control)**: Controle de acesso baseado em roles
  - `admin`: Acesso total ao sistema
  - `funcionario`: Acesso limitado (futuro)
  - `hospede`: Acesso apenas a recursos próprios (futuro)

### 2. Rate Limiting

- **Login**: Máximo 5 tentativas por IP a cada 15 minutos
- **APIs Públicas**: Máximo 100 requisições por IP a cada 15 minutos
- **APIs Administrativas**: Máximo 200 requisições por IP a cada 15 minutos

### 3. Validação e Sanitização

- **Validação de Inputs**: Todos os inputs são validados antes do processamento
- **Sanitização**: Remoção de caracteres potencialmente perigosos (XSS)
- **Prepared Statements**: Todas as queries SQL usam prepared statements (prevenção de SQL Injection)

### 4. Headers de Segurança

- **Helmet**: Implementado para adicionar headers de segurança HTTP
- **CSP (Content Security Policy)**: Configurado para prevenir XSS
- **HSTS**: Habilitado para forçar HTTPS em produção

### 5. Logs de Segurança

Todos os eventos de segurança são registrados em `logs/security/`:
- Tentativas de login (sucesso/falha)
- Acessos não autorizados
- Ações administrativas
- Atividades suspeitas

### 6. Proteção de Dados

- **Senhas**: Sempre hasheadas com bcrypt (nunca em texto plano)
- **Tokens**: Nunca logados ou expostos
- **Dados Sensíveis**: Mascarados nas respostas quando necessário

## Variáveis de Ambiente

Configure as seguintes variáveis em produção (arquivo `.env`):

```env
JWT_SECRET=<chave-secreta-forte>
JWT_REFRESH_SECRET=<chave-secreta-refresh-forte>
NODE_ENV=production
CORS_ORIGIN=<seus-dominios>
```

**⚠️ IMPORTANTE**: Gere chaves secretas fortes usando:
```bash
openssl rand -base64 32
```

## Boas Práticas

1. **Nunca commite** arquivos `.env` ou credenciais
2. **Use HTTPS** em produção
3. **Mantenha dependências atualizadas**
4. **Revise logs de segurança** regularmente
5. **Use senhas fortes** para contas administrativas

## Vulnerabilidades Conhecidas

### Resolvidas ✅
- SQL Injection (prepared statements)
- XSS básico (sanitização)
- Brute force (rate limiting)
- Senhas em texto plano (bcrypt)

### Melhorias Futuras 🔄
- Implementar 2FA para administradores
- Adicionar CSRF tokens para forms
- Implementar rate limiting mais granular
- Adicionar monitoramento de segurança em tempo real

