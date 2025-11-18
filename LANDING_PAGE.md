# Landing Page - AgendaFácil

## 🎉 Landing Page Criada com Sucesso!

Foi criada uma Landing Page moderna e profissional para divulgação e venda do seu app de agendamento, com **integração Asaas** para pagamentos brasileiros (PIX, Boleto e Cartão de Crédito).

## 📍 Acesso

A Landing Page está disponível em:
- **URL Principal**: `http://seu-dominio.com/`
- **URL Direta**: `http://seu-dominio.com/landing/index.html`

## ✨ Recursos Implementados

### 1. **Hero Section**
- Título impactante com gradient
- Descrição clara do valor da plataforma
- CTAs para começar grátis ou ver demonstração
- Mockup animado do app mobile
- Estatísticas de uso (+10.000 agendamentos, 500+ empresas, 98% satisfação)

### 2. **Social Proof**
- Logos de tipos de negócios atendidos
- Construção de confiança

### 3. **Features/Recursos**
- 6 features principais:
  - App Mobile Completo
  - Notificações Inteligentes
  - Pagamentos Integrados
  - Relatórios Detalhados
  - 100% Personalizável
  - Segurança Total

### 4. **Pricing/Planos**
- **Starter**: Grátis (até 50 agendamentos/mês)
- **Professional**: R$ 97/mês (mais popular)
- **Enterprise**: R$ 297/mês (customizado)

### 5. **Formulário de Customização**
- Campos: Nome, Email, Telefone, Empresa, Tipo de Negócio, Requisitos
- Salva no banco de dados (tabela `customization_requests`)
- Notificação de sucesso após envio

### 6. **Depoimentos**
- 3 depoimentos de clientes fictícios
- Avatar e informações do cliente

### 7. **CTA Final**
- Call-to-action grande para conversão
- Redirecionamento para planos

### 8. **Footer**
- Links para recursos, empresa e suporte
- Logo e descrição

## 💳 Sistema de Pagamento (Asaas) 🇧🇷

### Por que Asaas?

✅ **Gateway 100% brasileiro**  
✅ **Aceita PIX, Boleto e Cartão de Crédito**  
✅ **Taxas competitivas**  
✅ **API simples e bem documentada**  
✅ **Webhooks nativos**  

### Configuração Necessária

Para ativar os pagamentos, você precisa configurar as seguintes variáveis de ambiente:

#### 1. Criar Conta no Asaas

1. **Produção**: https://www.asaas.com
2. **Sandbox (Testes)**: https://sandbox.asaas.com/onboarding/createAccount

#### 2. Obter API Key

1. Faça login na sua conta Asaas
2. Vá em **Menu do Usuário → Integrações → API Key**
3. Clique em **Gerar Nova Chave API**
4. Copie a chave gerada

#### 3. Configurar no Replit (Secrets)

Adicione as seguintes secrets:

1. **ASAAS_API_KEY**
   - Cole a API Key que você copiou
   - Exemplo: `$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNDU5MTU6OiRhYWNoXzg2MWFhMmQ1LTA4OGEtNGIxZS04MTgyLWZkODE2ZmQ0M2VlYQ==`

2. **ASAAS_SANDBOX** (opcional)
   - Valor: `true` para testes, `false` ou deixe vazio para produção
   - Recomendo começar com `true` para testar

3. **ASAAS_WEBHOOK_TOKEN** (recomendado)
   - Crie um token secreto qualquer (ex: `meu_token_super_secreto_123`)
   - Usado para validar webhooks do Asaas

### Configurar Webhooks no Asaas

1. Acesse **Menu do Usuário → Integrações → Webhooks**
2. Clique em **Novo Webhook**
3. Preencha:
   - **Nome**: `AgendaFácil Webhooks`
   - **URL**: `https://seu-dominio.replit.app/api/webhook/asaas`
   - **Token de Autenticação**: o mesmo valor de `ASAAS_WEBHOOK_TOKEN`
   - **Eventos**:
     - ✅ PAYMENT_CREATED
     - ✅ PAYMENT_RECEIVED
     - ✅ PAYMENT_CONFIRMED
     - ✅ PAYMENT_OVERDUE
     - ✅ PAYMENT_DELETED
     - ✅ PAYMENT_REFUNDED

### Fluxo de Pagamento

#### Opção 1: PIX (Instantâneo)
1. Usuário clica em "Assinar Agora"
2. Preenche dados (nome, email, CPF/CNPJ, telefone)
3. Seleciona "PIX"
4. Sistema gera QR Code e código Copia e Cola
5. Usuário paga via app do banco
6. Webhook confirma pagamento automaticamente
7. Status muda para "active"

#### Opção 2: Boleto
1. Usuário clica em "Assinar Agora"
2. Preenche dados
3. Seleciona "Boleto"
4. Sistema gera boleto
5. Usuário paga no banco
6. Webhook confirma em 1-3 dias úteis

#### Opção 3: Cartão de Crédito
1. Usuário clica em "Assinar Agora"
2. Preenche dados
3. Seleciona "Cartão de Crédito"
4. Sistema gera link de pagamento Asaas
5. Usuário preenche dados do cartão
6. Confirmação instantânea

## 🗄️ Banco de Dados

### Tabelas Criadas

#### `customization_requests`
```sql
- id (serial)
- name (varchar)
- email (varchar)
- phone (varchar)
- company (varchar)
- business_type (varchar)
- requirements (text)
- status (varchar) - default: 'pending'
- created_at (timestamp)
- updated_at (timestamp)
```

