# Documentação - Integração com Channel Manager

## 📋 Visão Geral

Este sistema implementa uma integração completa com Channel Managers (Cloudbeds, Smoobu, Beds24, etc.) para sincronização bidirecional com canais de distribuição como Booking.com, Airbnb e outros.

### Arquitetura

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│  MEU SISTEMA    │ ◄─────► │ CHANNEL MANAGER  │ ◄─────► │  BOOKING.COM │
│  (Village       │         │  (Cloudbeds,     │         │  AIRBNB, etc │
│   Residences)   │         │   Smoobu, etc)   │         │              │
└─────────────────┘         └──────────────────┘         └──────────────┘
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

1. **propriedades** - Propriedades (hotéis/pousadas)
   - `id`, `nome`, `codigo_externo`, `ativo`, `created_at`, `updated_at`

2. **canais** - Canais de distribuição configurados
   - `id`, `nome`, `tipo`, `api_key`, `api_secret`, `webhook_url`, `ativo`, `configuracao`

3. **room_channel_mapping** - Mapeamento de quartos com códigos externos
   - `id`, `quarto_id`, `canal_id`, `room_code_externo`, `sync_ativo`

4. **disponibilidade** - Disponibilidade por data
   - `id`, `quarto_id`, `data`, `disponivel`, `bloqueado`, `motivo_bloqueio`

5. **tarifas** - Tarifas por data
   - `id`, `quarto_id`, `data`, `preco`, `preco_minimo`, `preco_maximo`

6. **reservas_externas** - Reservas vindas de canais externos
   - `id`, `codigo_externo`, `canal_id`, `quarto_id`, `categoria`, `nome_completo`, `email`, `telefone`, `check_in`, `check_out`, `num_hospedes`, `adultos`, `criancas`, `valor_total`, `status`, `dados_originais`, `sync_status`

7. **sync_logs** - Logs de sincronização
   - `id`, `canal_id`, `tipo_operacao`, `direcao`, `status`, `dados_enviados`, `dados_recebidos`, `erro`, `created_at`

### Colunas Adicionadas às Tabelas Existentes

- **quartos**: `propriedade_id`, `codigo_externo`
- **reservas**: `origem`, `codigo_externo`, `canal_id`

## 🔌 Endpoints da API

### 1. Buscar Disponibilidade

**GET** `/api/channel-manager/availability/:quartoId`

**Query Parameters:**
- `check_in` (obrigatório) - Data de check-in (YYYY-MM-DD)
- `check_out` (obrigatório) - Data de check-out (YYYY-MM-DD)

**Exemplo:**
```bash
GET /api/channel-manager/availability/1?check_in=2024-12-01&check_out=2024-12-05
```

**Resposta:**
```json
{
  "success": true,
  "quarto_id": 1,
  "periodo": {
    "check_in": "2024-12-01",
    "check_out": "2024-12-05"
  },
  "disponibilidade": [
    {
      "data": "2024-12-01",
      "disponivel": 1,
      "preco": 150.00
    },
    {
      "data": "2024-12-02",
      "disponivel": 1,
      "preco": 150.00
    }
  ]
}
```

### 2. Receber Reserva Externa

**POST** `/api/channel-manager/reservation`

**Body:**
```json
{
  "codigo_externo": "BK123456",
  "canal_id": 1,
  "quarto_id": 1,
  "categoria": "Suíte Deluxe",
  "nome_completo": "João Silva",
  "email": "joao@example.com",
  "telefone": "+5511999999999",
  "check_in": "2024-12-01",
  "check_out": "2024-12-05",
  "num_hospedes": 2,
  "adultos": 2,
  "criancas": 0,
  "valor_total": 600.00,
  "status": "Confirmado",
  "dados_originais": {}
}
```

**Resposta (Sucesso):**
```json
{
  "success": true,
  "codigo_externo": "BK123456",
  "message": "Reserva externa processada com sucesso"
}
```

**Resposta (Overbooking - 409 Conflict):**
```json
{
  "success": false,
  "error": "Quarto não disponível para as datas solicitadas",
  "codigo_externo": "BK123456"
}
```

### 3. Processar Cancelamento

**POST** `/api/channel-manager/cancel`

**Body:**
```json
{
  "codigo_externo": "BK123456",
  "canal_id": 1
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Cancelamento processado e disponibilidade liberada"
}
```

### 4. Listar Quartos

**GET** `/api/channel-manager/rooms`

**Resposta:**
```json
{
  "success": true,
  "quartos": [
    {
      "id": 1,
      "categoria": "Suíte Deluxe",
      "numero": 101,
      "capacidade": 2,
      "preco_base": 150.00,
      "disponivel": 1
    }
  ]
}
```

### 5. Listar Canais

**GET** `/api/channel-manager/channels`

### 6. Listar Mapeamentos

**GET** `/api/channel-manager/mappings?quarto_id=1&canal_id=1`

### 7. Logs de Sincronização (Admin)

**GET** `/api/channel-manager/sync-logs?canal_id=1&limit=100`

