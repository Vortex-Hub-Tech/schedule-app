
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTenant } = require('../middleware/tenant');

router.use(validateTenant);

// Buscar mensagens de um agendamento
router.get('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { since } = req.query; // timestamp para polling

    let query = `
      SELECT id, message, is_client, status, created_at, updated_at
      FROM chat_messages
      WHERE tenant_id = $1 AND appointment_id = $2
    `;
    const params = [req.tenantId, appointmentId];

    if (since) {
      query += ` AND created_at > $3`;
      params.push(since);
    }

    query += ' ORDER BY created_at ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem
router.post('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { message, is_client } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Mensagem não pode ser vazia' });
    }

    // Verificar se o agendamento existe
    const appointmentCheck = await pool.query(
      'SELECT id FROM appointments WHERE id = $1 AND tenant_id = $2',
      [appointmentId, req.tenantId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    const result = await pool.query(
      `INSERT INTO chat_messages 
       (tenant_id, appointment_id, message, is_client, status) 
       VALUES ($1, $2, $3, $4, 'sent') 
       RETURNING id, message, is_client, status, created_at, updated_at`,
      [req.tenantId, appointmentId, message.trim(), is_client]
    );

    // Atualizar status para 'delivered' após 1 segundo (simular entrega)
    setTimeout(async () => {
      await pool.query(
        'UPDATE chat_messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['delivered', result.rows[0].id]
      );
    }, 1000);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Marcar mensagens como lidas
router.patch('/:appointmentId/read', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { is_client } = req.body;

    await pool.query(
      `UPDATE chat_messages 
       SET status = 'read', updated_at = CURRENT_TIMESTAMP 
       WHERE tenant_id = $1 
         AND appointment_id = $2 
         AND is_client = $3 
         AND status != 'read'`,
      [req.tenantId, appointmentId, !is_client]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' });
  }
});

module.exports = router;
