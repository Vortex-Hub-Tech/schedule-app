
const nitroSMS = require('./nitrosms');
const { pool } = require('../db');
const { format, parseISO, subHours } = require('date-fns');
const { ptBR } = require('date-fns/locale');

class NotificationService {
  async sendAppointmentReminder(appointmentId) {
    try {
      const result = await pool.query(
        `SELECT a.*, s.name as service_name, t.name as tenant_name
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         JOIN tenants t ON a.tenant_id = t.id
         WHERE a.id = $1`,
        [appointmentId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Agendamento não encontrado' };
      }

      const appointment = result.rows[0];
      const appointmentDate = format(parseISO(appointment.appointment_date), "dd 'de' MMMM", { locale: ptBR });
      const appointmentTime = appointment.appointment_time.substring(0, 5);

      const message = `🔔 Lembrete - ${appointment.tenant_name}\n\n` +
                     `Olá, ${appointment.client_name}!\n\n` +
                     `Você tem um agendamento amanhã:\n\n` +
                     `📅 ${appointmentDate}\n` +
                     `🕐 ${appointmentTime}\n` +
                     `📋 ${appointment.service_name}\n\n` +
                     `Aguardamos você!\n\n` +
                     `Para cancelar, acesse o app.`;

      const smsResult = await nitroSMS.sendSMS(
        appointment.tenant_id,
        appointment.client_phone,
        message
      );

      if (smsResult.success) {
        await pool.query(
          `UPDATE appointments SET reminder_sent = true WHERE id = $1`,
          [appointmentId]
        );
      }

      return smsResult;
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDailyReminders(tenantId) {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT id FROM appointments
         WHERE tenant_id = $1
         AND appointment_date = $2
         AND status = 'pendente'
         AND (reminder_sent IS NULL OR reminder_sent = false)`,
        [tenantId, tomorrowStr]
      );

      const results = [];
      for (const row of result.rows) {
        const reminderResult = await this.sendAppointmentReminder(row.id);
        results.push({ appointmentId: row.id, ...reminderResult });
      }

      return {
        success: true,
        total: results.length,
        sent: results.filter(r => r.success).length,
        results
      };
    } catch (error) {
      console.error('Erro ao enviar lembretes diários:', error);
      return { success: false, error: error.message };
    }
  }

  async sendConfirmationSMS(appointmentId) {
    try {
      const result = await pool.query(
        `SELECT a.*, s.name as service_name, t.name as tenant_name
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         JOIN tenants t ON a.tenant_id = t.id
         WHERE a.id = $1`,
        [appointmentId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Agendamento não encontrado' };
      }

      const appointment = result.rows[0];
      const appointmentDate = format(parseISO(appointment.appointment_date), "dd/MM/yyyy");
      const appointmentTime = appointment.appointment_time.substring(0, 5);

      const message = `✅ Agendamento Confirmado - ${appointment.tenant_name}\n\n` +
                     `Olá, ${appointment.client_name}!\n\n` +
                     `Seu agendamento foi confirmado:\n\n` +
                     `📋 ${appointment.service_name}\n` +
                     `📅 ${appointmentDate}\n` +
                     `🕐 ${appointmentTime}\n\n` +
                     `Até breve!`;

      return await nitroSMS.sendSMS(
        appointment.tenant_id,
        appointment.client_phone,
        message
      );
    } catch (error) {
      console.error('Erro ao enviar confirmação:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();
