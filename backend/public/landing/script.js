let selectedPlan = null;
let selectedAmount = 0;
let stripe = null;
let elements = null;

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSmoothScroll();
    initCustomizeForm();
    initScrollAnimations();
});

function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const menu = document.querySelector('.nav-menu');
            const actions = document.querySelector('.nav-actions');
            if (menu) menu.classList.toggle('active');
            if (actions) actions.classList.toggle('active');
        });
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

function selectPlan(plan, amount) {
    selectedPlan = plan;
    selectedAmount = amount;

    if (plan === 'starter') {
        window.location.href = '#customize';
        showNotification('Ótimo! Preencha o formulário abaixo para começar.', 'success');
        return;
    }

    if (plan === 'enterprise') {
        window.location.href = '#customize';
        showNotification('Nossa equipe entrará em contato para criar uma solução personalizada.', 'success');
        return;
    }

    openPaymentModal();
}

function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'block';
        initStripePayment();
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

document.querySelector('.close')?.addEventListener('click', closePaymentModal);

window.addEventListener('click', (event) => {
    const modal = document.getElementById('paymentModal');
    if (event.target === modal) {
        closePaymentModal();
    }
});

async function initStripePayment() {
    try {
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: selectedAmount,
                plan: selectedPlan
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao iniciar pagamento');
        }

        const { clientSecret, publicKey } = await response.json();

        if (!stripe && publicKey) {
            stripe = Stripe(publicKey);
        }

        if (stripe && clientSecret) {
            const appearance = {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#6366F1',
                }
            };

            elements = stripe.elements({ clientSecret, appearance });
            const paymentElement = elements.create('payment');
            paymentElement.mount('#payment-element');

            const submitButton = document.getElementById('submit-payment');
            if (submitButton) {
                submitButton.onclick = handlePaymentSubmit;
            }
        }
    } catch (error) {
        console.error('Erro ao configurar pagamento:', error);
        showPaymentMessage('Erro ao carregar sistema de pagamento. Tente novamente.', 'error');
    }
}

async function handlePaymentSubmit(e) {
    e.preventDefault();

    if (!stripe || !elements) {
        return;
    }

    const submitButton = document.getElementById('submit-payment');
    submitButton.disabled = true;
    submitButton.textContent = 'Processando...';

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.origin + '/success',
        },
    });

    if (error) {
        showPaymentMessage(error.message, 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Confirmar Pagamento';
    } else {
        showPaymentMessage('Pagamento realizado com sucesso!', 'success');
    }
}

function showPaymentMessage(message, type) {
    const messageDiv = document.getElementById('payment-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `payment-message ${type}`;
    }
}

function initCustomizeForm() {
    const form = document.getElementById('customizeForm');
    if (form) {
        form.addEventListener('submit', handleCustomizeSubmit);
    }
}

async function handleCustomizeSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
        const response = await fetch('/api/customization-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar solicitação');
        }

        const result = await response.json();

        showNotification('Solicitação enviada com sucesso! Nossa equipe entrará em contato em breve.', 'success');

        e.target.reset();

    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao enviar solicitação. Tente novamente.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#6366F1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
