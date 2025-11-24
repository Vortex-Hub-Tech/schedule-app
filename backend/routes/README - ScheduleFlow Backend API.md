# ScheduleFlow Backend API - README

[ScheduleFlow Backend API](collection/6775891-48e7da0b-674d-4113-8704-90848beb1612)

1. Overview
O ScheduleFlow Backend API expõe endpoints para gerenciar serviços, agendamentos, feedbacks, chat, planos e locatários (tenants). Esta coleção agrupa as requisições por pastas para facilitar desenvolvimento, testes e automação.

2. Getting Started
- Pré-requisitos: acesso ao backend do ScheduleFlow e um tenant válido.
- Variáveis: defina baseUrl e tenantId no nível da coleção ou em um Ambiente.
- Como definir: abra a coleção → Variables → adicione baseUrl (ex.: http://localhost:3000) e tenantId (ID/UUID do locatário).

3. Authentication & Headers
- X-Tenant-Id: para rotas protegidas por validateTenant, inclua o cabeçalho X-Tenant-Id: {{tenantId}}.
- Autenticação adicional: se o backend exigir Bearer Token ou similar, configure em Authorization na coleção/ambiente.

4. Environments
- Crie ambientes: Local, Staging, Production.
- Variáveis por ambiente:
  - baseUrl: URL da API (ex.: http://localhost:3000, https://staging.api..., https://api...)
  - tenantId: identificador do locatário ativo.

5. Folder & Endpoint Summary
- Validation
  - POST /validation/send-code
  - POST /validation/verify-code
- Analytics
  - GET /analytics/dashboard?startDate=&endDate=
  - GET /analytics/revenue?period=day|week|month
  - GET /analytics/conversion
- Appointments
  - GET /appointments?phone=&status=&deviceId=
  - GET /appointments/:id
  - POST /appointments
  - PATCH /appointments/:id/status (status: "confirmado", "cancelado", "pendente")
  - DELETE /appointments/:id
- Chat
  - GET /chat/:appointmentId?since=
  - POST /chat/:appointmentId
  - PATCH /chat/:appointmentId/read
- Devices
  - POST /devices/register-or-resolve
- Feedbacks
  - GET /feedbacks?appointment_id=&service_id=&include_all=
  - GET /feedbacks/stats
  - GET /feedbacks/moderation/stats
  - GET /feedbacks/appointment/:appointmentId
  - POST /feedbacks
  - PATCH /feedbacks/:id
  - DELETE /feedbacks/:id
  - GET /feedbacks/moderation/pending
  - POST /feedbacks/moderation/:id/approve
  - POST /feedbacks/moderation/:id/reject
  - POST /feedbacks/moderation/:id/revert
- Landing
  - POST /landing/customization-request
  - POST /landing/create-payment
  - POST /landing/create-subscription
  - POST /landing/asaas/webhook
- Owner
  - POST /owner/verify-owner
  - POST /owner/claim-ownership
- Plans
  - GET /plans
  - GET /plans/current
  - POST /plans/subscribe/:planId
  - GET /plans/limits
- Push Tokens
  - POST /push-tokens/register
  - DELETE /push-tokens/unregister/:device_id
- Services
  - GET /services
  - GET /services/:id
  - POST /services
  - PUT /services/:id
  - DELETE /services/:id
- SMS Logs
  - GET /sms-logs?phone=&status=&startDate=&endDate=&limit=
  - GET /sms-logs/stats
- Tenants
  - GET /tenants
  - GET /tenants/:id
  - GET /tenants/:id/bootstrap
  - PATCH /tenants/settings

6. Common Workflows
- Cadastro e agendamento:
  1) POST /services → criar serviço
  2) POST /appointments → criar agendamento (status inicial: "pendente")
  3) PATCH /appointments/:id/status → atualizar para "confirmado" ou "cancelado"
- Chat durante o atendimento:
  1) POST /chat/:appointmentId → enviar mensagem
  2) GET /chat/:appointmentId?since= → obter novas mensagens
  3) PATCH /chat/:appointmentId/read → marcar como lidas
- Feedback e moderação:
  1) POST /feedbacks → criar feedback
  2) GET /feedbacks/moderation/pending → listar pendentes
  3) POST /feedbacks/moderation/:id/approve|reject|revert → moderar

7. Running & Testing
- Envio individual: selecione a requisição e clique em Send.
- Collection Runner: execute a coleção/pastas para fluxos completos e regressão.
- Asserções sugeridas: status esperado (2xx/4xx), contrato do corpo (campos obrigatórios), tempo de resposta.
- Monitor: crie um monitor para rodar periodicamente (ex.: a cada hora) e receber alertas de falhas.

8. Mocking
- Adicione Examples nas requisições e crie um Mock Server apontando para a coleção; as respostas serão servidas a partir dos Examples.

9. Troubleshooting
- 401/403: verifique header X-Tenant-Id e tokens de autorização.
- 400: valide payloads (campos obrigatórios, tipos) e use exemplos de body.
- 404: confira IDs e path params (ex.: appointmentId, serviceId).

10. Links
- Coleção: ScheduleFlow Backend API → collection/6775891-48e7da0b-674d-4113-8704-90848beb1612
- Monitors/Mocks: quando criados, ficarão visíveis neste workspace e associados à coleção.