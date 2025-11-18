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
    const { amount, plan, customer, paymentMethod } = req.body;

    if (!amount || !plan) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    const billingType = paymentMethod || 'CREDIT_CARD';

    if (!asaasService.isConfigured()) {
        console.log('Asaas não configurado. Modo de demonstração.');
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

        const subscriptionQuery = `
            INSERT INTO subscriptions 
            (plan, amount, status, asaas_charge_id, asaas_customer_id, created_at)
            VALUES ($1, $2, 'pending', $3, $4, NOW())
            RETURNING id
        `;

        await pool.query(subscriptionQuery, [plan, amount, charge.id, customerId]);

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
                    await pool.query(
                        `UPDATE subscriptions 
                         SET status = 'active', updated_at = NOW() 
                         WHERE asaas_charge_id = $1`,
                        [paymentId]
                    );
                }
                break;

            case 'PAYMENT_OVERDUE':
                console.log('Pagamento vencido:', paymentId);
                if (paymentId) {
                    await pool.query(
                        `UPDATE subscriptions 
                         SET status = 'overdue', updated_at = NOW() 
                         WHERE asaas_charge_id = $1`,
                        [paymentId]
                    );
                }
                break;

            case 'PAYMENT_DELETED':
            case 'PAYMENT_REFUNDED':
                console.log('Pagamento cancelado/reembolsado:', paymentId);
                if (paymentId) {
                    await pool.query(
                        `UPDATE subscriptions 
                         SET status = 'cancelled', updated_at = NOW() 
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
