const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTenant } = require('../middleware/tenant');

router.use(validateTenant);

router.get('/', async (req, res) => {
  try {
    const { phone, status } = req.query;
    let query = `
      SELECT a.*, s.name as service_name, s.duration, s.price 
      FROM appointments a 
      JOIN services s ON a.service_id = s.id AND a.tenant_id = s.tenant_id
      WHERE a.tenant_id = $1
    `;
    const params = [req.tenantId];

    if (phone) {
      params.push(phone);
      query += ` AND a.client_phone = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, s.name as service_name, s.duration, s.price 
       FROM appointments a 
       JOIN services s ON a.service_id = s.id AND a.tenant_id = s.tenant_id
       WHERE a.id = $1 AND a.tenant_id = $2`,
      [id, req.tenantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agendamento' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { service_id, client_name, client_phone, appointment_date, appointment_time, notes } = req.body;
    
    const result = await pool.query(
      'INSERT INTO appointments (tenant_id, service_id, client_name, client_phone, appointment_date, appointment_time, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.tenantId, service_id, client_name, client_phone, appointment_date, appointment_time, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pendente', 'realizado', 'cancelado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [status, id, req.tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM appointments WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, req.tenantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    res.json({ message: 'Agendamento removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover agendamento' });
  }
});

module.exports = router;
