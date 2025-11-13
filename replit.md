# App de Agendamento de Serviços

## Visão Geral
App mobile (React Native/Expo) para agendamento de serviços com dois modos:
- **Cliente**: Visualizar serviços, fazer agendamentos, validar via WhatsApp
- **Prestador**: Gerenciar serviços e visualizar agendamentos

## Estrutura do Projeto
```
/backend - API Express.js + PostgreSQL
/mobile - App React Native/Expo
```

## Tecnologias
- **Frontend**: React Native, Expo, Expo Router, NativeWind
- **Backend**: Node.js, Express.js, PostgreSQL
- **Integrações**: Z-API (WhatsApp), PostgreSQL Database

## Funcionalidades Principais
### Cliente
- Visualização de serviços disponíveis
- Agendamento com datetime picker
- Validação por código via WhatsApp
- Tela "Meus Agendamentos" com cancelamento

### Prestador
- Cadastro/edição/remoção de serviços
- Visualização de agendamentos
- Marcar status (pendente/realizado/cancelado)
- Exportação de dados

## Ambiente de Desenvolvimento
- Node.js 20
- PostgreSQL Database (Replit)
- Expo SDK 52

## Arquitetura de Autenticação
### Sistema de Autenticação por Dispositivo
- Cada dispositivo recebe um **deviceId único e persistente** (gerado automaticamente)
- Usuário escolhe **uma vez** se é Cliente ou Prestador (salvo no dispositivo)
- **Sem seleção de empresa**: Tenant é fixo na configuração (`mobile/config/tenant.js`)
- Agendamentos vinculados ao `device_id` para segurança e privacidade

### Fluxo de Autenticação
1. App verifica se já existe `userType` salvo
2. Se não, mostra tela de seleção (Cliente ou Prestador)
3. Escolha é salva permanentemente no dispositivo
4. Próximas aberturas redirecionam automaticamente para a área correta

## Últimas Alterações
- 2025-11-13: **Implementado sistema de autenticação por dispositivo**
  - Removida seleção de tenant (agora fixo em configuração)
  - Adicionados títulos apropriados em todas as telas
  - Autenticação baseada em deviceId (sem busca por telefone)
  - Backend atualizado com suporte a device_id
  - Removida validação por código WhatsApp (substituída por deviceId)
- 2025-11-12: Estrutura inicial do projeto criada
