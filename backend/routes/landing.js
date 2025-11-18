const express = require('express');
const router = express.Router();
const { pool } = require('../db');

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

router.post('/create-payment-intent', async (req, res) => {
    const { amount, plan } = req.body;

    if (!amount || !plan) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY;

    if (!stripeSecretKey) {
        console.log('Stripe não configurado. Modo de demonstração.');
        return res.json({
            clientSecret: 'demo_secret_' + Date.now(),
            publicKey: 'pk_test_demo',
            demo: true
        });
    }

    try {
        const Stripe = require('stripe');
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'brl',
            metadata: { plan }
        });

        const subscriptionQuery = `
            INSERT INTO subscriptions 
            (plan, amount, status, payment_intent_id, created_at)
            VALUES ($1, $2, 'pending', $3, NOW())
            RETURNING id
        `;

        await pool.query(subscriptionQuery, [plan, amount, paymentIntent.id]);

        res.json({
            clientSecret: paymentIntent.client_secret,
            publicKey: stripePublicKey
        });

    } catch (error) {
        console.error('Erro ao criar payment intent:', error);
        res.status(500).json({ 
            error: 'Erro ao processar pagamento. Tente novamente.' 
        });
    }
});

const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
        return res.status(400).send('Webhook secret not configured');
    }

    try {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;

            await pool.query(
                'UPDATE subscriptions SET status = $1 WHERE payment_intent_id = $2',
                ['active', paymentIntent.id]
            );

            console.log('Pagamento confirmado:', paymentIntent.id);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
};

module.exports = router;
module.exports.handleStripeWebhook = handleStripeWebhook;
