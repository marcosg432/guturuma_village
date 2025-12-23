# 📊 Guia de Gerenciamento do Banco de Dados SQLite

Este projeto usa **SQLite** como banco de dados embutido. Todos os dados são armazenados em um único arquivo: `database/brisa_imperial.db`

## 🛠️ Scripts Disponíveis

Foram criados 3 scripts para facilitar o gerenciamento do banco:

### 1. Visualizar Banco de Dados

Exibe um resumo completo do banco de dados, incluindo:
- Lista de todas as tabelas
- Estatísticas (quantidade de registros por tabela)
- Últimas reservas
- Mensagens de contato recentes
- Usuários administrativos

**Como usar:**
```bash
npm run visualizar
# ou
node visualizar-banco.js
```

### 2. Fazer Backup do Banco

Cria uma cópia do banco de dados com data e hora no nome do arquivo.

**Como usar:**
```bash
npm run backup
# ou
node backup-banco.js
```

**Onde fica o backup?**
- Diretório: `backups/`
- Nome do arquivo: `brisa_imperial_backup_YYYY-MM-DD_HH-MM-SS.db`

**Importante:**
- Os backups são salvos automaticamente na pasta `backups/`
- O script lista os últimos 10 backups criados
- É recomendado fazer backup antes de atualizações importantes

### 3. Restaurar Backup

Restaura um backup anterior do banco de dados.

**Como usar:**
```bash
npm run restaurar
# ou
node restaurar-banco.js
```

**Funcionamento:**
1. Lista todos os backups disponíveis
2. Você escolhe qual backup restaurar
3. Faz backup automático do banco atual antes de restaurar
4. Substitui o banco atual pelo backup escolhido

**⚠️ ATENÇÃO:** 
- Esta operação **substitui** o banco atual
- Um backup automático do banco atual é criado antes da restauração
- É necessário **reiniciar o servidor** após restaurar

## 📋 Estrutura do Banco

### Tabelas Principais:

- **`users_admin`** - Usuários do painel administrativo
- **`reservas`** - Reservas dos clientes
- **`quartos`** - Quartos disponíveis
- **`contact_messages`** - Mensagens do formulário de contato
- **`historico_check`** - Histórico de check-in/check-out
- **`hospedes`** - Dados dos hóspedes
- **`configuracoes`** - Configurações do sistema
- **`allowed_emails`** - Emails autorizados

## 🔒 Localização dos Arquivos

```
projeto/
├── database/
│   └── brisa_imperial.db    # Banco de dados principal
├── backups/
│   └── brisa_imperial_backup_*.db  # Backups automáticos
└── scripts/
    ├── visualizar-banco.js
    ├── backup-banco.js
    └── restaurar-banco.js
```

## 💡 Dicas Importantes

1. **Backups Regulares**: Faça backup antes de atualizações importantes
2. **Limpeza**: Delete backups antigos periodicamente para economizar espaço
3. **Segurança**: Os backups contêm dados sensíveis, mantenha-os seguros
4. **Servidor**: Sempre reinicie o servidor após restaurar um backup

## 🚨 Em Caso de Problemas

Se o banco corromper ou você perder dados:
1. Pare o servidor
2. Execute `npm run restaurar`
3. Escolha o backup mais recente antes do problema
4. Reinicie o servidor

## 📦 Backup Manual

Você também pode fazer backup manualmente copiando o arquivo:
```bash
# Windows
copy database\brisa_imperial.db backups\backup_manual.db

# Linux/Mac
cp database/brisa_imperial.db backups/backup_manual.db
```

## 🔍 Verificar Tamanho do Banco

```bash
# Windows PowerShell
(Get-Item database\brisa_imperial.db).Length / 1MB

# Linux/Mac
du -h database/brisa_imperial.db
```