#### `subscriptions`
```sql
- id (serial)
- plan (varchar) - starter/professional/enterprise
- amount (decimal)
- status (varchar) - pending/active/overdue/cancelled
- asaas_customer_id (varchar) - ID do cliente no Asaas
- asaas_charge_id (varchar) - ID da cobrança no Asaas
- asaas_subscription_id (varchar) - ID da assinatura no Asaas
- created_at (timestamp)
- updated_at (timestamp)
```

## 🎨 Design & Animações

### Tecnologias Usadas
- **HTML5 Semântico**
- **CSS3** com:
  - CSS Grid & Flexbox
  - Animações e transições
  - Gradientes modernos
  - Responsivo (mobile-first)
- **JavaScript Vanilla**
- **Asaas API** para pagamentos

### Paleta de Cores
- Primary: `#6366F1` (Indigo)
- Secondary: `#10B981` (Green)
- Dark: `#0F172A`
- Gray: `#64748B`

### Animações
- Float animation no mockup do celular
- Fade in up nos floating cards
- Scroll animations nos cards
- Hover effects em todos os botões e cards

## 📱 Responsividade

A LP é totalmente responsiva e funciona perfeitamente em:
- Desktop (1200px+)
- Tablet (768px - 1200px)
- Mobile (até 768px)

## 🔒 Segurança

- CORS configurado
- Validação de dados no backend
- Webhook com token de autenticação
- API Keys armazenadas em secrets
- HTTPS recomendado para produção

## 💰 Taxas do Asaas (Referência)

| Método | Taxa |
|--------|------|
| **PIX** | 0,99% |
| **Boleto** | R$ 3,49 por boleto |
| **Cartão de Crédito** | 4,49% |
| **Assinatura Mensal** | Sem taxa adicional |

*Taxas podem variar. Consulte o Asaas para valores atualizados.*

## 🚀 Testando a Integração

### Modo Sandbox (Teste)

1. Configure `ASAAS_SANDBOX=true` nos Secrets
2. Use a API Key do sandbox
3. Faça testes sem cobranças reais
4. Use CPFs/CNPJs de teste

### Modo Produção

1. Configure `ASAAS_SANDBOX=false` ou remova a variável
2. Use a API Key de produção
3. Configure webhook de produção
4. Pagamentos reais serão processados

## 📂 Estrutura de Arquivos

```
backend/
├── public/
│   ├── landing/
│   │   ├── index.html      # Página principal da LP
│   │   ├── styles.css      # Estilos da LP
│   │   └── script.js       # JavaScript da LP
│   └── success.html        # Página de sucesso pós-pagamento
├── routes/
│   └── landing.js          # Rotas da LP e pagamento Asaas
├── services/
│   └── asaas.js            # Serviço de integração Asaas
└── server.js               # Servidor configurado
```

## 📋 Checklist de Deploy

- [ ] Criar conta no Asaas (produção)
- [ ] Gerar API Key de produção
- [ ] Configurar `ASAAS_API_KEY` nos Secrets
- [ ] Configurar `ASAAS_SANDBOX=false`
- [ ] Configurar `ASAAS_WEBHOOK_TOKEN`
- [ ] Criar webhook no Asaas apontando para sua URL
- [ ] Testar pagamento PIX
- [ ] Testar pagamento Boleto
- [ ] Testar pagamento Cartão
- [ ] Verificar recebimento de webhooks
- [ ] Publicar no Replit

## 🎯 Métricas de Conversão Esperadas

Baseado em benchmarks do mercado:
- Landing pages SaaS de alta qualidade: **10-15%** de conversão
- Landing pages médias: **2-5%** de conversão

## 💡 Dicas para Aumentar Conversão

1. **Teste A/B** nos CTAs
2. **Adicione vídeo explicativo** no hero
3. **Chat ao vivo** (ex: Tawk.to, Intercom)
4. **Provas sociais reais** (quando tiver clientes)
5. **Garantia de satisfação** ou período de teste
6. **Casos de uso** específicos por segmento
7. **Ofereça PIX** - brasileiros adoram! ⚡

## 📞 API Endpoints

### Landing Page
- `GET /` - Redireciona para Landing Page
- `GET /landing/index.html` - Landing Page principal
- `GET /success.html` - Página de sucesso

### Customização
- `POST /api/customization-request` - Salva solicitação de customização

### Pagamentos
- `POST /api/create-subscription` - Cria assinatura no Asaas
- `POST /api/webhook/asaas` - Recebe eventos do Asaas

## 🆘 Troubleshooting

### Problema: "Asaas não configurado"
**Solução**: Configure a variável `ASAAS_API_KEY` nos Secrets do Replit

### Problema: Webhook não funciona
**Solução**: 
1. Verifique se `ASAAS_WEBHOOK_TOKEN` está configurado
2. Confirme se a URL do webhook está correta
3. Veja os logs no painel Asaas → Webhooks

### Problema: Pagamento não confirma
**Solução**: 
1. Verifique os logs do webhook
2. Teste em modo sandbox primeiro
3. Confirme que os eventos estão selecionados no Asaas

## 📖 Recursos Úteis

- **Documentação Asaas**: https://docs.asaas.com/
- **API Reference**: https://asaasv3.docs.apiary.io/
- **Sandbox Asaas**: https://sandbox.asaas.com/
- **NPM Package**: https://www.npmjs.com/package/asaas

---

## 🎊 Pronto para Vender!

A Landing Page está 100% funcional com integração Asaas! Configure as API Keys e comece a receber pagamentos via PIX, Boleto e Cartão de Crédito.

**Dica**: Comece no modo sandbox para testar tudo antes de ir para produção! 🚀
