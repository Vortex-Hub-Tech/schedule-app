# 📱 App de Agendamento Multi-Tenant

Sistema completo de agendamento de serviços **multi-tenant** com React Native/Expo e backend Express.js + PostgreSQL. **Um único build serve múltiplas empresas** de forma isolada e segura.

## 🎯 Características Principais

### ✨ Multi-Tenant Verdadeiro
- **1 único build** serve todas as empresas
- **Isolamento completo** de dados por tenant
- **Seleção de empresa** no primeiro acesso
- **Troca de empresa** a qualquer momento
- **Temas personalizados** por empresa (pink, blue, orange)
- **Cache offline** separado por tenant

### 🔒 Segurança
- Foreign keys compostas impedem vazamento de dados entre tenants
- Middleware valida tenant antes de cada requisição
- Apenas tenants ativos com integração "Agendamento" tipo "app" são acessíveis

## 🏗️ Estrutura do Projeto

```
/backend        - API REST Multi-Tenant
  /database       - Schema SQL e seeds
  /middleware     - Validação de tenant
  /routes         - Endpoints tenant-aware
/mobile         - App React Native/Expo
  /app            - Telas (cliente + prestador)
  /config         - Configuração da API
  /utils          - Storage e temas
```

## 🚀 Tecnologias

### Backend
- **Node.js** + **Express.js** - API REST
- **PostgreSQL** - Banco multi-tenant
- **NitroSMS** - Envio de SMS por tenant (cada tenant = sender individual)
- **Middleware customizado** para validação de tenant

### Mobile  
- **React Native** + **Expo SDK 52**
- **Expo Router** - Navegação baseada em arquivos
- **NativeWind** - Tailwind CSS nativo
- **AsyncStorage** - Cache offline por tenant
- **date-fns** - Manipulação de datas

## 📦 Banco de Dados Multi-Tenant

### Tabelas Principais

#### `tenants`
Empresas cadastradas no sistema:
- `id`, `name`, `slug`, `status`, `plan`, `settings`

#### `integrations`
Controle de quais tenants têm acesso ao app:
- Filtro: `name = 'Agendamento'` AND `type = 'app'` AND `is_active = true`

#### `services` (tenant-aware)
Serviços oferecidos por cada empresa:
- `tenant_id`, `name`, `description`, `duration`, `price`

#### `appointments` (tenant-aware)
Agendamentos com isolamento por tenant:
- `tenant_id`, `service_id`, `client_name`, `client_phone`, `appointment_date`, `status`

#### `validations` (tenant-aware)
Códigos de validação via SMS:
- `tenant_id`, `phone`, `code`, `verified`, `expires_at`

#### `sms_logs` (tenant-aware)
Registro completo de todos os SMS enviados:
- `tenant_id`, `phone`, `message`, `sender_id`, `status`, `nitro_response`, `sent_at`

### Isolamento de Dados
- **Foreign keys compostas**: `(id, tenant_id)` impedem referências cruzadas
- **Índices otimizados**: Queries filtradas por tenant são extremamente rápidas
- **Middleware de segurança**: Valida tenant em TODA requisição

## 🔧 API Endpoints

### Públicos (sem tenant)
```
GET  /api/tenants                 - Lista empresas disponíveis
GET  /api/tenants/:id/bootstrap   - Dados iniciais da empresa
GET  /api/health                  - Status do servidor
```

### Privados (requerem header `x-tenant-id`)

**Serviços**
```
GET    /api/services              - Listar serviços do tenant
GET    /api/services/:id          - Buscar serviço específico
POST   /api/services              - Criar serviço
PUT    /api/services/:id          - Atualizar serviço
DELETE /api/services/:id          - Remover serviço
```

**Agendamentos**
```
GET    /api/appointments                 - Listar agendamentos
GET    /api/appointments/:id             - Buscar agendamento
POST   /api/appointments                 - Criar agendamento
PATCH  /api/appointments/:id/status      - Atualizar status
DELETE /api/appointments/:id             - Remover agendamento
```

