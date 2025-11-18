
const cron = require('node-cron');
const notificationService = require('../services/notifications');
const { vortexPool } = require('../db');

// Executa todos os dias às 10:00
const startReminderJob = () => {
  cron.schedule('0 10 * * *', async () => {
    console.log('🔔 Iniciando envio de lembretes automáticos...');
    
    try {
      const result = await vortexPool.query(
        `SELECT DISTINCT id FROM tenants WHERE status = 'active'`
      );
      
      for (const tenant of result.rows) {
        try {
          const reminderResult = await notificationService.sendDailyReminders(tenant.id);
          console.log(`✅ Lembretes enviados para ${tenant.id}: ${reminderResult.sent}/${reminderResult.total}`);
        } catch (error) {
          console.error(`❌ Erro ao enviar lembretes para ${tenant.id}:`, error.message);
        }
      }
      
      console.log('🎉 Processo de lembretes concluído!');
    } catch (error) {
      console.error('❌ Erro no job de lembretes:', error);
    }
  });
  
  console.log('✅ Job de lembretes automáticos iniciado (executa às 10:00 diariamente)');
};

module.exports = { startReminderJob };
