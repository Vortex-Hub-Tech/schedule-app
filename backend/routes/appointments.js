const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { validateTenant } = require('../middleware/tenant');
const nitroSMS = require('../services/nitrosms');
const { sendNotificationToOwner, sendNotificationToClient } = require('../services/pushNotifications');

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
      `INSERT INTO appointments (tenant_id, service_id, client_name, client_phone, appointment_date, appointment_time, notes, device_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [req.tenantId, service_id, client_name, client_phone, appointment_date, appointment_time, notes, device_id]
    );

    const appointment = result.rows[0];

    const serviceResult = await pool.query(
      'SELECT name FROM services WHERE id = $1 AND tenant_id = $2',
      [service_id, req.tenantId]
    );
    
    const serviceName = serviceResult.rows[0]?.name || 'Serviço';
    const appointmentDate = new Date(appointment_date).toLocaleDateString('pt-BR');
    const appointmentTime = appointment_time.substring(0, 5);

    try {
      await sendNotificationToOwner(
        req.tenantId,
        'Novo Agendamento!',
        `${client_name} agendou ${serviceName} para ${appointmentDate} às ${appointmentTime}`,
        { 
          type: 'new_appointment',
          appointmentId: appointment.id,
          clientName: client_name,
          service: serviceName,
          date: appointmentDate,
          time: appointmentTime
        }
      );
      console.log(`✅ Notificação push enviada ao prestador (tenant: ${req.tenantId})`);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação push ao prestador:', error);
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
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

    const queryText = `
      UPDATE appointments AS a
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      FROM services AS s
      WHERE a.id = $2
        AND a.tenant_id = $3
        AND a.service_id = s.id
        AND a.tenant_id = s.tenant_id
      RETURNING a.*, s.name AS service_name, s.duration, s.price;
    `;

    const values = [status, id, req.tenantId];

    // Monta a raw query para log (só debug)
    const rawQuery = queryText.replace(/\$(\d+)/g, (_, i) => {
      const val = values[i - 1];
      if (val === null || val === undefined) return 'NULL';
      return typeof val === 'string' ? `'${val}'` : val;
    });

    console.log('Raw Query:', rawQuery);

    const result = await pool.query(queryText, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    const appointment = result.rows[0];
    
    if (status === 'realizado') {
      try {
        const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('pt-BR');
        const appointmentTime = appointment.appointment_time.substring(0, 5);
        
        const message = `Agendamento Confirmado - ${req.tenant.name}\n\n` +
                       `Olá, ${appointment.client_name}!\n\n` +
                       `Seu agendamento foi confirmado com sucesso!\n\n` +
                       `Detalhes do Agendamento:\n` +
                       `Serviço: ${appointment.service_name}\n` +
                       `Data: ${appointmentDate}\n` +
                       `Horário: ${appointmentTime}\n\n` +
                       `Aguardamos você!\n\n` +
                       `Mensagem automática - ${req.tenant.name}`;

        const smsResult = await nitroSMS.sendSMS(req.tenantId, appointment.client_phone, message);
        
        if (smsResult.success) {
          console.log(`✅ Notificação de confirmação enviada para ${appointment.client_phone} (Log ID: ${smsResult.logId})`);
        } else {
          console.log(`⚠️ Não foi possível enviar notificação SMS: ${smsResult.error}`);
        }

        if (appointment.device_id) {
          try {
            await sendNotificationToClient(
              appointment.device_id,
              'Agendamento Confirmado!',
              `Seu agendamento de ${appointment.service_name} foi confirmado para ${appointmentDate} às ${appointmentTime}`,
              {
                type: 'appointment_confirmed',
                appointmentId: appointment.id,
                service: appointment.service_name,
                date: appointmentDate,
                time: appointmentTime
              }
            );
            console.log(`✅ Notificação push enviada ao cliente (device: ${appointment.device_id})`);
          } catch (error) {
            console.error('❌ Erro ao enviar notificação push ao cliente:', error);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao enviar notificação via NitroSMS:', error.message);
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