**Validação SMS**
```
POST /api/validation/send-code     - Enviar código de 6 dígitos via SMS
POST /api/validation/verify-code   - Validar código
```

**Logs de SMS**
```
GET  /api/sms-logs                 - Listar logs de SMS do tenant
GET  /api/sms-logs/stats           - Estatísticas de envio de SMS
```

## 📱 Fluxo do App Mobile

### 1️⃣ Primeiro Acesso
1. App abre na tela de **Seleção de Empresa**
2. Busca `/api/tenants` (apenas empresas ativas com integração)
3. Usuário escolhe a empresa
4. App salva no **AsyncStorage** e faz **bootstrap**
5. Redireciona para tela principal

### 2️⃣ Acessos Seguintes
1. App verifica AsyncStorage
2. Se há tenant salvo, vai direto para home
3. Senão, volta para seleção de empresa

### 3️⃣ Trocar de Empresa
1. Botão "Trocar" na tela principal
2. Limpa cache do tenant atual
3. Volta para seleção de empresa

## 🎨 Temas Personalizados

Cada empresa pode ter seu próprio tema visual:

```javascript
// Configurado em tenants.settings.theme
{
  "pink": "#ec4899",    // Salão de Beleza
  "blue": "#3b82f6",    // Clínica Médica
  "orange": "#f97316"   // Auto Mecânica
}
```

O app aplica automaticamente:
- Cor do header
- Botões principais
- Destaques e badges

## 💾 Cache Offline

O app salva dados localmente **por tenant**:

```javascript
// Estrutura no AsyncStorage
@agendamento:tenant                    // Tenant selecionado
@agendamento:tenant_data               // Bootstrap data
@agendamento:services_cache_[id]      // Serviços (1h)
@agendamento:appointments_cache_[id]  // Agendamentos (30min)
```

**Benefícios:**
- App funciona offline
- Carregamento instantâneo
- Sincronização automática

## 🚀 Como Usar

### Backend (já rodando no Replit)

O backend está rodando em `http://localhost:5000` com:
- ✅ 3 empresas demo cadastradas
- ✅ Integração "Agendamento" ativa para todas
- ✅ Serviços de exemplo por empresa

### Mobile (testar localmente)

1. **Configure a URL da API:**
```javascript
// mobile/config/api.js
const API_URL = 'https://[seu-repl].replit.app/api';
```

2. **Instale dependências:**
```bash
cd mobile
npm install
```

3. **Execute:**
```bash
npx expo start
```

4. **Escaneie o QR Code** com Expo Go

## 🏢 Empresas Demo

### 1. Salão Beleza Total
- **Tema:** Rosa (pink)
- **Serviços:** Corte de Cabelo, Manicure e Pedicure
- **ID:** `tenant-demo-1`

### 2. Clínica Dr. Saúde
- **Tema:** Azul (blue)
- **Serviços:** Consulta Geral, Exames de Rotina
- **ID:** `tenant-demo-2`

### 3. Auto Mecânica Express
- **Tema:** Laranja (orange)
- **Serviços:** Troca de Óleo, Alinhamento
- **ID:** `tenant-demo-3`

## 📱 Configuração NitroSMS

### Arquitetura: Uma API Key Global + Device ID por Tenant

O sistema usa **uma única API Key NitroSMS compartilhada** para todos os tenants. Cada tenant é identificado pelo seu **device_id único** (dispositivo Android configurado no NitroSMS).

#### 1. Configurar Credenciais Globais (Uma vez)

Configure a API Key do NitroSMS como secret do Replit:

```bash
NITRO_API_KEY=sua_api_key_aqui
```

#### 2. Configurar Device ID por Tenant

Cada tenant precisa ter seu device_id configurado na tabela integrations (ID do dispositivo Android no painel NitroSMS):

