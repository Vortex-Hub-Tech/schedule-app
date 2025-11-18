const { AsaasClient } = require('asaas');

const asaasApiKey = process.env.ASAAS_API_KEY;
const isSandbox = process.env.ASAAS_SANDBOX === 'true' || !process.env.ASAAS_API_KEY;

let asaas = null;

if (asaasApiKey) {
    asaas = new AsaasClient(asaasApiKey, {
        sandbox: isSandbox,
        printError: true
    });
}

async function createCustomer({ name, email, cpfCnpj, phone }) {
    if (!asaas) {
        console.log('Asaas não configurado. Modo de demonstração.');
        return { id: 'demo_customer_' + Date.now() };
    }

    try {
        const customer = await asaas.customers.new({
            name,
            email,
            cpfCnpj,
            mobilePhone: phone
        });

        return customer;
    } catch (error) {
        console.error('Erro ao criar cliente Asaas:', error);
        throw error;
    }
}

async function createCharge({ customer, value, description, dueDate, billingType = 'CREDIT_CARD' }) {
    if (!asaas) {
        console.log('Asaas não configurado. Retornando dados de demonstração.');
        return {
            id: 'demo_charge_' + Date.now(),
            invoiceUrl: '/success.html',
            bankSlipUrl: null,
            pixQrCode: null
        };
    }

    try {
        const charge = await asaas.payments.new({
            customer,
            billingType,
            value,
            description,
            dueDate
        });

        return charge;
    } catch (error) {
        console.error('Erro ao criar cobrança Asaas:', error);
        throw error;
    }
}

async function createSubscription({ 
    customer, 
    value, 
    cycle = 'MONTHLY', 
    description,
    billingType = 'CREDIT_CARD'
}) {
    if (!asaas) {
        console.log('Asaas não configurado. Retornando dados de demonstração.');
        return {
            id: 'demo_subscription_' + Date.now(),
            invoiceUrl: '/success.html'
        };
    }

    try {
        const subscription = await asaas.subscriptions.new({
            customer,
            billingType,
            value,
            cycle,
            description
        });

        return subscription;
    } catch (error) {
        console.error('Erro ao criar assinatura Asaas:', error);
        throw error;
    }
}

async function getPaymentById(paymentId) {
    if (!asaas) {
        return null;
    }

    try {
        const payment = await asaas.payments.getById(paymentId);
        return payment;
    } catch (error) {
        console.error('Erro ao buscar pagamento Asaas:', error);
        return null;
    }
}

function validateWebhook(body, token) {
    const receivedToken = body?.authToken || body?.token;
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!expectedToken) {
        console.warn('ASAAS_WEBHOOK_TOKEN não configurado');
        return true;
    }

    return receivedToken === expectedToken;
}

module.exports = {
    createCustomer,
    createCharge,
    createSubscription,
    getPaymentById,
    validateWebhook,
    isConfigured: () => !!asaas
};
