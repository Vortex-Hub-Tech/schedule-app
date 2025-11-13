const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const nitroSMS = require('../services/nitrosms');
const { validateTenant } = require('../middleware/tenant');

router.use(validateTenant);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Telefone é obrigatório' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'INSERT INTO validations (tenant_id, phone, code, expires_at) VALUES ($1, $2, $3, $4)',
      [req.tenantId, phone, code, expiresAt]
    );

    const message = `Código de Verificação - ${req.tenant.name}\n\n` +
                    `Olá!\n\n` +
                    `Seu código de verificação é:\n\n` +
                    `${code}\n\n` +
                    `Este código expira em 10 minutos.\n\n` +
                    `Não compartilhe este código com ninguém!`;

    const smsResult = await nitroSMS.sendSMS(req.tenantId, phone, message);
    
    if (!smsResult.success) {
      console.log(`⚠️ SMS não enviado, mas código foi gerado: ${code} para ${phone} (Tenant: ${req.tenant.name})`);
      console.log(`Erro: ${smsResult.error}`);
    }

    res.status(200).json({ 
      message: 'Código enviado com sucesso!',
      smsSent: smsResult.success,
      logId: smsResult.logId
    });
  } catch (error) {
    console.error('❌ Erro ao processar envio de código:', error.message);
    res.status(500).json({ error: 'Erro ao enviar código' });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Telefone e código são obrigatórios' });
    }

    const result = await pool.query(
      `SELECT * FROM validations WHERE tenant_id = $1 AND phone = $2 AND code = $3 AND verified = FALSE AND expires_at::timestamp > (NOW() AT TIME ZONE 'America/Sao_Paulo') ORDER BY created_at DESC LIMIT 1`,
      [req.tenantId, phone, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    await pool.query(
      'UPDATE validations SET verified = TRUE WHERE id = $1',
      [result.rows[0].id]
    );

    res.status(200).json({ message: 'Código verificado com sucesso!', verified: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar código' });
  }
});

module.exports = router;
