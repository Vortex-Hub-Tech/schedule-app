let selectedPlan = null;
let selectedAmount = 0;

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
        showPaymentForm();
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

function showPaymentForm() {
    const paymentElement = document.getElementById('payment-element');
    if (paymentElement) {
        paymentElement.innerHTML = `
            <div class="payment-form">
                <p class="payment-info">
                    <strong>Plano ${selectedPlan === 'professional' ? 'Professional' : 'Enterprise'}</strong><br>
                    R$ ${selectedAmount.toFixed(2)}/mês
                </p>
                <div class="form-group">
                    <label>Nome Completo *</label>
                    <input type="text" id="customer-name" required>
                </div>
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" id="customer-email" required>
                </div>
                <div class="form-group">
                    <label>CPF/CNPJ *</label>
                    <input type="text" id="customer-cpf" required>
                </div>
                <div class="form-group">
                    <label>Telefone *</label>
                    <input type="tel" id="customer-phone" required>
                </div>
                <div class="payment-methods">
                    <p><strong>Forma de Pagamento:</strong></p>
                    <div class="method-options">
                        <label class="method-option">
                            <input type="radio" name="payment-method" value="CREDIT_CARD" checked>
                            <span>💳 Cartão de Crédito</span>
                        </label>
                        <label class="method-option">
                            <input type="radio" name="payment-method" value="BOLETO">
                            <span>📄 Boleto</span>
                        </label>
                        <label class="method-option">
                            <input type="radio" name="payment-method" value="PIX">
                            <span>💰 PIX</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    const submitButton = document.getElementById('submit-payment');
    if (submitButton) {
        submitButton.onclick = handlePaymentSubmit;
    }
}

async function handlePaymentSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('customer-name')?.value;
    const email = document.getElementById('customer-email')?.value;
    const cpfCnpj = document.getElementById('customer-cpf')?.value;
    const phone = document.getElementById('customer-phone')?.value;
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;

    if (!name || !email || !cpfCnpj || !phone) {
        showPaymentMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    const submitButton = document.getElementById('submit-payment');
    submitButton.disabled = true;
    submitButton.textContent = 'Processando...';

    try {
        const response = await fetch('/api/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan: selectedPlan,
                customer: {
                    name,
                    email,
                    cpfCnpj,
                    phone
                },
                paymentMethod
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao processar pagamento');
        }

        const result = await response.json();

        if (result.demo) {
            showPaymentMessage(result.message || 'Modo demonstração - Configure ASAAS_API_KEY', 'info');
            setTimeout(() => {
                window.location.href = '/success.html';
            }, 2000);
        } else if (result.invoiceUrl) {
            window.location.href = result.invoiceUrl;
        } else if (result.pixCopyPaste) {
            showPixPayment(result.pixCopyPaste, result.pixQrCode);
        } else if (result.bankSlipUrl) {
            window.open(result.bankSlipUrl, '_blank');
            showPaymentMessage('Boleto gerado! Verifique a nova aba.', 'success');
        } else {
            showPaymentMessage('Assinatura criada com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = '/success.html';
            }, 2000);
        }

    } catch (error) {
        console.error('Erro:', error);
        showPaymentMessage('Erro ao processar pagamento. Tente novamente.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Confirmar Pagamento';
    }
}

function showPixPayment(pixCode, qrCodeBase64) {
    const paymentElement = document.getElementById('payment-element');
    if (paymentElement) {
        paymentElement.innerHTML = `
            <div class="pix-payment">
                <h3>Pague com PIX</h3>
                ${qrCodeBase64 ? `<img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code PIX" style="max-width: 250px; margin: 20px auto; display: block;">` : ''}
                <p><strong>Código PIX Copia e Cola:</strong></p>
                <div class="pix-code">
                    <code id="pix-code-text">${pixCode}</code>
                    <button onclick="copyPixCode()" class="btn btn-secondary" style="margin-top: 10px;">
                        Copiar Código PIX
                    </button>
                </div>
                <p style="color: #64748B; font-size: 0.875rem; margin-top: 20px;">
                    Após o pagamento, você será redirecionado automaticamente.
                </p>
            </div>
        `;
    }
}

window.copyPixCode = function() {
    const pixCode = document.getElementById('pix-code-text')?.textContent;
    if (pixCode) {
        navigator.clipboard.writeText(pixCode).then(() => {
            showNotification('Código PIX copiado!', 'success');
        }).catch(() => {
            showNotification('Erro ao copiar código', 'error');
        });
    }
};

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
    .payment-form {
        text-align: left;
    }
    .payment-info {
        background: #F8FAFC;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        text-align: center;
    }
    .payment-methods {
        margin-top: 1.5rem;
    }
    .method-options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.75rem;
    }
    .method-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border: 2px solid #E2E8F0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
    }
    .method-option:hover {
        border-color: #6366F1;
        background: #F8FAFC;
    }
    .method-option input[type="radio"]:checked + span {
        font-weight: 600;
        color: #6366F1;
    }
    .pix-payment {
        text-align: center;
    }
    .pix-code {
        background: #F8FAFC;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    .pix-code code {
        word-break: break-all;
        font-size: 0.75rem;
        display: block;
        margin-bottom: 10px;
    }
`;
document.head.appendChild(style);
