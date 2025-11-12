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

## Últimas Alterações
- 2025-11-12: Estrutura inicial do projeto criada
