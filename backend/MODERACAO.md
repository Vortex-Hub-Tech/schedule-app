# Sistema de Moderação de Avaliações

## Visão Geral

O sistema de moderação automática foi implementado para garantir que apenas avaliações apropriadas sejam exibidas publicamente. Ele combina moderação automática com a opção de revisão manual.

## Campos Adicionados ao Banco de Dados

A tabela `feedbacks` agora possui os seguintes campos de moderação:

- `moderation_status` (VARCHAR): Status da moderação - pode ser:
  - `pending`: Aguardando moderação manual
  - `approved`: Aprovado e exibido publicamente
  - `rejected`: Rejeitado e não exibido
  
- `moderation_reason` (TEXT): Motivo da aprovação/rejeição automática ou manual
- `moderated_at` (TIMESTAMP): Data e hora da moderação
- `moderated_by` (VARCHAR): Nome do moderador (para moderação manual)
- `auto_moderated` (BOOLEAN): Indica se foi moderado automaticamente

## Como Funciona a Moderação Automática

### Critérios de Detecção

O sistema analisa automaticamente cada avaliação criada e detecta:

1. **Palavras Inadequadas**: Lista de palavrões e termos ofensivos em português
2. **Padrões Suspeitos**:
   - URLs e links (possível spam)
   - Números de telefone (possível spam)
   - Excesso de caracteres repetidos
   - Texto todo em maiúsculas
3. **Comentários Muito Curtos**: Menos de 3 caracteres

### Níveis de Severidade

- **none**: Nenhum problema detectado → Aprovado automaticamente
- **low**: Problema menor → Aprovado automaticamente com alerta
- **medium**: Possível problema → Bloqueado (pending) e requer moderação manual
- **high**: Problema sério → Bloqueado (pending) e requer moderação manual

### Decisão Automática

- **Severidade alta**: Avaliação bloqueada (status `pending`) - requer moderação manual
- **Severidade média**: Avaliação bloqueada (status `pending`) - requer moderação manual
- **Severidade baixa**: Avaliação aprovada automaticamente (status `approved`) com alerta
- **Nenhum problema**: Avaliação aprovada automaticamente (status `approved`)

## Endpoints da API

### 1. Criar Avaliação (com moderação automática)

```http
POST /api/feedbacks
```

**Body:**
```json
{
  "appointment_id": 1,
  "rating": 5,
  "comment": "Ótimo serviço!"
}
```

**Resposta:**
```json
{
  "id": 1,
  "tenant_id": "tenant123",
  "appointment_id": 1,
  "rating": 5,
  "comment": "Ótimo serviço!",
  "moderation_status": "approved",
  "moderation_reason": null,
  "moderated_at": "2025-11-23T15:00:00Z",
  "auto_moderated": true,
  "created_at": "2025-11-23T15:00:00Z",
  "moderation": {
    "auto_approved": true,
    "severity": "none",
    "requires_review": false
  }
}
```

### 2. Listar Avaliações (apenas aprovadas)

```http
GET /api/feedbacks
```

Por padrão, retorna apenas avaliações aprovadas. Para incluir todas:

```http
GET /api/feedbacks?include_all=true
```

### 3. Listar Avaliações Pendentes de Moderação

```http
GET /api/feedbacks/moderation/pending
```

**Resposta:**
```json
[
  {
    "id": 2,
    "rating": 1,
    "comment": "Comentário com palavras inadequadas",
    "moderation_status": "pending",
    "moderation_reason": "Palavras inadequadas detectadas: ...",
    "auto_moderated": true,
    "client_name": "João Silva",
    "service_name": "Corte de Cabelo"
  }
]
```

### 4. Estatísticas de Moderação

```http
GET /api/feedbacks/moderation/stats
```

**Resposta:**
```json
{
  "total": "100",
  "approved": "85",
  "rejected": "10",
  "pending": "5",
  "auto_moderated": "90",
  "manual_moderated": "10"
}
```

### 5. Aprovar Avaliação Manualmente

