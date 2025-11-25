const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const asaasService = require('../services/asaas');

router.post('/customization-request', async (req, res) => {
    const { name, email, phone, company, business_type, requirements } = req.body;

    if (!name || !email || !phone || !business_type || !requirements) {
        return res.status(400).json({ 
            error: 'Todos os campos obrigatórios devem ser preenchidos' 
        });
    }

    try {
        const query = `
            INSERT INTO customization_requests 
            (name, email, phone, company, business_type, requirements, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
            RETURNING id
        `;

        const values = [name, email, phone, company || null, business_type, requirements];
        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Solicitação recebida com sucesso!',
            requestId: result.rows[0].id
        });

    } catch (error) {
        console.error('Erro ao salvar solicitação:', error);
        res.status(500).json({ 
            error: 'Erro ao processar solicitação. Tente novamente.' 
        });
    }
});

router.post('/create-payment', async (req, res) => {
    const { amount, plan, customer, paymentMethod, companyName } = req.body;

    if (!amount || !plan || !companyName || !customer) {
        return res.status(400).json({ error: 'Dados inválidos - companyName e customer são obrigatórios' });
    }

    const billingType = paymentMethod || 'CREDIT_CARD';

    if (!asaasService.isConfigured()) {
        console.log('Asaas não configurado. Modo de demonstração.');
        
        // In demo mode, create tenant immediately
        const { vortexPool } = require('../db');
        const crypto = require('crypto');
        const tenantId = crypto.randomUUID();
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        await vortexPool.query(
            `INSERT INTO tenants (id, name, slug, status, settings)
             VALUES ($1, $2, $3, 'active', '{}')`,
            [tenantId, companyName, slug]
        );

        await vortexPool.query(
            `INSERT INTO integrations (tenant_id, name, type, is_active)
             VALUES ($1, 'Agendamento', 'app', true)`,
            [tenantId]
        );

        const planResult = await pool.query(
            'SELECT id FROM plans WHERE slug = $1',
            [plan]
        );

        if (planResult.rows.length > 0) {
            const planId = planResult.rows[0].id;
            await pool.query(
                `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, started_at)
                 VALUES ($1, $2, 'active', CURRENT_TIMESTAMP)`,
                [tenantId, planId]
            );
        }

        return res.json({
            chargeId: 'demo_charge_' + Date.now(),
            invoiceUrl: '/success.html',
            demo: true,
            message: 'Configure ASAAS_API_KEY para habilitar pagamentos reais'
        });
    }

    try {
        let customerId = customer?.id;

        if (!customerId) {
            const newCustomer = await asaasService.createCustomer({
                name: customer?.name || 'Cliente',
                email: customer?.email || '[email protected]',
                cpfCnpj: customer?.cpfCnpj || '',
                phone: customer?.phone || ''
            });
            customerId = newCustomer.id;
        }

        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + (billingType === 'BOLETO' ? 3 : 1));
        const dueDateStr = dueDate.toISOString().split('T')[0];

        const planDescriptions = {
            'professional': 'Plano Professional - AgendaFácil',
            'enterprise': 'Plano Enterprise - AgendaFácil',
            'starter': 'Plano Starter - AgendaFácil'
        };

        const charge = await asaasService.createCharge({
            customer: customerId,
            value: amount,
            description: planDescriptions[plan] || 'Assinatura AgendaFácil',
            dueDate: dueDateStr,
            billingType: billingType
        });

        // Get plan_id from database
        const planResult = await pool.query(
            'SELECT id FROM plans WHERE slug = $1',
            [plan]
        );

        if (planResult.rows.length === 0) {
            throw new Error('Plano não encontrado');
        }

        const planId = planResult.rows[0].id;

        // Store pending payment with metadata for tenant creation
        await pool.query(
            `INSERT INTO pending_payments (asaas_charge_id, plan_id, company_name, customer_name, customer_email, customer_phone, customer_cpf_cnpj, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
            [charge.id, planId, companyName, customer.name, customer.email, customer.phone, customer.cpfCnpj]
        );

        const response = {
            chargeId: charge.id,
            invoiceUrl: charge.invoiceUrl || null,
            bankSlipUrl: charge.bankSlipUrl || null
        };

        if (billingType === 'PIX' && charge.pixQrCode) {
            response.pixQrCode = charge.pixQrCode.encodedImage || null;
            response.pixCopyPaste = charge.pixQrCode.payload || null;
        }

        res.json(response);

    } catch (error) {
        console.error('Erro ao criar cobrança Asaas:', error);
        res.status(500).json({ 
            error: 'Erro ao processar pagamento. Tente novamente.' 
        });
    }
});

router.post('/create-subscription', async (req, res) => {
    const { plan, customer } = req.body;

    const planValues = {
        'professional': 97.00,
        'enterprise': 297.00
    };

    const amount = planValues[plan];
    if (!amount) {
        return res.status(400).json({ error: 'Plano inválido' });
    }

    if (!asaasService.isConfigured()) {
        return res.json({
            subscriptionId: 'demo_subscription_' + Date.now(),
            invoiceUrl: '/success.html',
            demo: true,
            message: 'Configure ASAAS_API_KEY para habilitar assinaturas reais'
        });
    }

    try {
        let customerId = customer?.id;

        if (!customerId) {
            const newCustomer = await asaasService.createCustomer({
                name: customer?.name || 'Cliente',
                email: customer?.email || '[email protected]',
                cpfCnpj: customer?.cpfCnpj || '',
                phone: customer?.phone || ''
            });
            customerId = newCustomer.id;
        }

        const planDescriptions = {
            'professional': 'Assinatura Mensal Professional - AgendaFácil',
            'enterprise': 'Assinatura Mensal Enterprise - AgendaFácil'
        };

        const subscription = await asaasService.createSubscription({
            customer: customerId,
            value: amount,
            cycle: 'MONTHLY',
            description: planDescriptions[plan],
            billingType: 'CREDIT_CARD'
        });

        const subscriptionQuery = `
            INSERT INTO subscriptions 
            (plan, amount, status, asaas_subscription_id, asaas_customer_id, created_at)
            VALUES ($1, $2, 'active', $3, $4, NOW())
            RETURNING id
        `;

        await pool.query(subscriptionQuery, [plan, amount, subscription.id, customerId]);

        res.json({
            subscriptionId: subscription.id,
            invoiceUrl: subscription.invoiceUrl,
            success: true
        });

    } catch (error) {
        console.error('Erro ao criar assinatura Asaas:', error);
        res.status(500).json({ 
            error: 'Erro ao criar assinatura. Tente novamente.' 
        });
    }
});

const handleAsaasWebhook = async (req, res) => {
    try {
        const body = req.body;

        if (!asaasService.validateWebhook(body)) {
            console.warn('Webhook Asaas com token inválido');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log('Webhook Asaas recebido:', body.event);

        const event = body.event;
        const payment = body.payment;

        const paymentId = payment?.id || body?.payment;

        switch (event) {
            case 'PAYMENT_CREATED':
                console.log('Pagamento criado:', paymentId);
                break;

            case 'PAYMENT_RECEIVED':
            case 'PAYMENT_CONFIRMED':
                console.log('Pagamento confirmado:', paymentId);
                if (paymentId) {
                    const { vortexPool } = require('../db');
                    const crypto = require('crypto');
                    
                    // Get pending payment data
                    const pendingResult = await pool.query(
                        `SELECT * FROM pending_payments WHERE asaas_charge_id = $1 AND status = 'pending'`,
                        [paymentId]
                    );

                    if (pendingResult.rows.length > 0) {
                        const pending = pendingResult.rows[0];
                        const tenantId = crypto.randomUUID();
                        const slug = pending.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                        // Create tenant
                        await vortexPool.query(
                            `INSERT INTO tenants (id, name, slug, status, settings)
                             VALUES ($1, $2, $3, 'active', '{}')`,
                            [tenantId, pending.company_name, slug]
                        );

                        // Add integration
                        await vortexPool.query(
                            `INSERT INTO integrations (tenant_id, name, type, is_active)
                             VALUES ($1, 'Agendamento', 'app', true)`,
                            [tenantId]
                        );

                        // Create subscription
                        await pool.query(
                            `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, asaas_charge_id, started_at)
                             VALUES ($1, $2, 'active', $3, CURRENT_TIMESTAMP)`,
                            [tenantId, pending.plan_id, paymentId]
                        );

                        // Mark payment as completed
                        await pool.query(
                            `UPDATE pending_payments SET status = 'completed', tenant_id = $1, updated_at = CURRENT_TIMESTAMP
                             WHERE asaas_charge_id = $2`,
                            [tenantId, paymentId]
                        );

                        console.log(`✅ Tenant criado com sucesso: ${tenantId} - ${pending.company_name}`);
                    } else {
                        // Fallback for existing subscriptions
                        await pool.query(
                            `UPDATE tenant_subscriptions 
                             SET status = 'active', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                             WHERE asaas_charge_id = $1`,
                            [paymentId]
                        );
                    }
                }
                break;

            case 'PAYMENT_OVERDUE':
                console.log('Pagamento vencido:', paymentId);
                if (paymentId) {
                    // Update existing subscription or pending payment
                    await pool.query(
                        `UPDATE tenant_subscriptions 
                         SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
                         WHERE asaas_charge_id = $1`,
                        [paymentId]
                    );
                    
                    await pool.query(
                        `UPDATE pending_payments 
                         SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
                         WHERE asaas_charge_id = $1`,
                        [paymentId]
                    );
                }
                break;

            case 'PAYMENT_DELETED':
            case 'PAYMENT_REFUNDED':
                console.log('Pagamento cancelado/reembolsado:', paymentId);
                if (paymentId) {
                    // Update existing subscription or pending payment
                    await pool.query(
                        `UPDATE tenant_subscriptions 
                         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                         WHERE asaas_charge_id = $1`,
                        [paymentId]
                    );
                    
                    await pool.query(
                        `UPDATE pending_payments 
                         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                         WHERE asaas_charge_id = $1`,
                        [paymentId]
                    );
                }
                break;

            default:
                console.log('Evento não tratado:', event);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Erro ao processar webhook Asaas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = router;
module.exports.handleAsaasWebhook = handleAsaasWebhook;