```sql
-- Criar integração SMS para um tenant
INSERT INTO integrations 
  (id, tenant_id, name, type, nitro_device_id, is_active)
VALUES 
  (gen_random_uuid(), 'tenant-demo-1', 'SMS', 'sms', '12345', true);
```

```sql
-- Atualizar device_id de um tenant existente
UPDATE integrations 
SET nitro_device_id = '67890'
WHERE tenant_id = 'seu-tenant-id' AND type = 'sms';
```

**Como funciona:**
- Todos os SMS usam a mesma API Key global
- O `nitro_device_id` identifica qual dispositivo Android enviará a mensagem
- Cada tenant tem seu próprio device_id (permite diferentes chips/números)
- Os dispositivos devem estar configurados no painel NitroSMS

**Modo Desenvolvimento:**
- Sem credenciais configuradas, o código aparece nos logs do servidor
- SMS é registrado na tabela `sms_logs` mesmo em caso de erro
- Útil para testes sem depender do serviço de SMS

### Consultar Logs de SMS

Use a API para verificar histórico de envios:
```bash
# Todos os logs do tenant
GET /api/sms-logs

# Filtrar por telefone
GET /api/sms-logs?phone=679999999

# Filtrar por status
GET /api/sms-logs?status=sent

# Estatísticas
GET /api/sms-logs/stats
```

## 🎯 Adicionar Nova Empresa

### 1. Via SQL:
```sql
-- Criar tenant
INSERT INTO tenants (id, name, slug, status, plan, settings) VALUES
('minha-empresa', 'Minha Empresa', 'minha-empresa', 'active', 'premium',
 '{"theme": "blue", "timezone": "America/Sao_Paulo"}');

-- Adicionar integração do app
INSERT INTO integrations (id, tenant_id, name, type, is_active) VALUES
(gen_random_uuid(), 'minha-empresa', 'Agendamento', 'app', true);

-- Adicionar integração SMS (NitroSMS) - apenas sender_id
INSERT INTO integrations 
  (id, tenant_id, name, type, nitro_sender_id, is_active) 
VALUES 
  (gen_random_uuid(), 'minha-empresa', 'SMS', 'sms', 'MinhaEmp', true);

-- Adicionar serviços
INSERT INTO services (tenant_id, name, description, duration, price) VALUES
('minha-empresa', 'Meu Serviço', 'Descrição', 60, 100.00);
```

### 2. A empresa aparece automaticamente no app! 🎉

## 📊 Melhorias de UI/UX

✨ **Todas as telas agora têm:**
- Títulos claros e consistentes
- Navegação intuitiva com botão "Voltar"
- Cards com sombras e bordas arredondadas
- Cores temáticas por empresa
- Ícones e emojis para melhor UX
- Loading states apropriados
- Mensagens de erro amigáveis

## 🔄 Próximos Passos Sugeridos

1. **Testes automatizados** para validar isolamento multi-tenant
2. **Dashboard analytics** por empresa
3. **Notificações push** específicas por tenant
4. **Customização avançada** de temas (cores, logo, etc)
5. **Exportação de relatórios** por empresa
6. **Sistema de permissões** por usuário/tenant
7. **Webhooks** para integração com outros sistemas

## ⚡ Performance

- **Índices compostos** garantem queries rápidas mesmo com milhões de registros
- **Cache offline** reduz chamadas à API
- **Lazy loading** de dados pesados
- **Paginação** automática quando necessário

## 🐛 Troubleshooting

### App não encontra empresas
- Verifique se o backend está rodando
- Confirme que há tenants com integração "Agendamento" ativa
- Use a URL pública do Replit, não `localhost`

### Dados de outra empresa aparecem
- **Impossível!** As foreign keys compostas impedem isso
- Se acontecer, é bug crítico - reporte imediatamente

### Cache desatualizado
- Force refresh puxando para baixo (pull-to-refresh)
- Troque de empresa e volte
- Limpe o cache do app

## 📝 Licença

Projeto privado de uso exclusivo.

---

**🎉 Desenvolvido com foco em multi-tenancy, segurança e UX excepcional!**