**Requer autenticação admin.**

## 🛡️ Prevenção de Overbooking

O sistema implementa prevenção automática de overbooking através de:

1. **Verificação antes de criar reserva**: A função `verificarDisponibilidade()` verifica:
   - Bloqueios manuais na tabela `disponibilidade`
   - Reservas confirmadas ou pendentes na tabela `reservas`
   - Reservas externas confirmadas ou pendentes na tabela `reservas_externas`

2. **Bloqueio automático**: Quando uma reserva é confirmada (interna ou externa), o sistema bloqueia automaticamente todas as datas do período na tabela `disponibilidade`.

3. **Liberação automática**: Quando uma reserva é cancelada, o sistema verifica se não há outras reservas para aquelas datas e libera a disponibilidade automaticamente.

## 📝 Fluxo de Sincronização

### Enviando Disponibilidade ao Channel Manager

1. Channel Manager faz requisição GET para `/api/channel-manager/availability/:quartoId`
2. Sistema retorna disponibilidade e preços para o período solicitado
3. Channel Manager atualiza seus canais (Booking.com, Airbnb, etc.)

### Recebendo Reserva do Channel Manager

1. Booking.com recebe reserva → Channel Manager processa
2. Channel Manager faz POST para `/api/channel-manager/reservation`
3. Sistema verifica disponibilidade (prevenção de overbooking)
4. Se disponível:
   - Cria registro em `reservas_externas`
   - Bloqueia disponibilidade automaticamente
   - Registra log de sincronização
   - Retorna sucesso
5. Se não disponível:
   - Retorna erro 409 (Conflict)
   - Registra log de erro
   - Não cria reserva

### Processando Cancelamento

1. Booking.com cancela reserva → Channel Manager processa
2. Channel Manager faz POST para `/api/channel-manager/cancel`
3. Sistema:
   - Atualiza status da reserva externa para "Cancelado"
   - Verifica se há outras reservas para as datas
   - Libera disponibilidade se não houver conflitos
   - Registra log de sincronização

## 🔧 Configuração Inicial

### 1. Criar Propriedade

```sql
INSERT INTO propriedades (nome, codigo_externo, ativo) 
VALUES ('Village Residences', 'VR001', 1);
```

### 2. Criar Canal (ex: Booking.com via Cloudbeds)

```sql
INSERT INTO canais (nome, tipo, ativo, configuracao) 
VALUES ('Booking.com', 'booking', 1, '{"api_url": "https://api.cloudbeds.com"}');
```

### 3. Mapear Quarto com Código Externo

```sql
INSERT INTO room_channel_mapping (quarto_id, canal_id, room_code_externo, sync_ativo) 
VALUES (1, 1, 'ROOM_BK_001', 1);
```

## 📊 Logs e Monitoramento

Todos os eventos de sincronização são registrados na tabela `sync_logs`:

- **tipo_operacao**: 'reserva', 'disponibilidade', 'tarifa', 'cancelamento'
- **direcao**: 'enviado', 'recebido'
- **status**: 'sucesso', 'erro', 'pendente'
- **dados_enviados/recebidos**: JSON com os dados da operação
- **erro**: Mensagem de erro (se houver)

## 🔐 Segurança

- Todos os endpoints usam `apiLimiter` para rate limiting
- Endpoints administrativos requerem autenticação (`authenticateToken`, `requireAdmin`)
- Dados são sanitizados antes de inserção no banco
- Logs de sincronização incluem dados completos para auditoria

## 🚀 Próximos Passos

1. **Configurar Channel Manager**: Escolher e configurar um Channel Manager (Cloudbeds, Smoobu, Beds24)
2. **Configurar Webhooks**: Configurar webhooks no Channel Manager para receber reservas automaticamente
3. **Testar Integração**: Fazer reservas de teste no Booking.com e verificar sincronização
4. **Monitorar Logs**: Acompanhar logs de sincronização para identificar problemas
5. **Configurar Tarifas Dinâmicas**: Implementar lógica de tarifas dinâmicas baseada em demanda

## 📚 Referências

- [Cloudbeds API Documentation](https://developers.cloudbeds.com/)
- [Smoobu API Documentation](https://www.smoobu.com/api-documentation/)
- [Beds24 API Documentation](https://beds24.com/api.html)

## ⚠️ Observações Importantes

1. **Sem referências a praia/mar**: Todo o código foi desenvolvido sem referências a praia, mar ou termos relacionados, conforme solicitado.

2. **Padronização de textos**: Nomes e labels podem ser exibidos em MAIÚSCULO no frontend conforme necessário.

3. **Múltiplos canais**: A arquitetura suporta múltiplos canais simultaneamente. Cada canal pode ter seu próprio mapeamento de quartos.

4. **Sincronização em tempo real**: O sistema bloqueia disponibilidade imediatamente ao receber uma reserva, prevenindo overbooking.

5. **Compatibilidade**: O sistema é compatível com os principais Channel Managers do mercado (Cloudbeds, Smoobu, Beds24, etc.).