```http
POST /api/feedbacks/moderation/:id/approve
```

**Body:**
```json
{
  "moderator_name": "Admin João"
}
```

**Resposta:**
```json
{
  "message": "Avaliação aprovada com sucesso",
  "feedback": { ... }
}
```

### 6. Rejeitar Avaliação Manualmente

```http
POST /api/feedbacks/moderation/:id/reject
```

**Body:**
```json
{
  "reason": "Conteúdo ofensivo",
  "moderator_name": "Admin João"
}
```

**Resposta:**
```json
{
  "message": "Avaliação rejeitada com sucesso",
  "feedback": { ... }
}
```

### 7. Reverter Decisão de Moderação

```http
POST /api/feedbacks/moderation/:id/revert
```

Volta a avaliação para o status `pending`, permitindo uma nova análise.

**Resposta:**
```json
{
  "message": "Decisão de moderação revertida com sucesso",
  "feedback": { ... }
}
```

## Fluxo Recomendado

### Para Usuários (Cliente)

1. Cliente cria uma avaliação após um serviço realizado
2. Sistema analisa automaticamente o conteúdo
3. Se aprovado: avaliação aparece imediatamente
4. Se bloqueado: avaliação fica pendente de revisão manual

### Para Administradores (Prestador)

1. Verificar periodicamente `/api/feedbacks/moderation/pending`
2. Revisar avaliações pendentes
3. Aprovar avaliações legítimas que foram bloqueadas por engano
4. Rejeitar avaliações realmente inadequadas
5. Acompanhar estatísticas em `/api/feedbacks/moderation/stats`

## Personalizando a Moderação

Para ajustar as regras de moderação, edite o arquivo `backend/services/moderation.js`:

- **inappropriateWords**: Lista de palavras a detectar
- **suspiciousPatterns**: Expressões regulares para padrões suspeitos
- **moderateContent()**: Lógica de decisão automática

## Exemplos de Uso

### Exemplo 1: Avaliação Aprovada Automaticamente

```javascript
// Cliente envia avaliação normal
POST /api/feedbacks
{
  "appointment_id": 1,
  "rating": 5,
  "comment": "Adorei o atendimento, muito profissional!"
}

// Resposta: auto_approved = true, severity = "none"
// Avaliação aparece imediatamente para outros usuários
```

### Exemplo 2: Avaliação Bloqueada Automaticamente

```javascript
// Cliente envia avaliação com palavras inadequadas
POST /api/feedbacks
{
  "appointment_id": 2,
  "rating": 1,
  "comment": "Que porra de serviço, tudo uma merda!"
}

// Resposta: auto_approved = false, severity = "high"
// Avaliação fica pendente de revisão manual
// Admin precisa aprovar ou rejeitar manualmente
```

### Exemplo 3: Revisão Manual

```javascript
// Admin lista avaliações pendentes
GET /api/feedbacks/moderation/pending

// Admin aprova uma avaliação legítima que foi bloqueada
POST /api/feedbacks/moderation/5/approve
{
  "moderator_name": "João Silva"
}

// Ou rejeita uma avaliação realmente inadequada
POST /api/feedbacks/moderation/6/reject
{
  "reason": "Conteúdo ofensivo e agressivo",
  "moderator_name": "João Silva"
}
```

## Benefícios

✅ **Proteção Automática**: Bloqueia automaticamente conteúdo inadequado
✅ **Moderação Inteligente**: Diferentes níveis de severidade
✅ **Flexibilidade**: Permite revisão e aprovação manual
✅ **Transparência**: Histórico completo de moderações
✅ **Estatísticas**: Acompanhe o volume de moderações
✅ **Reversível**: Decisões podem ser revertidas se necessário

## Considerações de Privacidade

- Avaliações rejeitadas não são exibidas publicamente
- Apenas administradores podem ver avaliações pendentes/rejeitadas
- O motivo da rejeição é armazenado para auditoria
- Clientes não veem o motivo da rejeição (apenas que está em análise)
