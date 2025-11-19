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
- **Integrações**: NitroSMS (SMS multi-tenant), PostgreSQL Database

## Funcionalidades Principais
### Cliente
- Visualização de serviços disponíveis
- Agendamento com datetime picker
- Validação por código via SMS (NitroSMS)
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
- 2025-11-19: **Funcionalidades Profissionais Implementadas**
  - **Componentes UI Reutilizáveis**: SkeletonLoader, StarRating, FavoriteButton, StatusBadge, StatsCard, QuickAction
  - **Tela Inicial Redesenhada**: Quick Actions para acesso rápido (Agendamentos, Estatísticas, Histórico, Favoritos)
  - **Sistema de Favoritos**: AsyncStorage local, tela dedicada de favoritos, botões de favoritar em cada serviço
  - **Tela de Estatísticas**: Métricas do cliente (total, pendentes, realizados, cancelados) com taxa de conclusão
  - **Perfil do Prestador**: Tela profissional com informações, horários, desempenho e estatísticas
  - **Sistema de Avaliações (UI)**: Componente StarRating e StarRatingDisplay prontos para integração backend
  - **Skeleton Loading**: Loading state profissional com animação pulsante
  - **Melhorias Visuais**: Animações suaves, transições, cards modernos inspirados em Uber/iFood
  - **Status Badges**: Indicadores visuais coloridos para status de agendamentos

- 2025-11-19: **Adicionada tela de carregamento (Splash Screen)**
  - Instalado pacote expo-splash-screen
  - Criado componente AppSplashScreen com design moderno
  - Gradiente azul profissional alinhado com a identidade visual
  - Animações suaves de fade-in e scale usando useRef para estabilidade
  - Estilos nativos com StyleSheet para máxima compatibilidade
  - Nome do app "AgendaFácil" com ícone de calendário
  - Indicador de carregamento animado
  - Duração de 3 segundos para garantir visibilidade

- 2025-11-13: **Migração completa de Z-API para NitroSMS**
  - Substituída integração Z-API (WhatsApp) por NitroSMS
  - Cada tenant agora é um sender individual no NitroSMS
  - Criada tabela `sms_logs` para rastreamento completo de envios
  - Adicionados campos de configuração NitroSMS na tabela `integrations`
  - Criado módulo centralizado `backend/services/nitrosms.js`
  - Refatoradas rotas de validação e agendamentos para usar NitroSMS
  - Corrigido API_URL hardcoded no mobile (agora usa variáveis de ambiente)
  - Adicionada rota `/api/sms-logs` para consulta de logs e estatísticas
  - Criados arquivos `.env.example` para documentação
  - Documentação atualizada (README.md e replit.md)

- 2025-11-13: **Implementado sistema de autenticação por dispositivo**
  - Removida seleção de tenant (agora fixo em configuração)
  - Adicionados títulos apropriados em todas as telas
  - Autenticação baseada em deviceId (sem busca por telefone)
  - Backend atualizado com suporte a device_id
  - Removida validação por código WhatsApp (substituída por deviceId)

- 2025-11-12: Estrutura inicial do projeto criada

## Configuração NitroSMS

### Arquitetura: Uma API Key Global + Device ID por Tenant

O sistema usa **uma única API Key NitroSMS compartilhada** configurada via secrets:
- `NITRO_API_KEY`: Chave de API do NitroSMS (encontrada no painel)

Cada tenant é identificado pelo seu **device_id único** configurado na tabela integrations:
- `nitro_device_id`: ID do dispositivo Android no painel NitroSMS (único por tenant)

### Exemplo de Configuração SQL
```sql
-- Configurar device_id para um tenant
INSERT INTO integrations 
  (id, tenant_id, name, type, nitro_device_id, is_active) 
VALUES 
  (gen_random_uuid(), 'tenant-demo-1', 'SMS', 'sms', '12345', true);
```

### Endpoints SMS
- `POST /api/validation/send-code` - Envia código de verificação via SMS
- `POST /api/validation/verify-code` - Valida código
- `GET /api/sms-logs` - Lista todos os logs de SMS do tenant
- `GET /api/sms-logs/stats` - Estatísticas de envios (sucesso/falha)
