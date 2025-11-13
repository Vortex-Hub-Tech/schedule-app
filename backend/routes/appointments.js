const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTenant } = require('../middleware/tenant');
const axios = require('axios');

router.use(validateTenant);

router.get('/', async (req, res) => {
  try {
    const { phone, status, deviceId } = req.query;
    let query = `
      SELECT a.*, s.name as service_name, s.duration, s.price 
      FROM appointments a 
      JOIN services s ON a.service_id = s.id AND a.tenant_id = s.tenant_id
      WHERE a.tenant_id = $1
    `;
    const params = [req.tenantId];

    if (deviceId) {
      params.push(deviceId);
      query += ` AND a.device_id = $${params.length}`;
    }

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
    const { service_id, client_name, client_phone, appointment_date, appointment_time, notes, device_id } = req.body;
    
    const result = await pool.query(
      'INSERT INTO appointments (tenant_id, service_id, client_name, client_phone, appointment_date, appointment_time, notes, device_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.tenantId, service_id, client_name, client_phone, appointment_date, appointment_time, notes, device_id]
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
      `UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND tenant_id = $3 
       RETURNING a.*, s.name as service_name, s.duration, s.price 
       FROM appointments a
       JOIN services s ON a.service_id = s.id AND a.tenant_id = s.tenant_id`,
      [status, id, req.tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    const appointment = result.rows[0];
    
    // Enviar notificação via WhatsApp quando marcar como realizado
    if (status === 'realizado' && process.env.Z_API_URL && process.env.Z_API_TOKEN) {
      try {
        const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('pt-BR');
        const appointmentTime = appointment.appointment_time.substring(0, 5);
        
        await axios.post(
          `${process.env.Z_API_URL}/send-text`,
          {
            phone: appointment.client_phone,
            message: `✅ *Agendamento Confirmado - ${req.tenant.name}*\n\n` +
                     `Olá, *${appointment.client_name}*! 👋\n\n` +
                     `Seu agendamento foi *confirmado* com sucesso! 🎉\n\n` +
                     `📋 *Detalhes do Agendamento:*\n` +
                     `━━━━━━━━━━━━━━━━━━━━\n` +
                     `🔹 *Serviço:* ${appointment.service_name}\n` +
                     `🔹 *Data:* ${appointmentDate}\n` +
                     `🔹 *Horário:* ${appointmentTime}\n` +
                     `━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `Aguardamos você! 😊\n\n` +
                     `_Mensagem automática - ${req.tenant.name}_`
          },
          {
            headers: {
              'Client-Token': process.env.Z_API_TOKEN
            }
          }
        );
        console.log(`✅ Notificação de confirmação enviada para ${appointment.client_phone}`);
      } catch (error) {
        console.error('❌ Erro ao enviar notificação via Z-API:', error.message);
      }
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
